const db = require('../db');

exports.getNotifications = (req, res) => {
    const { userId } = req.params;
    db.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
};

exports.markAsRead = (req, res) => {
    const { notificationId } = req.body;
    db.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [notificationId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: "Notification cleared." });
    });
};

exports.createNotification = (userId, message, type) => {
    db.query("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)", [userId, message, type]);
};
