const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const fetch = require("node-fetch");
const winston = require("winston");
dotenv.config({ path: "./.env" });
const session = require("express-session");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");
// require("./auth");
const userrouter = require("./routes/user.js");
const adminrouter = require("./routes/adminrouter.js");
const checkout = require("./routes/checkout.js");
const db = require("./utils/db.js");

const app = express();
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

app.use("/auth", adminrouter);
app.use("/auth", userrouter);
app.use("/auth", checkout);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 36, // tối đa 36 requests mỗi IP trong 1 phút
  message: "Too much requests, try again later",
});

app.use(limiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ Error: "Something went wrong!" });
});

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

const ACTIVITY_TIMEOUT_SECONDS = 900;

const authMiddleware = (req, res, next) => {
  const token = req.cookies["access-token"];
  if (!token) {
    return res.status(401).json({ Error: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ Error: "Invalid token" });
  }

  const { username, tokenVersion, ip: tokenIP, ua: tokenUA } = decoded;

  const sqlCheck = `SELECT last_activity, token_version FROM user_sessions WHERE username = ? LIMIT 1`;
  db.query(sqlCheck, [username], (err, results) => {
    if (err) return res.status(500).json({ Error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ Error: "Session not found" });
    }

    if (req.ip !== tokenIP || req.get("User-Agent") !== tokenUA) {
      return res.status(401).json({ Error: "Session hijacking detected" });
    }

    const lastActivity = new Date(results[0].last_activity);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastActivity) / 1000);

    if (diffSeconds > ACTIVITY_TIMEOUT_SECONDS) {
      return res
        .status(401)
        .json({ Error: "Session expired due to inactivity" });
    }

    if (results[0].token_version !== tokenVersion) {
      return res.status(401).json({ Error: "Token invalidated" });
    }

    const sqlUpdate = `UPDATE user_sessions SET last_activity = NOW() WHERE username = ?`;
    db.query(sqlUpdate, [username]);

    req.username = username;
    req.userType = decoded.userType;
    next();
  });
};

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

app.post("/login", csrfProtection, async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ Error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ Error: "Invalid credentials" });

    if (user.last_ip && user.last_ip !== ip) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const sqlUpsert = `
        INSERT INTO pending_2fa (username, code, ip_address, expires_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE code = VALUES(code), ip_address = VALUES(ip_address), expires_at = VALUES(expires_at)
      `;
      db.query(sqlUpsert, [username, code, ip, expiresAt], async (err) => {
        if (err)
          return res.status(500).json({ Error: "Internal server error" });

        await sendVerificationEmail(user.email, code);
        return res.status(200).json({ Status: "2FA required", step: "verify" });
      });
    } else {
      const sqlInsertSession = `INSERT INTO user_sessions (username, last_activity)
                                VALUES (?, NOW())
                                ON DUPLICATE KEY UPDATE last_activity = NOW()`;
      db.query(sqlInsertSession, [username]);

      const sqlVersion =
        "SELECT token_version FROM user_sessions WHERE username = ?";
      db.query(sqlVersion, [username], (err, result) => {
        const tokenVersion = result.length > 0 ? result[0].token_version : 1;
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
        return res.json({ Status: "Success" });
      });
    }
  });
});

const saltRounds = 10;

app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const USER_REGEX = /^[a-z0-9]{3,23}$/;
const PWD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~\\-]).{8,32}$/;

app.post("/register", csrfProtection, async (req, res) => {
  const v1 = USER_REGEX.test(req.body.username.toString());
  const v2 = PWD_REGEX.test(req.body.password.toString());
  if (!v1 || !v2) {
    return res
      .status(400)
      .json({ Error: "Invalid username or password format" });
  }

  const sql =
    "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      logger.error("Error generating salt", {
        error: err,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.status(500).send("Internal server error");
    }
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
      if (err) {
        logger.error("Error hashing password", {
          error: err,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
        return res.status(500).send("Internal server error");
      }
      const values = [req.body.username, req.body.email, hash, "user"];
      db.query(sql, values, (err, result) => {
        if (err) {
          logger.error("Database error during registration", {
            error: err,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
          });
          return res.status(500).send("Internal server error");
        }
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const sqlInsertVerification = `INSERT INTO email_verification (username, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`;
        db.query(
          sqlInsertVerification,
          [req.body.username, verificationCode, expiresAt],
          async (err) => {
            if (err) {
              logger.error("Error storing email verification code", {
                error: err,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                url: req.originalUrl,
                timestamp: new Date().toISOString(),
              });
              return res.status(500).send("Internal server error");
            }

            await sendVerificationEmail(req.body.email, verificationCode);
            logger.info(`Verification code sent to ${req.body.email}`);
          }
        );
        res.send({ Status: "Success" });
      });
    });
  });
});

