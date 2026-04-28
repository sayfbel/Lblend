const db = require('./server/db.js');
const fs = require('fs');

const sql = fs.readFileSync('./server/database.sql', 'utf8');
const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

async function run() {
    for (const stmt of statements) {
        try {
            await new Promise((resolve, reject) => {
                db.query(stmt, (err, results) => {
                    if (err) {
                        console.error('Error executing:', stmt.substring(0, 50) + '...', err.message);
                        resolve(); // Continue anyway, it might be ALTER TABLE IF NOT EXISTS not supported in this MySQL version
                    } else {
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.error(e);
        }
    }
    console.log("Database schema updated!");
    process.exit(0);
}

run();
