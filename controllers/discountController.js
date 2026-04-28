import db from "../config/db.js";

export const getCustomerDiscount = (req, res) => {
  const { customer_id, book_id } = req.query;

  if (!customer_id || !book_id) {
    return res.status(400).json({ error: "Missing params" });
  }

  const sql = `
    SELECT discount 
    FROM customer_discounts
    WHERE customer_id = ? AND book_id = ?
    LIMIT 1
  `;

  db.query(sql, [customer_id, book_id], (err, result) => {
    if (err) {
      console.error("Discount Error:", err);
      return res.status(500).json({ error: "Query failed" });
    }

    res.json(result); // 🔥 IMPORTANT
  });
};

export const saveCustomerDiscount = (req, res) => {
  const { customer_id, book_id, discount } = req.body;

  const sql = `
    INSERT INTO customer_discounts (customer_id, book_id, discount)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE discount = VALUES(discount)
  `;

  db.query(sql, [customer_id, book_id, discount], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save discount" });
    }

    res.json({ message: "Discount saved" });
  });
};