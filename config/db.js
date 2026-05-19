import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test DB connection
 db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Pool Connected");

    connection.query("SET time_zone = '+05:00'", (tzErr) => {
      if (tzErr) {
        console.error("❌ Timezone Error:", tzErr);
      } else {
        console.log("🇵🇰 MySQL timezone set to Pakistan (+05:00)");
      }
    });

    connection.release();
  }
});

export default db;