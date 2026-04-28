const db = require('../db');
const { createNotification } = require('./notification.controller');

// Auto-migration: Ensure 'type' column exists in branches table
db.query("SHOW COLUMNS FROM branches LIKE 'type'", (err, results) => {
    if (!err && results.length === 0) {
        console.log("Migrating branches table: adding 'type' column...");
        db.query("ALTER TABLE branches ADD COLUMN type ENUM('DESIGN', 'DEVELOP') DEFAULT 'DEVELOP'", (err2) => {
            if (err2) console.error("Auto-migration failed:", err2);
            else console.log("Migration successful: 'type' column added.");
        });
    }
});

exports.createBranch = (req, res) => {
    const { project_id, name, user_id, type } = req.body;
    db.query("INSERT INTO branches (project_id, name, user_id, type) VALUES (?, ?, ?, ?)", [project_id, name, user_id, type || 'DEVELOP'], (err, result) => {
        if (err) {
            console.error("CREATE BRANCH ERROR:", err);
            // Fallback for missing column
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                return db.query("INSERT INTO branches (project_id, name, user_id) VALUES (?, ?, ?)", [project_id, name, user_id], (err2, result2) => {
                    if (err2) return res.status(500).send(err2);
                    res.status(201).send({ message: "Branch created (fallback)!", id: result2.insertId });
                });
            }
            return res.status(500).send(err);
        }
        
        // Notify all team members about the new branch
        db.query("SELECT user_id FROM project_members WHERE announcement_id = ? AND is_accepted = TRUE AND user_id != ?", [project_id, user_id], (err2, members) => {
            if (!err2) {
                db.query("SELECT username FROM users WHERE id = ?", [user_id], (err3, u) => {
                   const author = u[0]?.username || "A teammate";
                   members.forEach(m => createNotification(m.user_id, `${author} created a new branch: ${name}`, 'branch'));
                });
            }
        });

        res.status(201).send({ message: "Branch created!", id: result.insertId });
    });
};

exports.getBranches = (req, res) => {
    const { projectId } = req.params;
    const { type } = req.query;
    
    let query = `
        SELECT b.*, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar, u.occupation 
        FROM branches b 
        LEFT JOIN users u ON b.user_id = u.id 
        WHERE b.project_id = ?
    `;
    const params = [projectId];

    if (type) {
        query += " AND b.type = ?";
        params.push(type);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("GET BRANCHES ERROR:", err);
            // If it's a column missing error, return empty instead of 500 to keep UI alive
            if (err.code === 'ER_BAD_FIELD_ERROR') return res.status(200).send([]);
            return res.status(500).send(err);
        }
        res.status(200).send(results);
    });
};

exports.createCommit = (req, res) => {
    const { branch_id, message, user_id, file_url } = req.body;
    db.query("INSERT INTO commits (branch_id, message, user_id, file_url) VALUES (?, ?, ?, ?)", [branch_id, message, user_id, file_url || null], (err) => {
        if (err) {
            console.error("CREATE COMMIT ERROR:", err);
            return res.status(500).send(err);
        }
        
        // Get branch and project info for notification
        db.query("SELECT b.name as branch_name, b.project_id, a.project_name FROM branches b JOIN announcements a ON b.project_id = a.id WHERE b.id = ?", [branch_id], (err2, bData) => {
            if (!err2 && bData.length > 0) {
                const { branch_name, project_id, project_name } = bData[0];
                db.query("SELECT user_id FROM project_members WHERE announcement_id = ? AND is_accepted = TRUE AND user_id != ?", [project_id, user_id], (err3, members) => {
                    if (!err3) {
                        db.query("SELECT username FROM users WHERE id = ?", [user_id], (err4, u) => {
                            const author = u[0]?.username || "A teammate";
                            members.forEach(m => createNotification(m.user_id, `${author} added a commit to ${branch_name} in ${project_name}`, 'commit'));
                        });
                    }
                });
            }
        });

        res.status(201).send({ message: "Commit added!" });
    });
};

