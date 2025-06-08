const express = require("express");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const csurf = require("csurf");
const winston = require("winston");
const db = require("../utils/db.js");
dotenv.config({ path: "./.env" });
const app = express.Router();
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  },
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

app.post("/checkout", csrfProtection, async (req, res) => {
  const { username, cartItems, totalAmount, couponCode } = req.body;
  const products = JSON.stringify(cartItems);
  const getMySQLDateTime = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };
  
  const timestamp = getMySQLDateTime();
  const method = "COD";

  const userSql = "SELECT username, email FROM users WHERE username = ?";
  db.query(userSql, [username], (userErr, userResult) => {
    if (userErr || userResult.length === 0) {
      return res.status(500).json({ Status: false, Error: "User not found" });
    }

    const { username: uname, email } = userResult[0];

    const applyCoupon = (callback) => {
      if (!couponCode) {
        return callback(null, totalAmount, 0);
      }

      const couponSql = `
        SELECT * FROM coupons
        WHERE code = ? AND username = ? AND is_used = FALSE AND (expiry_date IS NULL OR expiry_date > NOW())
      `;
      db.query(couponSql, [couponCode, uname], (couponErr, couponResults) => {
        console.log("Coupon result:", couponResults);
        if (couponErr) return callback(couponErr);
        if (couponResults.length === 0) {
          return callback(new Error("Invalid or expired coupon."));
        }

        const coupon = couponResults[0];
        let discount = 0;

        if (coupon.discount_type === "percent") {
          discount = (totalAmount * coupon.discount_value) / 100;
        } else {
          discount = coupon.discount_value;
        }

        const finalAmount = Math.max(0, totalAmount - discount);

        db.query("UPDATE coupons SET is_used = TRUE WHERE id = ?", [coupon.id], (updateErr) => {
          if (updateErr) return callback(updateErr);
        callback(null, finalAmount, discount);
          return callback(null, finalAmount, discount);
        });

        callback(null, finalAmount, discount);
      });
    };

    applyCoupon((couponErr, finalAmount, discount) => {
      if (couponErr) {
        return res.status(400).json({ Error: couponErr.message });
      }

      const orderSql =
        "INSERT INTO orders (username, products, method, total, timestamp) VALUES (?, ?, ?, ?, ?)";
      const values = [uname, products, method, finalAmount, timestamp];

      db.query(orderSql, values, (err, result) => {
        if (err) {
          console.error("Error inserting order:", err); 
          return res.status(500).json({ Status: false, Error: "Failed to insert order" });
        }

        logger.info(`User ${uname} has checked out successfully.`, {
          timestamp: new Date().toISOString(),
        });

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_SENDER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const currentDate = new Date();
        const dateString = currentDate.toLocaleDateString();
        const timeString = currentDate.toLocaleTimeString();

        const mailOptions = {
          from: process.env.EMAIL_SENDER,
          to: email,
          subject: "Order Confirmation",
          text: `Dear ${uname},
                  Your order has been placed successfully and is being prepared.

                  Order Details:
                  Date: ${dateString} ${timeString}
                  Payment Amount: ${finalAmount}K
                  Payment Method: Cash on Delivery (COD)

                  If you have questions, contact our support.

                  Thank you for shopping with us!`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });

        return res.json({
          status: "Success",
          message: "Order processed successfully",
          discount,
          finalAmount,
        });
      });
    });
  });
});

module.exports = app;
