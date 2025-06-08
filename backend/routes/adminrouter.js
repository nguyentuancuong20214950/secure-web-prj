const express = require("express");
const db = require("../utils/db.js");
const dotenv = require("dotenv");
const winston = require("winston");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csurf = require("csurf");
const multer = require("multer");
const path = require("path");
dotenv.config({ path: "./.env" });

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  },
});

const USER_REGEX = /^[a-z0-9]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@$&*()]).{8,24}$/;

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../assets/images"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (file.originalname.length > 30) {
      return cb(new Error("Error: Filename too long! (max 30 characters)"));
    }

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
});

const adminrouter = express.Router();

adminrouter.post("/login", csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  const v1 = USER_REGEX.test(username);
  const v2 = PWD_REGEX.test(password);
  if (!v1 || !v2) {
    return res.status(400).json({ Error: "Invalid Entry" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  const sqlVersion =
    "SELECT token_version FROM user_sessions WHERE username = ?";

  db.query(sql, [username], (err, results) => {
    if (err) {
      logger.error("Database error:", err);
      return res.status(500).json({ Error: "Database error" });
    }

    if (results.length === 0) {
      logger.warn("Login failed: invalid username");
      return res.status(401).json({ Error: "Invalid username or password" });
    }

    const user = results[0];

    if (user.role !== 'admin') {
      logger.warn(`Unauthorized login attempt by non-admin: ${username}`);
      return res.status(403).json({ Error: "Forbidden: Admins only" });
    }

    bcrypt.compare(password.toString(), user.password, (err, isMatch) => {
      if (err || !isMatch) {
        logger.warn("Login failed: incorrect password");
        return res.status(401).json({ Error: "Invalid username or password" });
      }

      db.query(sqlVersion, [username], (err, versionResult) => {
        if (err) {
          logger.error("Token version query failed:", err);
          return res.status(500).json({ Error: "Token version query failed" });
        }

        const tokenVersion =
          versionResult.length > 0 ? versionResult[0].token_version : 1;

        const token = jwt.sign(
          {
            username,
            userType: user.role,
            tokenVersion,
            ip: req.ip,
            ua: req.get("User-Agent"),
          },
          process.env.TOKEN_SECRET,
          { expiresIn: "1800s" }
        );

        res.cookie("access-token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        logger.info(`Admin ${username} logged in successfully`);
        return res.json({
          Status: "Success",
          user: { username: user.username, role: user.role }, // <-- dòng này cần có!
          Role: { role: user.role },
          token,
        });
      });
    });
  });
});

adminrouter.get("/product", csrfProtection, async (req, res) => {
  const sql = "SELECT * FROM product";
  db.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: err });
    return res.json({ Status: "Success", products: result });
  });
});

adminrouter.post("/checkoutCash", csrfProtection, async (req, res) => {
  const { userId, cartItems, totalAmount } = req.body;
  const products = JSON.stringify(cartItems);
  const timestamp = new Date().toISOString();
  const method = "Cash";

  const sql =
    "INSERT INTO orders (userid, products, method, total, timestamp) VALUES (?, ?, ?, ?, ?)";
  const values = [userId, products, method, totalAmount, timestamp];
  db.query(sql, values, (err, result) => {
    if (err) return res.json({ Status: false, Error: err });
    logger.info(`User ${req.body.username} has checked out in successfully.`, {
      timestamp: new Date().toISOString(),
    });
    return res.json({ Status: "Success" });
  });
});

adminrouter.post("/addProduct", csrfProtection, upload.single("image"), (req, res) => {
  const { productName, category, price, description } = req.body;
  const image = req.file ? req.file.filename : null;

  if (
    typeof productName !== 'string' || productName.trim() === '' ||
    typeof category !== 'string' || category.trim() === '' ||
    isNaN(price) || Number(price) < 0 ||
    typeof description !== 'string'
  ) {
    return res.json({ Status: false, Error: "Invalid input" });
  }

  const sql = "INSERT INTO product (name, category, price, description, image) VALUES (?, ?, ?, ?, ?)";
  const values = [productName, category, price, description, image];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting product:", err);
      return res.json({ Status: false, Error: err });
    }
    return res.json({ Status: "Success" });
  });
});

adminrouter.post("/addCoupon", csrfProtection, (req, res) => {
  const { username, code, discount_type, discount_value, expiry_date } =
    req.body;
  const sql = `
    INSERT INTO coupons (username, code, discount_type, discount_value, expiry_date)
    VALUES (?, ?, ?, ?, ?)
  `;
  if (
    typeof username !== 'string' || username.trim() === '' ||
    typeof code !== 'string' || code.trim() === '' ||
    typeof discount_type !== 'string' || discount_type.trim() === '' ||
    isNaN(discount_value) || Number(discount_value) <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date) // YYYY-MM-DD
  ) {
    return res.json({ Status: false, Error: "Invalid input" });
  }
  db.query(
    sql,
    [username, code, discount_type, discount_value, expiry_date],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ Error: "Failed to add coupon", detail: err });
      }
      return res.json({ Status: "Coupon added" });
    }
  );
});

module.exports = adminrouter;
