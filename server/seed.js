const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

db.connect();

async function seed() {
    // Create DB
    db.query("CREATE DATABASE IF NOT EXISTS lblend_db");
    db.query("USE lblend_db");

    // Create Table
    db.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'user') DEFAULT 'user',
        occupation VARCHAR(255),
        google_id VARCHAR(255),
        avatar VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const email = 'admin@admin.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (results && results.length === 0) {
            db.query("INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)", 
            ['Administrator', email, hashedPassword, 'admin', true], (err) => {
                if (err) console.error('Seeding error:', err);
                else console.log('Admin account created: admin@admin.com / admin');
                process.exit();
            });
        } else {
            console.log('Admin account already exists.');
            process.exit();
        }
    });
}

seed();
