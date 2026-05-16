import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  socketPath: "/tmp/mysql.sock", // ✅ CORRECT PATH
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");

    // 🇵🇰 Force Pakistan timezone for all MySQL queries
    db.query("SET time_zone = '+05:00'", (tzErr) => {
      if (tzErr) {
        console.error("❌ Timezone Error:", tzErr);
      } else {
        console.log("🇵🇰 MySQL timezone set to Pakistan (+05:00)");
      }
    });
  }
});

export default db;