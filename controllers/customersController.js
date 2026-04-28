import db from "../config/db.js";

/* =========================
   🔍 SEARCH CUSTOMERS
========================= */
export const searchCustomers = (req, res) => {
  const { q = "", page = 1, limit = 6, filter = "all" } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  /* =========================
     🔥 COUNT QUERY
  ========================= */
  let countSql = `
    SELECT COUNT(*) AS total
    FROM customers
    WHERE (name LIKE ? OR phone LIKE ? OR city LIKE ?)
  `;

  if (filter === "due") {
    countSql += " AND balance > 0";
  }

  if (filter === "paid") {
    countSql += " AND balance <= 0";
  }

  /* =========================
     🔥 MAIN QUERY
  ========================= */
  let sql = `
    SELECT 
      c.*,
      (
        SELECT MAX(date)
        FROM (
          SELECT MAX(created_at) AS date FROM sales WHERE customer_id = c.id
          UNION
          SELECT MAX(created_at) AS date FROM payments WHERE customer_id = c.id
        ) AS t
      ) AS last_activity
    FROM customers c
    WHERE (c.name LIKE ? OR c.phone LIKE ? OR c.city LIKE ?)
  `;

  // 🔥 FILTER LOGIC
  if (filter === "due") {
    sql += " AND c.balance > 0";
  }

  if (filter === "paid") {
    sql += " AND c.balance <= 0";
  }

  sql += `
    ORDER BY last_activity DESC
    LIMIT ? OFFSET ?
  `;

  /* =========================
     🔥 EXECUTION
  ========================= */
  db.query(countSql, [`%${q}%`, `%${q}%`, `%${q}%`], (err, countResult) => {
    if (err) {
      console.error("Count Error:", err);
      return res.status(500).json({ error: "Count failed" });
    }

    const total = countResult[0].total;

    db.query(sql, [`%${q}%`, `%${q}%`, `%${q}%`, limitNum, offset], (err, result) => {
      if (err) {
        console.error("Fetch Error:", err);
        return res.status(500).json({ error: "Fetch failed" });
      }

      res.json({
        data: result,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    });
  });
};

/* =========================
   ➕ CREATE CUSTOMER
========================= */
export const createCustomer = (req, res) => {
  let { name, phone, city, balance } = req.body;

  // 🔥 VALIDATION
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  // 🔧 CLEAN DATA
  name = name.trim();
  phone = phone || null;
  city = city || null;
  balance = Number(balance) || 0;

  const sql = `
    INSERT INTO customers (name, phone, city, balance)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, phone, city, balance], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ error: "Failed to create customer" });
    }

    // 🔥 RETURN CREATED CUSTOMER
    db.query(
      "SELECT * FROM customers WHERE id = ?",
      [result.insertId],
      (err2, rows) => {
        if (err2) {
          console.error("Fetch Error:", err2);
          return res.status(500).json({ error: "Fetch failed" });
        }

        res.json(rows[0]);
      }
    );
  });
};


/* =========================
   📊 CUSTOMER LEDGER
========================= */
export const getCustomerLedger = (req, res) => {
  const { id } = req.params;

  // 🔹 GET CUSTOMER
  db.query(
    "SELECT name, phone, city, balance FROM customers WHERE id = ?",
    [id],
    (err, customerResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Customer fetch failed" });
      }

      if (!customerResult.length) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const customer = customerResult[0];

      // 🔴 SALES (DEBIT)
      const salesSql = `
        SELECT 
          id,
          total_amount AS amount,
          created_at,
          'sale' AS type
        FROM sales
        WHERE customer_id = ?
      `;

      // 🟢 PAYMENTS (FIXED)
      const paymentsSql = `
  -- 1. Manual payments
  SELECT 
    id,
    amount,
    created_at,
    'payment' AS type
  FROM payments
  WHERE customer_id = ?

  UNION ALL

  -- 2. POS payments from sales table
  SELECT 
    id,
    paid_amount AS amount,
    created_at,
    'payment' AS type
  FROM sales
  WHERE customer_id = ?
  AND paid_amount > 0
`;

      db.query(salesSql, [id], (err, sales) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Sales fetch failed" });
        }

        // ✅ FIXED CALLBACK HERE
        db.query(paymentsSql, [id, id], (err, payments) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Payments fetch failed" });
          }

          // 🔥 MERGE
          let ledger = [...sales, ...payments];

          // 🔥 SORT (OLD → NEW)
          ledger.sort(
            (a, b) =>
              new Date(a.created_at) - new Date(b.created_at)
          );

          // 🔥 TOTALS
          let totalDebit = 0;
          let totalCredit = 0;

          ledger.forEach((entry) => {
            if (entry.type === "sale") {
              totalDebit += Number(entry.amount);
            } else {
              totalCredit += Number(entry.amount);
            }
          });

          // 🔥 OPENING BALANCE
          const openingBalance =
            Number(customer.balance) - (totalDebit - totalCredit);

          // 🔥 ADD OPENING ENTRY
          ledger.unshift({
            id: "OPENING",
            amount: 0,
            created_at: null,
            type: "opening",
            balance: openingBalance,
          });

          // 🔥 RUNNING BALANCE
          let balance = openingBalance;

          const fullLedger = ledger.map((entry) => {
            if (entry.type === "sale") {
              balance += Number(entry.amount);
            } else if (entry.type === "payment") {
              balance -= Number(entry.amount);
            }

            return {
              ...entry,
              balance,
            };
          });

          // ✅ NO PAGINATION (better for ledger + print)
          res.json({
            customer,
            ledger: fullLedger,
            final_balance: Number(customer.balance || 0),
          });
        });
      });
    }
  );
};
export const getCustomerStats = (req, res) => {
  const currentSql = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) AS credit,
      SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) AS paid,
      SUM(balance) AS outstanding
    FROM customers
  `;

  const prevSql = `
    SELECT 
      COUNT(*) AS total_prev,
      SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) AS credit_prev,
      SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) AS paid_prev,
      SUM(balance) AS outstanding_prev
    FROM customers
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)
  `;

  const calcChange = (current, prev) => {
    if (!prev || Number(prev) === 0) return 0;
    return ((Number(current || 0) - Number(prev || 0)) / Number(prev)) * 100;
  };

  db.query(currentSql, (err, currentResult) => {
    if (err) return res.status(500).json(err);

    db.query(prevSql, (err2, prevResult) => {
      if (err2) return res.status(500).json(err2);

      const current = currentResult[0] || {};
      const prev = prevResult[0] || {};

      res.json({
        total: Number(current.total || 0),
        credit: Number(current.credit || 0),
        paid: Number(current.paid || 0),
        outstanding: Number(current.outstanding || 0),

        totalChange: calcChange(current.total, prev.total_prev),
        creditChange: calcChange(current.credit, prev.credit_prev),
        paidChange: calcChange(current.paid, prev.paid_prev),
        outstandingChange: calcChange(current.outstanding, prev.outstanding_prev),
      });
    });
  });
};

/* =========================
   💰 ADD PAYMENT
========================= */
export const addPayment = (req, res) => {
  const { customer_id, amount } = req.body;

  if (!customer_id || !amount) {
    return res.status(400).json({ error: "Missing data" });
  }

  // 1️⃣ INSERT PAYMENT
  const sql = `
    INSERT INTO payments (customer_id, amount)
    VALUES (?, ?)
  `;

  db.query(sql, [customer_id, amount], (err) => {
    if (err) {
      console.error("Payment Insert Error:", err);
      return res.status(500).json({ error: "Insert failed" });
    }

    // 2️⃣ UPDATE CUSTOMER BALANCE
    db.query(
      "UPDATE customers SET balance = balance - ? WHERE id = ?",
      [amount, customer_id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }

        res.json({
          message: "Payment added successfully",
        });
      }
    );
  });
};


// =========================
//   ⬇️ EXPORT CUSTOMERS
// =========================
export const exportCustomers = (req, res) => {
  const { search = "", filter = "all" } = req.query;

  let condition = "WHERE 1=1";
  const params = [];

  // 🔍 SEARCH
  if (search) {
    condition += " AND (name LIKE ? OR phone LIKE ? OR city LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  // 📊 FILTER
  if (filter === "due") {
    condition += " AND balance > 0";
  } else if (filter === "paid") {
    condition += " AND balance <= 0";
  }

  const sql = `
    SELECT 
      id,
      name,
      phone,
      city,
      balance,
      created_at
    FROM customers
    ${condition}
    ORDER BY id DESC
  `;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Export Customers Error:", err);
      return res.status(500).json({ error: "Export failed" });
    }

    // 🔥 CSV (Excel compatible)
    const header = "ID,Name,Phone,City,Balance,Created At\n";

    const rows = result
      .map((c) =>
        `${c.id},"${c.name}","${c.phone || ""}","${c.city || ""}",${c.balance},${c.created_at}`
      )
      .join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "text/csv");
res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
    res.send(csv);
  });
};