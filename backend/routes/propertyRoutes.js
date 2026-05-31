const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, 'shuqran-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5000000 } });

// 1. GET ALL PROPERTIES
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.property_id, p.title, p.property_type, p.location, p.city, p.price,
                p.owner_name, p.owner_contact, p.owner_price, p.rooms, p.bathrooms,
                p.area_sqft, p.description, p.status, p.created_at,
                STRING_AGG(i.image_url, ',') AS images
            FROM Property p
            LEFT JOIN PropertyImages i ON p.property_id = i.property_id
            GROUP BY
                p.property_id, p.title, p.property_type, p.location, p.city, p.price,
                p.owner_name, p.owner_contact, p.owner_price, p.rooms, p.bathrooms,
                p.area_sqft, p.description, p.status, p.created_at
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Properties Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. ADD PROPERTY
router.post('/add', upload.array('images', 5), async (req, res) => {
    const { title, property_type, location, price, owner_name, owner_contact, owner_price, rooms, bathrooms, area_sqft, description, status } = req.body;

    const roomsVal = rooms ? parseInt(rooms) : 0;
    const bathsVal = bathrooms ? parseInt(bathrooms) : 0;
    const areaVal = area_sqft ? parseInt(area_sqft) : 0;
    const ownerPriceVal = owner_price ? parseFloat(owner_price) : 0;

    try {
        const result = await pool.query(
            `INSERT INTO Property (title, property_type, location, price, rooms, bathrooms, area_sqft, description, owner_name, owner_contact, owner_price, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING property_id`,
            [title, property_type, location, parseFloat(price), roomsVal, bathsVal, areaVal, description, owner_name, owner_contact, ownerPriceVal, status || 'Available']
        );

        const newId = result.rows[0].property_id;

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                await pool.query(
                    'INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2)',
                    [newId, file.filename]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Add Property Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. UPDATE PROPERTY
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
    const propertyId = req.params.id;
    const { title, property_type, location, price, status, rooms, bathrooms, area_sqft, description } = req.body;

    const roomsVal = rooms ? parseInt(rooms) : 0;
    const bathsVal = bathrooms ? parseInt(bathrooms) : 0;
    const areaVal = area_sqft ? parseInt(area_sqft) : 0;

    try {
        await pool.query(
            `UPDATE Property SET title=$1, property_type=$2, location=$3, price=$4,
             status=$5, rooms=$6, bathrooms=$7, area_sqft=$8, description=$9
             WHERE property_id=$10`,
            [title, property_type, location, parseFloat(price), status, roomsVal, bathsVal, areaVal, description, propertyId]
        );

        if (req.files && req.files.length > 0) {
            // Get old images and delete from disk
            const oldImgs = await pool.query('SELECT image_url FROM PropertyImages WHERE property_id = $1', [propertyId]);
            await pool.query('DELETE FROM PropertyImages WHERE property_id = $1', [propertyId]);

            oldImgs.rows.forEach(img => {
                const filePath = path.join(__dirname, '../public/uploads/', img.image_url);
                fs.unlink(filePath, (err) => { if (err) console.log('Delete file error:', err); });
            });

            for (let file of req.files) {
                await pool.query('INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2)', [propertyId, file.filename]);
            }
        }

        res.json({ success: true, message: 'Updated successfully!' });
    } catch (err) {
        console.error('Update Property Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. DELETE PROPERTY
router.delete('/delete/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Property WHERE property_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
