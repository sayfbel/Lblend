const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Controllers ---
const announcementController = require('./controllers/announcement.controller');
const workshopController = require('./controllers/workshop.controller');
const intelligenceController = require('./controllers/intelligence.controller');
const notificationController = require('./controllers/notification.controller');
const userController = require('./controllers/user.controller');
const githubController = require('./controllers/github.controller');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({ secret: 'session-secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// MySQL Connection Pool
const db = require('./db');

// Check connection and run init queries
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL Database: ' + process.env.DB_NAME);
        connection.release();
        
        // Auto-update schema for new features
        const queries = [
            "CREATE TABLE IF NOT EXISTS commit_connections (id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, from_commit_id VARCHAR(50) NOT NULL, from_side VARCHAR(10) NOT NULL, to_commit_id VARCHAR(50) NOT NULL, to_side VARCHAR(10) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES announcements(id) ON DELETE CASCADE);",
        ];
        
        queries.forEach(q => db.query(q, (e) => e && console.error('DB Init Error:', e.message)));
        
        // Use separate query for columns
        db.query("SHOW COLUMNS FROM announcements LIKE 'pos_x'", (err, res) => {
            if (res && res.length === 0) {
                db.query("ALTER TABLE announcements ADD COLUMN pos_x FLOAT DEFAULT 0");
                db.query("ALTER TABLE announcements ADD COLUMN pos_y FLOAT DEFAULT 0");
            }
        });
        db.query("SHOW COLUMNS FROM commits LIKE 'pos_x'", (err, res) => {
            if (res && res.length === 0) {
                db.query("ALTER TABLE commits ADD COLUMN pos_x FLOAT DEFAULT 0");
                db.query("ALTER TABLE commits ADD COLUMN pos_y FLOAT DEFAULT 0");
            }
        });
    }
});

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// Passport Google Strategy (Existing restriction logic)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
}, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const google_id = profile.id;
    const avatar = profile.photos[0].value;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return done(err);
        if (results.length === 0) {
            return done(null, false, { 
                action: 'register',
                email: email,
                google_id: google_id,
                avatar: avatar,
                username: profile.displayName || email.split('@')[0]
            });
        }
        
        const user = results[0];

        // ADDED: Check if the manual account is verified before allowing Google link/login
        if (!user.is_verified) {
            return done(null, false, { message: "Account not verified. Please check your Gmail for the code." });
        }

        if (!user.google_id) {
            db.query("UPDATE users SET google_id = ?, avatar = ?, google_avatar = ? WHERE id = ?", [google_id, avatar, avatar, user.id]);
        }

        return done(null, user);
    });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- API Routes ---

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            if (info && info.action === 'register') {
                const token = jwt.sign({ 
                    email: info.email, 
                    google_id: info.google_id, 
                    avatar: info.avatar,
                    username: info.username
                }, process.env.JWT_SECRET, { expiresIn: '15m' });
                return res.redirect(`${process.env.FRONTEND_URL}/register?google_token=${token}`);
            }
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(info.message || "Authentication failed")}`);
        }
        
        req.logIn(user, (err) => {
            if (err) return next(err);
            const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
        });
    })(req, res, next);
});

// Register with 6-Digit Code
app.post('/api/register', async (req, res) => {
    const { username, email, password, occupation } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.query("INSERT INTO users (username, email, password, role, occupation, verification_token) VALUES (?, ?, ?, ?, ?, ?)", 
    [username, email, hashedPassword, 'user', occupation, verificationCode], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: "Email already exists" });
            return res.status(500).send({ message: "Database error", details: err.message });
        }
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: `Your Verification Code - L'blend`,
            html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcfcfc; padding: 40px; color: #004842;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);">
                    <div style="background-color: #004842; padding: 40px; text-align: center;">
                        <div style="display: inline-flex; gap: 6px; margin-bottom: 20px;">
                            <div style="width: 15px; height: 15px; background-color: #E6D04C; border-radius: 2px;"></div>
                            <div style="width: 15px; height: 15px; background-color: #E6D04C; border-radius: 2px;"></div>
                            <div style="width: 15px; height: 15px; background-color: #E6D04C; border-radius: 2px;"></div>
                        </div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900;">L'BLEND</h1>
                    </div>
                    <div style="padding: 50px; text-align: center;">
                        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 10px;">Welcome to the Community</h2>
                        <p style="color: #64748b; font-size: 16px; font-weight: 500; margin-top: 0;">Your unique verification code is below.</p>
                        
                        <div style="margin: 40px 0; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px dashed #E6D04C; display: inline-block;">
                            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #004842;">${verificationCode}</span>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">This code will expire in 10 minutes for your security.</p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid rgba(0,0,0,0.05);">
                        <p style="font-size: 12px; font-weight: 700; color: #a0c4c1; letter-spacing: 1px; margin: 0; text-transform: uppercase;">L'blend / Digital Operations Hub</p>
                    </div>
                </div>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.log('Email error:', error);
        });

        res.status(201).send({ message: "Registration initiated! Check your Gmail for the 6-digit code." });
    });
});

