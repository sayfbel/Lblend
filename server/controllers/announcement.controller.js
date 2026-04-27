const db = require('../db');
const { createNotification } = require('./notification.controller');

exports.createAnnouncement = (req, res) => {
    const { user_id, project_name, description, github_url, help_needed } = req.body;
    db.query("INSERT INTO announcements (user_id, project_name, description, github_url, help_needed) VALUES (?, ?, ?, ?, ?)", 
    [user_id, project_name, description, github_url, help_needed], (err, results) => {
        if (err) return res.status(500).send(err);
        const projectId = results.insertId;

        // TACTICAL AUTO-INITIALIZATION: Only for non-GitHub missions or fallbacks
        if (!github_url || !github_url.includes('github.com')) {
            db.query("INSERT INTO branches (project_id, name, user_id) VALUES (?, 'main', ?)", 
            [projectId, user_id], (errBranch, branchRes) => {
                if (!errBranch) {
                    const branchId = branchRes.insertId;
                    db.query("INSERT INTO commits (branch_id, message, user_id) VALUES (?, 'Genesis: Project Initialized', ?)", 
                    [branchId, user_id]);
                }
            });
        }
        
        // Notify all other users about the new announcement
        db.query("SELECT id FROM users WHERE id != ?", [user_id], (err2, users) => {
            if (!err2) {
                users.forEach(u => {
                    createNotification(u.id, `New Mission Broadcast: ${project_name} is now live!`, 'broadcast');
                });
            }
        });

        res.status(201).send({ message: "Mission Broadcasted and Initialized!", id: projectId });
    });
};

exports.getAllAnnouncements = (req, res) => {
    const { userId } = req.query;
    let query = `
        SELECT a.*, u.username, u.occupation, COALESCE(u.google_avatar, u.avatar) AS avatar 
        FROM announcements a 
        JOIN users u ON a.user_id = u.id 
    `;
    let params = [];

    if (userId) {
        query = `
            SELECT a.*, u.username, u.occupation, COALESCE(u.google_avatar, u.avatar) AS avatar, pm.is_blocked as my_block_status, pm.id as membership_id
            FROM announcements a 
            JOIN users u ON a.user_id = u.id 
            LEFT JOIN project_members pm ON a.id = pm.announcement_id AND pm.user_id = ?
        `;
        params.push(userId);
    }

    query += " ORDER BY a.created_at DESC";

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.getUserAnnouncements = (req, res) => {
    const { userId } = req.params;
    db.query("SELECT * FROM announcements WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.updateAnnouncement = (req, res) => {
    const { id } = req.params;
    const { project_name, description, help_needed, github_url } = req.body;
    
    // FETCH EXISTING URL TO HANDLE FILE CLEANUP
    db.query("SELECT github_url FROM announcements WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        
        const oldUrl = results[0]?.github_url;
        
        db.query("UPDATE announcements SET project_name = ?, description = ?, help_needed = ?, github_url = ? WHERE id = ?", 
        [project_name, description, help_needed, github_url, id], (updateErr) => {
            if (updateErr) return res.status(500).send(updateErr);
            
            // DELETE OLD FILE FROM DISK IF CHANGED
            if (oldUrl && oldUrl !== github_url && oldUrl.startsWith('http://localhost:5000/datafiles/')) {
                const fs = require('fs');
                const path = require('path');
                const filename = oldUrl.split('/').pop();
                const filepath = path.join(__dirname, '..', 'datafiles', filename);
                fs.unlink(filepath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting old mission file:", unlinkErr);
                });
            }
            
            res.status(200).send({ message: "Mission Parameters Updated." });
        });
    });
};

exports.deleteAnnouncement = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM announcements WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Mission Decommissioned." });
    });
};
