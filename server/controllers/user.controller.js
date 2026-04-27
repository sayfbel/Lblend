const db = require('../db');

exports.getAllUsers = (req, res) => {
    const query = `
        SELECT id, username, email, occupation, description, 
        COALESCE(google_avatar, avatar) AS avatar, created_at 
        FROM users 
        WHERE is_verified = TRUE
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.getUserPortfolio = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT a.*, 
        (SELECT COUNT(*) FROM branches WHERE project_id = a.id) as branch_count,
        (SELECT COUNT(*) FROM project_members WHERE announcement_id = a.id AND is_accepted = TRUE) as member_count
        FROM announcements a
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};
