require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));

// ==========================================
// ADMIN LOGIN
// ==========================================
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM Admin WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'Username ya password galat hai.' });
        }

        const admin = result.rows[0];

        // Check if password is bcrypt hash or plain text (for old accounts)
        let passwordMatch = false;
        if (admin.password.startsWith('$2')) {
            // Bcrypt hash
            passwordMatch = await bcrypt.compare(password, admin.password);
        } else {
            // Plain text (purane accounts ke liye)
            passwordMatch = (password === admin.password);
        }

        if (passwordMatch) {
            res.json({ success: true, token: 'shuqran_admin_token', user: admin.username });
        } else {
            res.json({ success: false, message: 'Username ya password galat hai.' });
        }
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// ADMIN LOGOUT
// ==========================================
app.post('/api/admin/logout', (req, res) => {
    res.json({ success: true });
});

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================
app.get('/api/admin/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM Property) AS "totalProperties",
                (SELECT COUNT(*) FROM UpcomingProject) AS "totalProjects",
                (SELECT COUNT(*) FROM MessageInquiry) AS "totalMessages",
                (SELECT COUNT(*) FROM ConstructionRequest) AS "totalConstruction"
        `);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// ==========================================
// ADMIN: CHANGE OWN USERNAME & PASSWORD
// ==========================================
app.post('/api/admin/change-credentials', async (req, res) => {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body;

    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
        return res.status(400).json({ success: false, message: 'Sab fields bharo.' });
    }

    try {
        // Verify current credentials
        const result = await pool.query(
            'SELECT * FROM Admin WHERE username = $1',
            [currentUsername]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'Purana username galat hai.' });
        }

        const admin = result.rows[0];
        let valid = false;
        if (admin.password.startsWith('$2')) {
            valid = await bcrypt.compare(currentPassword, admin.password);
        } else {
            valid = (currentPassword === admin.password);
        }

        if (!valid) {
            return res.json({ success: false, message: 'Purana password galat hai.' });
        }

        // Check if new username already exists (different account)
        if (newUsername !== currentUsername) {
            const exists = await pool.query(
                'SELECT admin_id FROM Admin WHERE username = $1',
                [newUsername]
            );
            if (exists.rows.length > 0) {
                return res.json({ success: false, message: 'Yeh username pehle se exist karta hai.' });
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update credentials
        await pool.query(
            'UPDATE Admin SET username = $1, password = $2 WHERE admin_id = $3',
            [newUsername, hashedPassword, admin.admin_id]
        );

        res.json({ success: true, message: 'Username aur password successfully update ho gaya!' });
    } catch (err) {
        console.error('Change Credentials Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
