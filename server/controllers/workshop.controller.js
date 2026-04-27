const db = require('../db');
const { createNotification } = require('./notification.controller');

exports.createBranch = (req, res) => {
    const { project_id, name, user_id } = req.body;
    db.query("INSERT INTO branches (project_id, name, user_id) VALUES (?, ?, ?)", [project_id, name, user_id], (err, result) => {
        if (err) return res.status(500).send(err);
        
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
    const query = `
        SELECT b.*, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar, u.occupation 
        FROM branches b 
        LEFT JOIN users u ON b.user_id = u.id 
        WHERE b.project_id = ?
    `;
    db.query(query, [projectId], (err, results) => {
        if (err) return res.status(500).send(err);
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
