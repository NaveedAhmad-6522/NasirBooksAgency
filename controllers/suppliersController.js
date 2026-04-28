import db from "../config/db.js";

/* =========================
   📦 GET SUPPLIERS (WITH FILTER + SEARCH)
========================= */
export const getSuppliers = (req, res) => {
  const { search = "", filter = "all", limit = 20, offset = 0 } = req.query;

  let condition = "WHERE 1=1";
  const params = [];

  // 🔍 SEARCH (name + phone)
  if (search) {
    condition += " AND (s.name LIKE ? OR s.phone LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  // 📊 FILTER
  if (filter === "active") {
    condition += " AND s.is_active = 1";
  } else if (filter === "inactive") {
    condition += " AND s.is_active = 0";
  }

  // 🔢 TOTAL COUNT QUERY
  const countSql = `
    SELECT COUNT(DISTINCT s.id) AS total
    FROM suppliers s
    LEFT JOIN purchases p ON p.supplier_id = s.id
    ${condition}
  `;

  const sql = `
    SELECT 
      s.id,
      s.name,
      s.phone,
      s.city,
      s.is_active,

      -- total books (fix type)
      CAST(IFNULL(SUM(p.quantity), 0) AS SIGNED) AS totalBooks,

      -- total amount (fix decimals)
      CAST(IFNULL(SUM(p.quantity * p.purchase_price), 0) AS DECIMAL(12,2)) AS totalAmount,

      -- total payments
      CAST(IFNULL(MAX(sp.totalPayments), 0) AS DECIMAL(12,2)) AS totalPayments,

      -- payable (purchases - payments)
      CAST(
        IFNULL(SUM(p.quantity * p.purchase_price), 0)
        - IFNULL(MAX(sp.totalPayments), 0)
        AS DECIMAL(12,2)
      ) AS balance,

      -- last supply
      MAX(p.created_at) AS lastSupply

    FROM suppliers s

    LEFT JOIN purchases p ON p.supplier_id = s.id

    LEFT JOIN (
      SELECT supplier_id, SUM(amount) AS totalPayments
      FROM supplier_payments
      GROUP BY supplier_id
    ) sp ON sp.supplier_id = s.id

    ${condition}

    GROUP BY s.id

    ORDER BY s.id DESC

    LIMIT ? OFFSET ?
  `;

  // 1️⃣ Get total count
  db.query(countSql, params, (err, countResult) => {
    if (err) {
      console.error("COUNT ERROR:", err);
      return res.status(500).json({ error: "Failed to count suppliers" });
    }

    const total = countResult[0]?.total || 0;

    // 2️⃣ Get paginated data
    db.query(
      sql,
      [...params, Number(limit), Number(offset)],
      (err, result) => {
        if (err) {
          console.error("GET SUPPLIERS ERROR:", err);
          return res.status(500).json({ error: "Failed to fetch suppliers" });
        }

        res.json({
          data: result,
          total,
        });
      }
    );
  });
};

export const addSupplier = (req, res) => {
    const { name, phone, city } = req.body;
  
    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }
  
    const sql = `
      INSERT INTO suppliers (name, phone, city)
      VALUES (?, ?, ?)
    `;
  
    db.query(sql, [name, phone, city], (err) => {
      if (err) {
        console.error("Add supplier error:", err);
        return res.status(500).json({ error: "Failed to add supplier" });
      }
  
      res.json({ message: "Supplier added" });
    });
  };

// 📊 GLOBAL SUPPLIERS STATS FOR DASHBOARD
export const getSuppliersStats = (req, res) => {
  const totalsSql = `
    SELECT 
      COUNT(DISTINCT s.id) AS total_suppliers,
      CAST(IFNULL(SUM(p.quantity), 0) AS SIGNED) AS total_purchases,
      CAST(IFNULL(SUM(p.quantity * p.purchase_price), 0) AS DECIMAL(12,2)) AS total_amount
    FROM suppliers s
    LEFT JOIN purchases p ON p.supplier_id = s.id
  `;

  const topSupplierSql = `
    SELECT s.name
    FROM suppliers s
    LEFT JOIN purchases p ON p.supplier_id = s.id
    GROUP BY s.id
    ORDER BY IFNULL(SUM(p.quantity * p.purchase_price), 0) DESC
    LIMIT 1
  `;

  db.query(totalsSql, (err, totalsResult) => {
    if (err) {
      console.error("STATS TOTAL ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    db.query(topSupplierSql, (err2, topResult) => {
      if (err2) {
        console.error("TOP SUPPLIER ERROR:", err2);
        return res.status(500).json({ error: "Failed to fetch top supplier" });
      }

      res.json({
        total_suppliers: totalsResult[0]?.total_suppliers || 0,
        total_purchases: totalsResult[0]?.total_purchases || 0,
        total_amount: totalsResult[0]?.total_amount || 0,
        top_supplier: topResult[0]?.name || "--",
      });
    });
  });
};


