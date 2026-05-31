const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, 'proj-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5000000 } });

// 1. GET ALL PROJECTS
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM UpcomingProject ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADD PROJECT
router.post('/add', upload.array('images', 5), async (req, res) => {
    const { title, location, status, total_units, description } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'Kam az kam ek photo upload karo!' });
    }

    const imageList = req.files.map(f => f.filename).join(',');
    const unitsVal = total_units ? parseInt(total_units) : 0;

    try {
        await pool.query(
            `INSERT INTO UpcomingProject (title, location, status, total_units, description, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [title, location, status || 'Upcoming', unitsVal, description, imageList]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Add Project Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. UPDATE PROJECT
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
    const project_id = req.params.id;
    const { title, location, status, total_units, description } = req.body;
    const unitsVal = total_units ? parseInt(total_units) : 0;

    try {
        let imageList = null;

        if (req.files && req.files.length > 0) {
            // Delete old images from disk
            const old = await pool.query('SELECT image_url FROM UpcomingProject WHERE project_id = $1', [project_id]);
            const oldStr = old.rows[0]?.image_url;
            if (oldStr) {
                oldStr.split(',').forEach(file => {
                    const filePath = path.join(__dirname, '../public/uploads/', file.trim());
                    fs.unlink(filePath, () => {});
                });
            }
            imageList = req.files.map(f => f.filename).join(',');
        }

        if (imageList) {
            await pool.query(
                `UPDATE UpcomingProject SET title=$1, location=$2, status=$3, total_units=$4, description=$5, image_url=$6 WHERE project_id=$7`,
                [title, location, status, unitsVal, description, imageList, project_id]
            );
        } else {
            await pool.query(
                `UPDATE UpcomingProject SET title=$1, location=$2, status=$3, total_units=$4, description=$5 WHERE project_id=$6`,
                [title, location, status, unitsVal, description, project_id]
            );
        }

        res.json({ success: true, message: 'Updated successfully!' });
    } catch (err) {
        console.error('Update Project Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. DELETE PROJECT
router.delete('/delete/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM UpcomingProject WHERE project_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
