const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
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

  const username = decoded.username;

  const sqlCheck = `SELECT last_activity FROM user_sessions WHERE username = ? LIMIT 1`;
  db.query(sqlCheck, [username], (err, results) => {
    if (err) return res.status(500).json({ Error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ Error: "Session not found" });
    }

    const lastActivity = new Date(results[0].last_activity);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastActivity) / 1000);

    if (diffSeconds > ACTIVITY_TIMEOUT_SECONDS) {
      return res
        .status(401)
        .json({ Error: "Session expired due to inactivity" });
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

        await send2FACode(user.email, code);
        return res.status(200).json({ Status: "2FA required", step: "verify" });
      });
    } else {
      const sqlInsertSession = `INSERT INTO user_sessions (username, last_activity)
                                VALUES (?, NOW())
                                ON DUPLICATE KEY UPDATE last_activity = NOW()`;
      db.query(sqlInsertSession, [username]);

      const token = jwt.sign(
        { username, userType: user.role },
        process.env.TOKEN_SECRET,
        {
          expiresIn: "1800s",
        }
      );

      res.cookie("access-token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      return res.json({ Status: "Success" });
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
    setErrMsg("Invalid username/password format.");
    return;
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
        logger.info(
          `User ${req.body.username} has registered in successfully.` //@to-do: xử lí email verification
        );
        res.send({ Status: "Success" });
      });
    });
  });
});

let refreshTokens = [];

app.post("/verify-2fa", csrfProtection, (req, res) => {
  const { username, code } = req.body;
  const ip = req.ip;

  const sql = `
    SELECT * FROM pending_2fa
    WHERE username = ? AND code = ? AND ip_address = ? AND expires_at > NOW()
  `;
  db.query(sql, [username, code, ip], (err, results) => {
    if (err || results.length === 0)
      return res.status(400).json({ Error: "Invalid or expired code" });

    const sqlUpdateIP = "UPDATE users SET last_ip = ? WHERE username = ?";
    db.query(sqlUpdateIP, [ip, username]);

    db.query("DELETE FROM pending_2fa WHERE username = ?", [username]);

    const sqlUser = "SELECT role FROM users WHERE username = ?";
    db.query(sqlUser, [username], (err, result) => {
      if (err || result.length === 0)
        return res.status(500).json({ Error: "Internal server error" });

      const sqlInsertSession = `INSERT INTO user_sessions (username, last_activity)
                                VALUES (?, NOW())
                                ON DUPLICATE KEY UPDATE last_activity = NOW()`;
      db.query(sqlInsertSession, [username]);

      const token = jwt.sign(
        { username, userType: result[0].role },
        process.env.TOKEN_SECRET,
        {
          expiresIn: "1800s",
        }
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

app.post("/logout", csrfProtection, (req, res) => {
  console.log(req.body);
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.send("Logout successful");
});

app.get("/logout", (req, res) => {
  res.clearCookie("access-token");
  const sql = `DELETE FROM user_sessions WHERE username = ?`;
  db.query(sql, req.body.username); //@to-do: verify mọi thứ ở req body để tránh logout của người khác
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
  const request = req.body;
  const values = [username, request];
  const sql = "INSERT INTO feedbacks (user, request) VALUES (?, ?)";
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ Error: "Internal server error" });
    }
    logger.info(`Feedback sent.`);
    return res.json({ Status: "Success" });
  });
  //@todo:
  //  . giới hạn request length
  //  . giới hạn số lượng feedback user có thể gửi/ngày
  //  . xss/sql protection
});

app.get("/order", csrfProtection, authMiddleware, async (req, res) => {
  const username = req.username; // Assuming username is set by authMiddleware
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

app.post(
  "/change_password",
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

                if (hash == currentPassword) {
                  logger.warn("New password is same as current password", {
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                    url: req.originalUrl,
                    timestamp: new Date().toISOString(),
                  });
                  return res.status(400).json({
                    Error:
                      "New password must be different from the current one.",
                  });
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
