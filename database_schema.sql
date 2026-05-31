-- ================================================
-- SHUQRAN REAL ESTATE - PostgreSQL Database Schema
-- Neon.tech pe run karo
-- ================================================

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS Admin (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Property Table
CREATE TABLE IF NOT EXISTS Property (
    property_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    property_type VARCHAR(50),
    location VARCHAR(255),
    city VARCHAR(100),
    price DECIMAL(18,2),
    owner_name VARCHAR(100),
    owner_contact VARCHAR(20),
    owner_price DECIMAL(18,2),
    rooms INT,
    bathrooms INT,
    area_sqft INT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Property Images Table
CREATE TABLE IF NOT EXISTS PropertyImages (
    image_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES Property(property_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 4. Upcoming Projects Table
CREATE TABLE IF NOT EXISTS UpcomingProject (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'Upcoming',
    total_units INT,
    completion_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Client Table
CREATE TABLE IF NOT EXISTS Client (
    client_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_no VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Message Inquiry Table
CREATE TABLE IF NOT EXISTS MessageInquiry (
    message_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Client(client_id),
    property_id INT REFERENCES Property(property_id),
    message_text TEXT,
    status VARCHAR(50) DEFAULT 'Unread',
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- 7. Construction Request Table
CREATE TABLE IF NOT EXISTS ConstructionRequest (
    request_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Client(client_id),
    client_name VARCHAR(100),
    plot_location VARCHAR(255),
    plot_size VARCHAR(100),
    requirements TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- DEFAULT ADMIN ACCOUNTS (Plain text - first login ke baad change karo)
-- ================================================
INSERT INTO Admin (username, password) VALUES ('zaman', 'zaman0099')
ON CONFLICT (username) DO NOTHING;

INSERT INTO Admin (username, password) VALUES ('manager1', 'shedai0088')
ON CONFLICT (username) DO NOTHING;

INSERT INTO Admin (username, password) VALUES ('assistent1', 'zaman0077')
ON CONFLICT (username) DO NOTHING;