async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: "Verify your email",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
}

app.post("/verify-email", csrfProtection, async (req, res) => {
  const { username, code } = req.body;
  console.log("VERIFY REQUEST BODY:", { username, code });
  const MAX_ATTEMPTS = 5;

  if (!username || !code) {
    return res.status(400).json({ Error: "Missing username or code" });
  }

  const sql = `SELECT * FROM email_verification WHERE username = ?`;
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ Error: "Database error" });
    console.log("EMAIL_VERIFICATION QUERY RESULT:", results);
    if (results.length === 0) {
      return res.status(400).json({ Error: "No verification code found" });
    }

    const record = results[0];

    if (
      new Date(record.expires_at) < new Date() ||
      record.attempts >= MAX_ATTEMPTS
    ) {
      db.query("DELETE FROM email_verification WHERE username = ?", [username]);
      return res
        .status(400)
        .json({ Error: "Verification code expired or too many attempts" });
    }

    if (record.code !== code) {
      console.log("Verification failed: wrong code. Provided:", code, "Expected:", record.code);
      db.query(
        "UPDATE email_verification SET attempts = attempts + 1 WHERE username = ?",
        [username]
      );
      return res.status(400).json({ Error: "Invalid verification code" });
    }

    const sqlActivate = "UPDATE users SET is_verified = 1 WHERE username = ?";
    db.query(sqlActivate, [username]);
    db.query("DELETE FROM email_verification WHERE username = ?", [username]);

    return res.json({ Status: "Email verified successfully" });
  });
});

let refreshTokens = [];

app.post("/verify-2fa", csrfProtection, (req, res) => {
  const { username, code } = req.body;
  const ip = req.ip;
  const MAX_ATTEMPTS = 5;

  const sqlSelect = `
    SELECT * FROM pending_2fa
    WHERE username = ? AND ip_address = ?
  `;
  db.query(sqlSelect, [username, ip], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ Error: "Invalid or expired code" });
    }

    const record = results[0];
    if (
      new Date(record.expires_at) < new Date() ||
      record.attempts >= MAX_ATTEMPTS
    ) {
      db.query("DELETE FROM pending_2fa WHERE username = ?", [username]);
      return res
        .status(400)
        .json({ Error: "Code expired or too many attempts" });
    }

    if (record.code !== code) {
      db.query(
        "UPDATE pending_2fa SET attempts = attempts + 1 WHERE username = ?",
        [username]
      );
      return res.status(400).json({ Error: "Invalid verification code" });
    }

    // đúng mã => reset attempt và tạo phiên
    db.query("DELETE FROM pending_2fa WHERE username = ?", [username]);
    const sqlUpdateIP = "UPDATE users SET last_ip = ? WHERE username = ?";
    db.query(sqlUpdateIP, [ip, username]);

    const sqlUser = "SELECT role FROM users WHERE username = ?";
    db.query(sqlUser, [username], (err, result) => {
      if (err || result.length === 0) {
        return res.status(500).json({ Error: "Internal server error" });
      }

      const role = result[0].role;

      const sqlInsertSession = `
        INSERT INTO user_sessions (username, last_activity)
        VALUES (?, NOW())
        ON DUPLICATE KEY UPDATE last_activity = NOW()
      `;
      db.query(sqlInsertSession, [username]);

      const sqlVersion = `
        SELECT token_version FROM user_sessions WHERE username = ?
      `;
      db.query(sqlVersion, [username], (err, versionResult) => {
        if (err) {
          return res.status(500).json({ Error: "Token version query failed" });
        }

        const tokenVersion =
          versionResult.length > 0 ? versionResult[0].token_version : 1;

        const token = jwt.sign(
          {
            username,
            userType: role,
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

        return res.json({ Status: "2FA success" });
      });
    });
  });
});

app.post("/logout", authMiddleware, csrfProtection, (req, res) => {
  console.log(req.body);
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.send("Logout successful");
});