exports.getCommits = (req, res) => {
    const { branchId } = req.params;
    const query = `
        SELECT c.*, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar, u.occupation 
        FROM commits c 
        LEFT JOIN users u ON c.user_id = u.id 
        WHERE c.branch_id = ? 
        ORDER BY c.created_at DESC
    `;
    db.query(query, [branchId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.renameBranch = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).send({ message: "Branch name is required" });
    db.query("UPDATE branches SET name = ? WHERE id = ?", [name, id], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Branch renamed!" });
    });
};

exports.deleteBranch = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM branches WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Branch deleted!" });
    });
};

exports.updateCommit = (req, res) => {
    const { id } = req.params;
    const { message, file_url } = req.body;
    if (!message) return res.status(400).send({ message: "Commit message is required" });

    // If file_url is undefined, we only update the message. 
    // If it's null, we clear the file. If it's a string, we update it.
    const query = file_url !== undefined 
        ? "UPDATE commits SET message = ?, file_url = ? WHERE id = ?" 
        : "UPDATE commits SET message = ? WHERE id = ?";
    const params = file_url !== undefined ? [message, file_url, id] : [message, id];

    db.query(query, params, (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Commit updated!" });
    });
};

exports.deleteCommit = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM commits WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Commit deleted!" });
    });
};

exports.saveSchema = (req, res) => {
    const { projectId, positions, connections } = req.body;
    // positions: { [commitId]: { x, y } }
    // connections: [{ fromId, fromSide, toId, toSide }]

    db.beginTransaction((err) => {
        if (err) return res.status(500).send(err);

        // 1. Update positions
        const updatePromises = Object.keys(positions || {}).map(id => {
            return new Promise((resolve, reject) => {
                const pos = positions[id];
                if (id === 'principal') {
                    db.query("UPDATE announcements SET pos_x=?, pos_y=? WHERE id=?", [pos.x, pos.y, projectId], (e) => e ? reject(e) : resolve());
                } else {
                    db.query("UPDATE commits SET pos_x=?, pos_y=? WHERE id=?", [pos.x, pos.y, id], (e) => e ? reject(e) : resolve());
                }
            });
        });

        // 2. Clear existing connections
        const clearConnections = new Promise((resolve, reject) => {
            db.query("DELETE FROM commit_connections WHERE project_id = ?", [projectId], (e) => e ? reject(e) : resolve());
        });

        Promise.all([...updatePromises, clearConnections])
            .then(() => {
                if (connections && connections.length > 0) {
                    const values = connections.map(c => [projectId, c.fromId, c.fromSide, c.toId, c.toSide]);
                    db.query("INSERT INTO commit_connections (project_id, from_commit_id, from_side, to_commit_id, to_side) VALUES ?", [values], (e) => {
                        if (e) return db.rollback(() => { res.status(500).send(e); });
                        db.commit((err) => {
                            if (err) return db.rollback(() => { res.status(500).send(err); });
                            res.status(200).send({ message: "Schema saved!" });
                        });
                    });
                } else {
                    db.commit((err) => {
                        if (err) return db.rollback(() => { res.status(500).send(err); });
                        res.status(200).send({ message: "Schema saved!" });
                    });
                }
            })
            .catch(err => {
                db.rollback(() => { res.status(500).send(err); });
            });
    });
};

exports.getSchemaConnections = (req, res) => {
    const { projectId } = req.params;
    db.query("SELECT * FROM commit_connections WHERE project_id = ?", [projectId], (err, results) => {
        if (err) return res.status(500).send(err);
        const connections = results.map(r => ({
            fromId: isNaN(r.from_commit_id) ? r.from_commit_id : parseInt(r.from_commit_id),
            fromSide: r.from_side,
            toId: isNaN(r.to_commit_id) ? r.to_commit_id : parseInt(r.to_commit_id),
            toSide: r.to_side
        }));
        res.status(200).send(connections);
    });
};
