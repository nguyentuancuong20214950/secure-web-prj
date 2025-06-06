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

-- Xóa pending 2FA sau khi hết hạn (https://dev.mysql.com/doc/refman/5.7/en/create-event.html)
CREATE EVENT IF NOT EXISTS ev_clear_expired_2fa
ON SCHEDULE EVERY 1 MINUTE
DO
  DELETE FROM pending_2fa
  WHERE expires_at < NOW();

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
CREATE TABLE IF NOT EXISTS password_reset_otp (
  username VARCHAR(255) PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0
);

-- Xóa OTP khôi phục mật khẩu sau khi hết hạn (https://dev.mysql.com/doc/refman/5.7/en/create-event.html)
CREATE EVENT IF NOT EXISTS ev_clear_expired_password_otp
ON SCHEDULE EVERY 1 MINUTE
DO
  DELETE FROM password_reset_otp
  WHERE expires_at < NOW();

-- Password reset requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