app.get("/logout", authMiddleware, csrfProtection, (req, res) => {
  res.clearCookie("access-token");
  const sql1 = `UPDATE user_sessions SET token_version = token_version + 1 WHERE username = ?`;
  db.query(sql1, [req.username]);
  const sql2 = `DELETE FROM user_sessions WHERE username = ?`;
  db.query(sql2, [req.username]);
  return res.json({ Status: "Success" });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // specify the destination directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // specify the filename
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
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

app.post(
  "/profile",
  csrfProtection,
  authMiddleware,
  upload.single("profileImage"),
  (req, res) => {
    const { fullName, mobileNo, email, address } = req.body;
    const username = req.username;
    const profileImage = req.file ? req.file.filename : null; // Get the uploaded file name
    if (!/^[A-Za-z\s]+$/.test(fullName)) {
      return res
        .status(400)
        .json({ Error: "Full name should contain only alphabets and spaces." });
    }
    if (!/^\d{10}$/.test(mobileNo)) {
      return res
        .status(400)
        .json({ Error: "Mobile number should contain exactly 10 digits." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ Error: "Email is invalid." });
    }
    if (!/\d/.test(address) || !/[A-Za-z]/.test(address)) {
      return res
        .status(400)
        .json({ Error: "Address should contain both numbers and text." });
    }

    const sql = profileImage
      ? "INSERT INTO accountinfo (user_id, fullname, phone, email, address, profileImage) VALUES ((SELECT user_id FROM users WHERE username = ?), ?, ?, ?, ?, ?)"
      : "INSERT INTO accountinfo (user_id, fullname, phone, email, address) VALUES ((SELECT id FROM users WHERE username = ?), ?, ?, ?, ?)";

    const values = profileImage
      ? [username, fullName, mobileNo, email, address, profileImage]
      : [username, fullName, mobileNo, email, address];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ Error: "Internal server error" });
      }
      logger.info(`User ${username} has updated profile successfully.`);
      return res.json({ Status: "Success" });
    });
  }
);

app.get("/profile", csrfProtection, authMiddleware, (req, res) => {
  const username = req.username;
  const sql =
    "SELECT fullname, phone, email, address FROM accountinfo WHERE user_id = (SELECT id FROM users WHERE username = ?)";
  db.query(sql, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ Error: "Internal server error" });
    }
    if (result.length > 0) {
      console.log(result);
      const user = result[result.length - 1];
      logger.info("Get user data successfully", {
        username: user.username,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.json({
        fullName: user.fullname,
        mobileNo: user.phone,
        email: user.email,
        address: user.address,
      });
    } else {
      return res.status(404).json({ Error: "User not found" });
    }
  });
});

app.post("/order", csrfProtection, authMiddleware, async (req, res) => {
  const { orderId, confirm } = req.body;
  db.query("UPDATE orders SET confirm = ? WHERE id = ?", [confirm, orderId]);
  logger.info("Admin set confirm order successfully", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
  return res.status(200).json({ message: "Order updated successfully" });
});

app.post("/feedback", csrfProtection, authMiddleware, async (req, res) => {
  const username = req.username;
  let request = req.body?.request?.toString().trim();

  if (!request || request.length < 5 || request.length > 1000) {
    return res
      .status(400)
      .json({ Error: "Feedback must be 5–1000 characters long." });
  }

  request = xss(request);

  const checkSql = ` SELECT COUNT(*) AS count FROM feedbacks WHERE user = ? AND DATE(created_at) = CURDATE()`;
  db.query(checkSql, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ Error: "Database error" });
    }

    if (results[0].count >= 5) {
      return res.status(429).json({ Error: "Feedback limit reached." });
    }

    const insertSql = `INSERT INTO feedbacks (user, request, created_at) VALUES (?, ?, NOW())`;
    db.query(insertSql, [username, request], (err, result) => {
      if (err) {
        return res.status(500).json({ Error: "Database error" });
      }
      logger.info(`Feedback sent by ${username}.`);
      return res.json({ Status: "Success" });
    });
  });
});

app.get("/order", csrfProtection, authMiddleware, async (req, res) => {
  const username = req.username;
  console.log(username);
  if (username === "admin") {
    const sql = "SELECT * FROM orders";

    db.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.json({ Status: false, Error: err });
      }
      return res.json({ orders: result });
    });
  } else {
    const sql = "SELECT * FROM orders WHERE userid = ?";

    db.query(sql, [username], (err, result) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.json({ Status: false, Error: err });
      }
      return res.json({ orders: result });
    });
  }
});

