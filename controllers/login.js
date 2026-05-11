


import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const [users] = await db.promise().query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // TEMP: if password is not hashed yet
    let isMatch = false;

    if (user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Optional: create default admin if not exists
export const seedAdmin = async () => {
  const [users] = await db.query("SELECT * FROM users WHERE username = 'admin'");

  if (users.length === 0) {
    const hashed = await bcrypt.hash("1234", 10);
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      "admin",
      hashed,
    ]);
    console.log("✅ Default admin created (admin / 1234)");
  }
};