// Complete Google Registration
app.post('/api/register-google', async (req, res) => {
    const { google_token, password, occupation } = req.body;
    
    try {
        const decoded = jwt.verify(google_token, process.env.JWT_SECRET);
        const { email, google_id, avatar, username } = decoded;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query("INSERT INTO users (username, email, password, role, occupation, google_id, avatar, google_avatar, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
        [username, email, hashedPassword, 'user', occupation, google_id, avatar, avatar, true], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: "Email already exists" });
                return res.status(500).send({ message: "Database error", details: err.message });
            }
            
            res.status(201).send({ message: "Google Registration successful! You can now log in." });
        });
    } catch (error) {
        return res.status(400).send({ message: "Invalid or expired Google registration session." });
    }
});

// Resend Verification Code
app.post('/api/resend-code', (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.query("UPDATE users SET verification_token = ? WHERE email = ? AND is_verified = FALSE", 
    [verificationCode, email], (err, results) => {
        if (err) return res.status(500).send({ message: "Database error", details: err.message });
        if (results.affectedRows === 0) return res.status(400).send({ message: "User not found or already verified" });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: `Your New Verification Code - L'blend`,
            html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcfcfc; padding: 40px; color: #004842;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);">
                    <div style="background-color: #004842; padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900;">L'BLEND</h1>
                    </div>
                    <div style="padding: 50px; text-align: center;">
                        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 10px;">Verification Code Resent</h2>
                        <div style="margin: 40px 0; background-color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px dashed #E6D04C; display: inline-block;">
                            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #004842;">${verificationCode}</span>
                        </div>
                    </div>
                </div>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.log('Email error:', error);
        });

        res.status(200).send({ message: "New verification code has been dispatched." });
    });
});

// Verify 6-Digit Code
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    db.query("SELECT * FROM users WHERE email = ? AND verification_token = ?", [email, code], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send({ message: "Invalid or expired verification code." });
        }
        
        db.query("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = ?", [email], (err) => {
            if (err) return res.status(500).send({ message: "Error updating account" });
            res.status(200).send({ message: "Account verified successfully! You can now login." });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send({ message: "User not found" });

        const user = results[0];
        if (!user.is_verified) {
            return res.status(401).send({ message: "Account not verified. Please check your Gmail for the code." });
        }

        if (user.password) {
            const passwordIsValid = await bcrypt.compare(password, user.password);
            if (!passwordIsValid) return res.status(401).send({ message: "Invalid Password" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).send({ 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role, 
            accessToken: token, 
            occupation: user.occupation,
            avatar: user.avatar,
            description: user.description
        });
    });
});

app.get('/api/users', userController.getAllUsers);
app.get('/api/users/:id/portfolio', userController.getUserPortfolio);

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, occupation, avatar, description } = req.body;
    console.log('SYNC REQUEST:', { id, username, occupation, avatar, description });
    db.query("UPDATE users SET username = ?, occupation = ?, avatar = ?, description = ? WHERE id = ?", [username, occupation, avatar, description, id], (err) => {
        if (err) {
            console.error('SYNC FAILURE:', err);
            return res.status(500).send({ message: "Failed to update identity." });
        }
        console.log('SYNC SUCCESS');
        res.status(200).send({ message: "Identity Synchronized." });
    });
});

const path = require('path');
const multer = require('multer');

// --- Storage Manifest ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
}).single('avatar');

// Authorize Static Asset Broadcasting
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Identity Image Transmission Route
app.post('/api/upload', (req, res) => {
    uploadAvatar(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send({ message: "File is too large. Max size is 5MB." });
            }
            return res.status(400).send({ message: err.message });
        } else if (err) {
            return res.status(500).send({ message: "Unknown error occurred during file upload." });
        }
        
        if (!req.file) return res.status(400).send({ message: "No file detected." });
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        res.status(200).send({ imageUrl });
    });
});

// --- Datafiles Storage Manifest with Size Control (10MB) ---
const datafilesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'datafiles/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadDatafile = multer({ 
    storage: datafilesStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('file');

