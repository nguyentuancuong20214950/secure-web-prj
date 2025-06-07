const express = require("express");
const db = require("../utils/db.js");
const dotenv = require("dotenv");
const winston = require("winston");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csurf = require("csurf");
dotenv.config({ path: "./.env" });

const csrfProtection = csurf({ cookie: true });

const USER_REGEX = /^[a-z0-9]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@$&*()]).{8,24}$/;

const refreshTokens = [];

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
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
  const sqlVersion = "SELECT token_version FROM user_sessions WHERE username = ?";

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
        });

        logger.info(`User ${username} logged in as ${user.role}`);
        return res.json({
          Status: "Success",
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

module.exports = adminrouter;
