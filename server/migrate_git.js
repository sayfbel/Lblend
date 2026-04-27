const db = require('./db');

const migrate = async () => {
    const queries = [
        `CREATE TABLE IF NOT EXISTS branches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES announcements(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS commits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            branch_id INT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
        )`
    ];

    for (let q of queries) {
        db.query(q, (err) => {
            if (err) console.error('Migration error:', err);
            else console.log('Internal Git table ready.');
        });
    }
};

migrate();
setTimeout(() => process.exit(), 3000);
