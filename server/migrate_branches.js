const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lblend_db'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected.');
    db.query("ALTER TABLE branches ADD COLUMN IF NOT EXISTS type ENUM('DESIGN', 'DEVELOP') DEFAULT 'DEVELOP';", (err) => {
        if (err) console.error('Migration failed:', err);
        else console.log('Migration successful.');
        db.end();
    });
});