export const exportSuppliers = (req, res) => {
    const sql = `
      SELECT 
        s.name,
        s.phone,
        s.city,
        IFNULL(SUM(p.quantity), 0) AS totalBooks,
        IFNULL(SUM(p.quantity * p.purchase_price), 0) AS totalAmount,
        MAX(p.created_at) AS lastSupply
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.id DESC
    `;
  
    db.query(sql, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Export failed" });
      }
  
      // Convert to CSV (Excel-friendly)
      const header = [
        "Name",
        "Phone",
        "City",
        "Total Books",
        "Total Amount",
        "Last Supply",
      ];
  
      const rows = result.map((r) => [
        r.name,
        r.phone,
        r.city || "-",
        r.totalBooks,
        r.totalAmount,
        r.lastSupply,
      ]);
  
      const csv = [header, ...rows]
        .map((row) => row.join(","))
        .join("\n");
  
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=suppliers.csv"
      );
  
      res.send(csv);
    });
  };

  export const addSupplierPayment = (req, res) => {
    const { supplier_id, amount, note } = req.body;
  
    if (!supplier_id || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }
  
    const paymentSql = `
      INSERT INTO supplier_payments (supplier_id, amount, note)
      VALUES (?, ?, ?)
    `;
  
    db.query(paymentSql, [supplier_id, amount, note], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Payment failed" });
      }
  
      const paymentId = result.insertId;
  
      const ledgerSql = `
        INSERT INTO supplier_ledger (supplier_id, type, amount, reference_id)
        VALUES (?, 'payment', ?, ?)
      `;
  
      db.query(ledgerSql, [supplier_id, amount, paymentId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: "Ledger failed" });
        }
  
        res.json({ message: "Payment recorded" });
      });
    });
  };

 //ledger

 export const getSupplierLedger = (req, res) => {
    const { id } = req.params;
  
    const supplierSql = `
      SELECT id, name, phone, city
      FROM suppliers
      WHERE id = ?
    `;
  
    const ledgerSql = `
      SELECT * FROM (
        -- GROUPED PURCHASE INVOICES (DAILY)
        SELECT 
          'purchase' AS type,
          CONCAT('INV-', DATE(MIN(p.created_at))) AS reference_id,
          MIN(p.created_at) AS created_at,
          SUM(p.quantity * p.purchase_price) AS amount
        FROM purchases p
        WHERE p.supplier_id = ?
        GROUP BY DATE(p.created_at)

        UNION ALL

        -- PAYMENTS
        SELECT 
          'payment' AS type,
          CONCAT('PAY-', sp.id) AS reference_id,
          sp.created_at,
          sp.amount
        FROM supplier_payments sp
        WHERE sp.supplier_id = ?
      ) t
      ORDER BY t.created_at ASC
    `;
  
    db.query(supplierSql, [id], (err, supplierResult) => {
      if (err) {
        console.error("SUPPLIER FETCH ERROR:", err);
        return res.status(500).json({ error: "Failed to fetch supplier" });
      }
  
      const supplier = supplierResult[0];
  
      db.query(ledgerSql, [id, id], (err2, result) => {
        if (err2) {
          console.error("LEDGER ERROR:", err2);
          return res.status(500).json({ error: "Failed to fetch ledger" });
        }
  
        let balance = 0;

        const ledger = result.map((row) => {
          if (row.type === "purchase") {
            balance += Number(row.amount);
          } else {
            balance -= Number(row.amount);
          }

          return {
            ...row,
            balance,
          };
        });

        // 🔥 Fetch detailed purchase items grouped by date
        const itemsSql = `
          SELECT 
            DATE(p.created_at) as invoice_date,
            p.book_id,
            p.quantity,
            p.purchase_price
          FROM purchases p
          WHERE p.supplier_id = ?
        `;

        // attach items later (optional enhancement)

        res.json({
          supplier,
          ledger,
        });
      });
    });
  };
// 📄 GET SUPPLIER INVOICE DETAILS (books for a specific date)
export const getSupplierInvoiceDetails = (req, res) => {
    const { id, date } = req.params;

    const sql = `
      SELECT 
        COALESCE(b.title, 'Unknown Book') AS book_name,
        p.quantity,
        p.purchase_price,
        b.printed_price,
        p.discount AS percentage,
        (p.quantity * p.purchase_price) AS total,
        p.created_at
      FROM purchases p
      LEFT JOIN books b ON b.id = p.book_id
      WHERE p.supplier_id = ?
        AND p.created_at >= ?
        AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY p.created_at ASC
    `;

    db.query(sql, [id, date, date], (err, result) => {
      if (err) {
        console.error("INVOICE DETAILS ERROR:", err);
        return res.status(500).json({ error: "Failed to fetch invoice details" });
      }

      res.json({
        invoice_date: date,
        items: result || [],
      });
    });
  };

// 📄 GET SUPPLIER PAYMENT INVOICE DETAILS
export const getSupplierPaymentDetails = (req, res) => {
  const { id } = req.params; // payment id

  const sql = `
    SELECT 
      sp.id,
      sp.amount,
      sp.note,
      sp.created_at,
      s.name AS supplier_name
    FROM supplier_payments sp
    LEFT JOIN suppliers s ON s.id = sp.supplier_id
    WHERE sp.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("PAYMENT DETAILS ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch payment details" });
    }

    res.json(result[0] || null);
  });
};