app.post("/request_password_reset", csrfProtection, (req, res) => {
  const username = req.body.username;

  const sqlCheck = `
    SELECT created_at FROM password_reset_requests
    WHERE username = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `;
  db.query(sqlCheck, [username], (err, results) => {
    if (err) return res.status(500).json({ Error: "Database error" });

    if (results.length > 0) {
      return res
        .status(429)
        .json({ Error: "You can only request once per hour" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const insertOTP = `
      INSERT INTO password_reset_otp (username, code, expires_at, attempts)
      VALUES (?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), attempts = 0
    `;

    const insertLog = `
      INSERT INTO password_reset_requests (username, created_at)
      VALUES (?, NOW())
    `;

    const getEmailSql = `SELECT email FROM users WHERE username = ?`;
    db.query(getEmailSql, [username], async (err, results) => {
      if (err || results.length === 0)
        return res.status(500).json({ Error: "User not found" });

      const email = results[0].email;

      db.query(insertOTP, [username, code, expiresAt], async (err) => {
        if (err) return res.status(500).json({ Error: "Failed to store OTP" });

        db.query(insertLog, [username]);
        await sendVerificationEmail(email, code);
        return res.json({ Status: "OTP sent to email" });
      });
    });
  });
});

app.post(
  "/change_password_loggedin",
  csrfProtection,
  authMiddleware,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.username;

    const v2 = PWD_REGEX.test(newPassword);
    if (!v2) {
      logger.warn("Invalid password format during password change", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    const sqlSelect = "SELECT password FROM users WHERE username = ?";
    db.query(sqlSelect, [username], (err, results) => {
      if (err) {
        logger.error("Database error during password change", {
          error: err,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
        return res.status(500).json({ Error: "Internal server error" });
      }
      if (results.length > 0) {
        bcrypt.compare(
          currentPassword,
          results[0].password,
          (err, response) => {
            if (err || !response) {
              logger.warn("Invalid current password during password change", {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                url: req.originalUrl,
                timestamp: new Date().toISOString(),
              });
              return res
                .status(400)
                .json({ Error: "Invalid current password" });
            }
            bcrypt.genSalt(saltRounds, (err, salt) => {
              if (err) {
                logger.error("Error generating salt during password change", {
                  error: err,
                  ip: req.ip,
                  userAgent: req.get("User-Agent"),
                  url: req.originalUrl,
                  timestamp: new Date().toISOString(),
                });
                return res.status(500).json({ Error: "Internal server error" });
              }
              bcrypt.hash(newPassword, salt, (err, hash) => {
                if (err) {
                  logger.error(
                    "Error hashing new password during password change",
                    {
                      error: err,
                      ip: req.ip,
                      userAgent: req.get("User-Agent"),
                      url: req.originalUrl,
                      timestamp: new Date().toISOString(),
                    }
                  );
                  return res
                    .status(500)
                    .json({ Error: "Internal server error" });
                }
                const sqlUpdate =
                  "UPDATE users SET password = ? WHERE username = ?";
                db.query(sqlUpdate, [hash, username], (err, result) => {
                  if (err) {
                    logger.error("Database error during password update", {
                      error: err,
                      ip: req.ip,
                      userAgent: req.get("User-Agent"),
                      url: req.originalUrl,
                      timestamp: new Date().toISOString(),
                    });
                    return res
                      .status(500)
                      .json({ Error: "Internal server error" });
                  }
                  logger.info("Password updated successfully", {
                    username,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                    url: req.originalUrl,
                    timestamp: new Date().toISOString(),
                  });
                  return res.json({ Status: "Password updated successfully" });
                });
              });
            });
          }
        );
      } else {
        logger.warn("User not found during password change", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
        return res.status(404).json({ Error: "User not found" });
      }
    });
  }
);

app.post("/reset_password_after_otp", csrfProtection, async (req, res) => {
  const { username, otp, newPassword } = req.body;
  const MAX_ATTEMPTS = 5;

  if (!username || !otp || !newPassword) {
    return res.status(400).json({ Error: "Missing input" });
  }

  if (!PWD_REGEX.test(newPassword)) {
    return res.status(400).json({ Error: "Invalid password format" });
  }

  const sqlSelectOtp = "SELECT * FROM password_reset_otp WHERE username = ?";
  db.query(sqlSelectOtp, [username], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ Error: "No OTP found" });
    }

    const record = results[0];
    if (
      record.attempts >= MAX_ATTEMPTS ||
      new Date(record.expires_at) < new Date()
    ) {
      db.query("DELETE FROM password_reset_otp WHERE username = ?", [username]);
      return res
        .status(400)
        .json({ Error: "OTP expired or too many attempts" });
    }

    if (record.code !== otp) {
      db.query(
        "UPDATE password_reset_otp SET attempts = attempts + 1 WHERE username = ?",
        [username]
      );
      return res.status(400).json({ Error: "Invalid OTP" });
    }

    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
      if (err) return res.status(500).json({ Error: "Error hashing password" });

      const sqlUpdate = "UPDATE users SET password = ? WHERE username = ?";
      db.query(sqlUpdate, [hash, username], (err) => {
        if (err) return res.status(500).json({ Error: "Database error" });

        db.query("DELETE FROM password_reset_otp WHERE username = ?", [
          username,
        ]);
        db.query(
          "UPDATE user_sessions SET token_version = token_version + 1 WHERE username = ?",
          [username]
        );
        return res.json({ Status: "Password reset successfully" });
      });
    });
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

