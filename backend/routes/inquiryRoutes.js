const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. GET ALL CONSTRUCTION REQUESTS
router.get('/construction', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cr.*, c.phone_no
            FROM ConstructionRequest cr
            LEFT JOIN Client c ON cr.client_id = c.client_id
            ORDER BY cr.submitted_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADD CONSTRUCTION REQUEST
router.post('/construction/add', async (req, res) => {
    const { name, phone, location, type, details } = req.body;

    if (!name || !phone || !location || !type || !details) {
        return res.status(400).json({ success: false, error: 'Sab fields bharo.' });
    }

    try {
        // Check if client exists
        let clientResult = await pool.query('SELECT client_id FROM Client WHERE phone_no = $1', [phone]);

        let clientId;
        if (clientResult.rows.length === 0) {
            const newClient = await pool.query(
                'INSERT INTO Client (full_name, phone_no) VALUES ($1, $2) RETURNING client_id',
                [name, phone]
            );
            clientId = newClient.rows[0].client_id;
        } else {
            clientId = clientResult.rows[0].client_id;
        }

        await pool.query(
            `INSERT INTO ConstructionRequest (client_id, client_name, plot_location, plot_size, requirements, status)
             VALUES ($1, $2, $3, $4, $5, 'Pending')`,
            [clientId, name, location, type, details]
        );

        res.json({ success: true, message: 'Construction request receive ho gayi!' });
    } catch (err) {
        console.error('Construction Add Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. UPDATE CONSTRUCTION STATUS
router.put('/construction/status/:id', async (req, res) => {
    const { status } = req.body;
    const allowed = ['Pending', 'Seen', 'Approved', 'Completed', 'Rejected'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status.' });
    }
    try {
        await pool.query('UPDATE ConstructionRequest SET status = $1 WHERE request_id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. DELETE CONSTRUCTION REQUEST
router.delete('/construction/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ConstructionRequest WHERE request_id = $1', [req.params.id]);
        res.json({ success: true, message: 'Request delete ho gayi.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. ADD MESSAGE (Contact Form)
router.post('/messages/add', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Sab fields bharo.' });
    }

    try {
        let clientResult = await pool.query('SELECT client_id FROM Client WHERE email = $1', [email]);
        let clientId;

        if (clientResult.rows.length === 0) {
            const newClient = await pool.query(
                'INSERT INTO Client (full_name, email) VALUES ($1, $2) RETURNING client_id',
                [name, email]
            );
            clientId = newClient.rows[0].client_id;
        } else {
            clientId = clientResult.rows[0].client_id;
        }

        await pool.query(
            'INSERT INTO MessageInquiry (client_id, message_text) VALUES ($1, $2)',
            [clientId, message]
        );

        res.json({ success: true, message: 'Message send ho gaya!' });
    } catch (err) {
        console.error('Message Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. GET ALL MESSAGES
router.get('/messages', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.full_name, c.email
            FROM MessageInquiry m
            JOIN Client c ON m.client_id = c.client_id
            ORDER BY m.submitted_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. DELETE MESSAGE
router.delete('/messages/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM MessageInquiry WHERE message_id = $1', [req.params.id]);
        res.json({ success: true, message: 'Message delete ho gaya!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
