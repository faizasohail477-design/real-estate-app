const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL Connected Successfully!"))
    .catch(err => console.log("❌ DB Connection Failed:", err.message));

module.exports = pool;
