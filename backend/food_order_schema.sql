-- Xóa và tạo lại database
DROP DATABASE IF EXISTS food_order;
CREATE DATABASE food_order;
USE food_order;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    last_ip VARCHAR(45),
    is_verified BOOLEAN DEFAULT FALSE
);

-- User sessions
CREATE TABLE user_sessions (
    username VARCHAR(50) PRIMARY KEY,
    last_activity DATETIME NOT NULL,
    token_version INT DEFAULT 0
);

-- 2FA pending table (đã thêm cột attempts)
CREATE TABLE pending_2fa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    code VARCHAR(6) NOT NULL,
    ip_address VARCHAR(45),
    expires_at DATETIME,
    attempts INT DEFAULT 0,
    UNIQUE KEY unique_code_ip (username, ip_address)
);

-- Account information
CREATE TABLE accountinfo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    fullname VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    profileImage VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Products table
CREATE TABLE product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    price INT,
    category VARCHAR(50),
    image VARCHAR(255),
    description TEXT
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid VARCHAR(50),
    username VARCHAR(50),
    products JSON,
    method VARCHAR(20),
    total INT,
    timestamp DATETIME,
    confirm BOOLEAN DEFAULT 0
);

-- Coupons table
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    code VARCHAR(20) UNIQUE,
    discount_type ENUM('percent', 'fixed'),
    discount_value INT,
    expiry_date DATE,
    is_used BOOLEAN DEFAULT FALSE
);

-- Feedbacks table
CREATE TABLE feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(50),
    request TEXT
);

-- Email verification table
CREATE TABLE email_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset OTP table
CREATE TABLE password_reset_otp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL
);

-- Password reset requests
CREATE TABLE password_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
