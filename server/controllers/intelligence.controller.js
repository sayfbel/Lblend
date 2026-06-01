const db = require('../db');
const { createNotification } = require('./notification.controller');

exports.joinProject = (req, res) => {
    const { announcement_id, user_id } = req.body;
    db.query("INSERT IGNORE INTO project_members (announcement_id, user_id, is_accepted) VALUES (?, ?, FALSE)", [announcement_id, user_id], (err) => {
        if (err) return res.status(500).send(err);
        
        // Notify project owner
        db.query("SELECT user_id, project_name FROM announcements WHERE id = ?", [announcement_id], (err2, results) => {
            if (!err2 && results.length > 0) {
                db.query("SELECT username FROM users WHERE id = ?", [user_id], (err3, userRes) => {
                    const applicant = userRes[0]?.username || "A recruit";
                    createNotification(results[0].user_id, `${applicant} has requested clearance for mission ${results[0].project_name}.`, 'request');
                });
            }
        });

        res.status(200).send({ message: "Mission Engaged. Proceed to Intelligence." });
    });
};

exports.leaveProject = (req, res) => {
    const { announcement_id, user_id } = req.body;
    db.query("DELETE FROM project_members WHERE announcement_id = ? AND user_id = ?", [announcement_id, user_id], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Left collaboration successfully." });
    });
};

exports.getUserProjects = (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT DISTINCT a.*, u.username as owner_name, u.occupation as owner_occupation, pm.is_accepted as membership_accepted,
            (SELECT COUNT(*) FROM branches b WHERE b.project_id = a.id) as branch_count,
            (SELECT COUNT(*) FROM project_members pmem WHERE pmem.announcement_id = a.id AND pmem.is_accepted = 1) as member_count
        FROM announcements a
        LEFT JOIN project_members pm ON a.id = pm.announcement_id AND pm.user_id = ?
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ? OR (pm.user_id = ? AND pm.is_blocked = 0)
        ORDER BY a.created_at DESC
    `;
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.getProjectMembers = (req, res) => {
    const { projectId } = req.params;
    const query = `
        SELECT DISTINCT pm.user_id, pm.id as member_log_id, pm.is_blocked, pm.is_accepted, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar, u.occupation 
        FROM project_members pm 
        JOIN users u ON pm.user_id = u.id 
        WHERE pm.announcement_id = ?
    `;
    db.query(query, [projectId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.getPendingRequests = (req, res) => {
    const { projectId } = req.params;
    const query = `
        SELECT pm.*, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar, u.occupation 
        FROM project_members pm 
        JOIN users u ON pm.user_id = u.id 
        WHERE pm.announcement_id = ? AND pm.is_accepted = FALSE
    `;
    db.query(query, [projectId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.acceptMember = (req, res) => {
    const { memberLogId } = req.body;
    db.query("SELECT announcement_id, user_id FROM project_members WHERE id = ?", [memberLogId], (err, m) => {
        if (!err && m.length > 0) {
            const { announcement_id, user_id } = m[0];
            db.query("UPDATE project_members SET is_accepted = TRUE WHERE id = ?", [memberLogId], (err2) => {
                if (err2) return res.status(500).send(err2);
                
                // Notify user
                db.query("SELECT project_name FROM announcements WHERE id = ?", [announcement_id], (err3, a) => {
                    if (!err3 && a.length > 0) {
                        createNotification(user_id, `Clearance Granted: You are now an active member of ${a[0].project_name}!`, 'acceptance');
                    }
                });

                res.status(200).send({ message: "Clearance Granted." });
            });
        } else {
            res.status(404).send({ message: "Member log not found." });
        }
    });
};

exports.toggleMemberBlock = (req, res) => {
    const { memberLogId, status } = req.body;
    db.query("UPDATE project_members SET is_blocked = ? WHERE id = ?", [status, memberLogId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: status ? "Member neutralized." : "Member restored." });
    });
};

exports.toggleProjectStatus = (req, res) => {
    const { projectId, status } = req.body;
    db.query("UPDATE announcements SET is_active = ? WHERE id = ?", [status, projectId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: status ? "Mission Reactivated." : "Mission Locked." });
    });
};

exports.sendMessage = (req, res) => {
    const { announcement_id, user_id, message } = req.body;
    db.query("INSERT INTO project_messages (announcement_id, user_id, message) VALUES (?, ?, ?)", 
    [announcement_id, user_id, message], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Intelligence Transmitted." });
    });
};

exports.getMessages = (req, res) => {
    const { projectId } = req.params;
    const query = `
        SELECT pm.*, u.username, COALESCE(u.google_avatar, u.avatar) AS avatar 
        FROM project_messages pm 
        JOIN users u ON pm.user_id = u.id 
        WHERE pm.announcement_id = ? 
        ORDER BY pm.created_at ASC
    `;
    db.query(query, [projectId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};
