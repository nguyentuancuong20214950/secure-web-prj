const mysql = require("mysql2");
const dotenv = require("dotenv");
const winston = require("winston");
dotenv.config({ path: "./.env" });

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Connect to MySQL
db.connect((error, req) => {
  if (error) {
    logger.error("MySQL connection error", {
      error,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    console.log(error);
  } else {
    logger.info("MySQL connected", { timestamp: new Date().toISOString() });
    console.log("MySQL connected...");
  }
});

module.exports = db;