app.use('/datafiles', express.static(path.join(__dirname, 'datafiles')));

app.post('/api/upload-datafile', (req, res) => {
    uploadDatafile(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send({ message: "File is too large. Max size is 10MB." });
            }
            return res.status(400).send({ message: err.message });
        } else if (err) {
            return res.status(500).send({ message: "Unknown error occurred during file upload." });
        }

        if (!req.file) return res.status(400).send({ message: "No file detected." });
        const fileUrl = `http://localhost:5000/datafiles/${req.file.filename}`;
        res.status(200).send({ fileUrl });
    });
});

// Notifications
app.get('/api/notifications/:userId', notificationController.getNotifications);
app.post('/api/notifications/read', notificationController.markAsRead);

// Announcements
app.post('/api/announcements', announcementController.createAnnouncement);
app.get('/api/announcements', announcementController.getAllAnnouncements);
app.get('/api/announcements/user/:userId', announcementController.getUserAnnouncements);
app.put('/api/announcements/:id', announcementController.updateAnnouncement);
app.delete('/api/announcements/:id', announcementController.deleteAnnouncement);

// Workshop (Internal Git)
app.post('/api/workshop/branches', workshopController.createBranch);
app.get('/api/workshop/branches/:projectId', workshopController.getBranches);
app.put('/api/workshop/branches/:id', workshopController.renameBranch);
app.delete('/api/workshop/branches/:id', workshopController.deleteBranch);
app.post('/api/workshop/commits', workshopController.createCommit);
app.get('/api/workshop/commits/:branchId', workshopController.getCommits);
app.put('/api/workshop/commits/:id', workshopController.updateCommit);
app.delete('/api/workshop/commits/:id', workshopController.deleteCommit);
app.post('/api/workshop/schema', workshopController.saveSchema);
app.get('/api/workshop/schema/:projectId', workshopController.getSchemaConnections);
app.get('/api/workshop/all-commits/:projectId', workshopController.getAllProjectCommits);


// GitHub Analysis
app.get('/api/github/analyze', githubController.analyzeRepo);
app.post('/api/github/sync', githubController.syncRepo);

// Figma oEmbed Endpoint
app.post('/api/figma/oembed', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        const axios = require('axios');
        const figmaRes = await axios.get(`https://www.figma.com/api/oembed?url=${encodeURIComponent(url)}`);
        res.status(200).json(figmaRes.data);
    } catch (error) {
        console.error('Figma oEmbed Error:', error.message);
        res.status(400).json({ error: 'Failed to fetch Figma data. File may be private or invalid.' });
    }
});

// Design Platform Metadata Endpoint (Figma, XD, Behance, etc.)
app.post('/api/design/metadata', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const axios = require('axios');
        console.log(`Scraping metadata for: ${url}`);
        
        // Use a real browser user-agent to avoid being blocked by Behance/others
        const xdRes = await axios.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            timeout: 8000 // 8 second timeout
        });
        const html = xdRes.data;
        
        // Extract og:image
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        
        if (!imageMatch && !titleMatch) {
            console.warn(`No metadata found for URL: ${url}`);
        }

        res.status(200).json({
            thumbnail_url: imageMatch ? imageMatch[1] : null,
            title: titleMatch ? titleMatch[1] : 'Design Project'
        });
    } catch (error) {
        console.error(`Design Metadata Error [${url}]:`, error.message);
        // Return 200 with nulls instead of 400 to prevent frontend crashes, 
        // but log it so we know it's failing.
        res.status(200).json({
            thumbnail_url: null,
            title: 'Design Project (Metadata unavailable)',
            error: error.message
        });
    }
});

// Intelligence (Communication Hub)
app.post('/api/intelligence/join', intelligenceController.joinProject);
app.post('/api/intelligence/leave', intelligenceController.leaveProject);
app.get('/api/intelligence/projects/:userId', intelligenceController.getUserProjects);
app.get('/api/intelligence/members/:projectId', intelligenceController.getProjectMembers);
app.get('/api/intelligence/requests/:projectId', intelligenceController.getPendingRequests);
app.post('/api/intelligence/accept', intelligenceController.acceptMember);
app.post('/api/intelligence/toggle-block', intelligenceController.toggleMemberBlock);
app.post('/api/intelligence/status', intelligenceController.toggleProjectStatus);
app.post('/api/intelligence/messages', intelligenceController.sendMessage);
app.get('/api/intelligence/messages/:projectId', intelligenceController.getMessages);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
