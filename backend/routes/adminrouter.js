const express = require("express");
const con = require("../utils/db.js");
const multer = require("multer");
const path = require("path");
const csurf = require("csurf");
const router = express.Router();
const winston = require("winston");
const fs = require("fs");
const csrfProtection = csurf({ cookie: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = "../frontend/src/assets/image";
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

const upload = multer({
  storage: storage,
});

router.post(
  "/addProduct",
  csrfProtection,
  upload.single("image"),
  (req, res) => {
    const sql = `INSERT INTO product
    (name, price, category, image, description)  VALUES (?)`;

    const values = [
      req.body.productName,
      req.body.price,
      req.body.category,
      req.file.filename,
      req.body.description,
    ];

    con.query(sql, [values], (err, result) => {
      console.log(result);
      if (err) return res.json({ Status: false, Error: err });
      logger.info(`Admin has added a product in successfully.`, {
        timestamp: new Date().toISOString(),
      });
      return res.json({ Status: "Success" });
    });
  }
);

router.get("/logout", (req, res) => {
  res.clearCookie("access-token");
  return res.json({ Status: "Success" });
});

router.post("/addCoupon", csrfProtection, (req, res) => {
  const { username, code, discount_type, discount_value, expiry_date } =
    req.body;
  const sql = `
    INSERT INTO coupons (username, code, discount_type, discount_value, expiry_date)
    VALUES (?, ?, ?, ?, ?)
  `;
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

module.exports = router;
