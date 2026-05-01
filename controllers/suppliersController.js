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
    SELECT COUNT(*) AS total
    FROM suppliers s
    ${condition}
  `;

  const sql = `
    SELECT 
      s.id,
      s.name,
      s.phone,
      s.city,
      s.is_active,

      (
        SELECT IFNULL(SUM(p.quantity), 0)
        FROM purchases p
        WHERE p.supplier_id = s.id
      ) AS totalBooks,

      (
        SELECT IFNULL(SUM(
          CASE WHEN p.type = 'return'
            THEN -1 * (p.quantity * p.purchase_price)
            ELSE (p.quantity * p.purchase_price)
          END
        ), 0)
        FROM purchases p
        WHERE p.supplier_id = s.id
      ) AS totalAmount,

      (
        SELECT IFNULL(SUM(sp.amount), 0)
        FROM supplier_payments sp
        WHERE sp.supplier_id = s.id
      ) AS totalPayments,

      (
        (
          SELECT IFNULL(SUM(
            CASE WHEN p.type = 'return'
              THEN -1 * (p.quantity * p.purchase_price)
              ELSE (p.quantity * p.purchase_price)
            END
          ), 0)
          FROM purchases p
          WHERE p.supplier_id = s.id
        ) -
        (
          SELECT IFNULL(SUM(sp.amount), 0)
          FROM supplier_payments sp
          WHERE sp.supplier_id = s.id
        )
      ) AS balance,

      (
        SELECT MAX(p.created_at)
        FROM purchases p
        WHERE p.supplier_id = s.id
      ) AS lastSupply

    FROM suppliers s

    ${condition}

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

// =========================
//    UPDATE SUPPLIER
// =========================
export const updateSupplier = (req, res) => {
  const { id } = req.params;
  const { name, phone, city } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }

  const sql = `
    UPDATE suppliers
    SET name = ?, phone = ?, city = ?
    WHERE id = ?
  `;

  db.query(sql, [name, phone, city, id], (err) => {
    if (err) {
      console.error("UPDATE SUPPLIER ERROR:", err);
      return res.status(500).json({ error: "Failed to update supplier" });
    }

    res.json({ message: "Supplier updated" });
  });
};

// =========================
//    DELETE SUPPLIER (WITH VALIDATION)
// =========================
export const deleteSupplier = (req, res) => {
  const { id } = req.params;

  const checkSql = `
    SELECT 
      (SELECT COUNT(*) FROM purchases WHERE supplier_id = ?) AS purchasesCount,
      (SELECT COUNT(*) FROM supplier_payments WHERE supplier_id = ?) AS paymentsCount
  `;

  db.query(checkSql, [id, id], (err, result) => {
    if (err) {
      console.error("CHECK DELETE ERROR:", err);
      return res.status(500).json({ error: "Failed to validate supplier" });
    }

    const { purchasesCount, paymentsCount } = result[0];

    if (purchasesCount > 0 || paymentsCount > 0) {
      return res.status(400).json({
        error: "Cannot delete supplier with transactions or payments",
      });
    }

    const deleteSql = `DELETE FROM suppliers WHERE id = ?`;

    db.query(deleteSql, [id], (err2) => {
      if (err2) {
        console.error("DELETE SUPPLIER ERROR:", err2);
        return res.status(500).json({ error: "Failed to delete supplier" });
      }

      res.json({ message: "Supplier deleted" });
    });
  });
};

// =========================
//    TOGGLE SUPPLIER STATUS
// =========================
export const toggleSupplierStatus = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE suppliers
    SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      console.error("TOGGLE STATUS ERROR:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }

    res.json({ message: "Status updated" });
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

    const amt = Number(amount);

    if (!supplier_id || isNaN(amt) || amt === 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    const paymentSql = `
      INSERT INTO supplier_payments (supplier_id, amount, note)
      VALUES (?, ?, ?)
    `;

    db.query(paymentSql, [supplier_id, amt, note], (err, result) => {
      if (err) {
        console.error("PAYMENT INSERT ERROR:", err);
        return res.status(500).json({ error: "Payment failed" });
      }

      const paymentId = result.insertId;

      const ledgerSql = `
        INSERT INTO supplier_ledger (supplier_id, type, amount, reference_id)
        VALUES (?, 'payment', ?, ?)
      `;

      db.query(ledgerSql, [supplier_id, amt, paymentId], (err2) => {
        if (err2) {
          console.error("LEDGER INSERT ERROR:", err2);
          return res.status(500).json({ error: "Ledger failed" });
        }

        res.json({ message: "Payment recorded" });
      });
    });
  };

 //ledger

export const getSupplierLedger = (req, res) => {
  const { id } = req.params;
  const { limit = 20, cursor, date } = req.query;
  const pageLimit = Number(limit) || 20;

  const supplierSql = `
    SELECT id, name, phone, city
    FROM suppliers
    WHERE id = ?
  `;

  // --- TOTALS SQL ---
  const totalsSql = `
    SELECT 
      SUM(CASE WHEN TRIM(LOWER(type)) = 'purchase' THEN amount ELSE 0 END) AS totalPurchases,
      SUM(CASE WHEN TRIM(LOWER(type)) = 'return' THEN amount ELSE 0 END) AS totalReturns,
      SUM(CASE WHEN TRIM(LOWER(type)) = 'payment' THEN amount ELSE 0 END) AS totalPayments
    FROM (
      SELECT 
        TRIM(LOWER(p.type)) AS type,
        (CASE WHEN TRIM(LOWER(p.type)) = 'return' THEN -1 ELSE 1 END) * (p.quantity * p.purchase_price) AS amount
      FROM purchases p
      WHERE p.supplier_id = ?

      UNION ALL

      SELECT 
        'payment' AS type,
        sp.amount
      FROM supplier_payments sp
      WHERE sp.supplier_id = ?
    ) t
  `;

  const ledgerSql = `
    SELECT * FROM (
      SELECT 
        t.*,
        @balance := @balance + 
          CASE 
            WHEN t.type = 'purchase' THEN t.amount
            WHEN t.type = 'return' THEN t.amount
            WHEN t.type = 'payment' THEN -t.amount
          END AS balance
      FROM (
        -- Purchases grouped per day/type
        SELECT 
          p.type AS type,
          CONCAT(
            CASE WHEN p.type = 'return' THEN 'RINV-' ELSE 'INV-' END,
            DATE(MAX(CONVERT_TZ(p.created_at, '+00:00', '+05:00')))
          ) AS reference_id,
          MAX(CONVERT_TZ(p.created_at, '+00:00', '+05:00')) AS created_at,
          SUM(
            (CASE WHEN p.type = 'return' THEN -1 ELSE 1 END) * (p.quantity * p.purchase_price)
          ) AS amount
        FROM purchases p
        WHERE p.supplier_id = ?
        ${date ? "AND DATE(CONVERT_TZ(p.created_at, '+00:00', '+05:00')) = ?" : ""}
        GROUP BY DATE(CONVERT_TZ(p.created_at, '+00:00', '+05:00')), p.type

        UNION ALL

        -- Payments
        SELECT 
          'payment' AS type,
          CONCAT('PAY-', sp.id) AS reference_id,
          sp.created_at,
          sp.amount
        FROM supplier_payments sp
        WHERE sp.supplier_id = ?
        ${date ? "AND DATE(CONVERT_TZ(sp.created_at, '+00:00', '+05:00')) = ?" : ""}
      ) t
      JOIN (SELECT @balance := 0) b
      ORDER BY t.created_at ASC
    ) final
    ${cursor ? "WHERE (final.created_at < ? OR (final.created_at = ? AND final.reference_id < ?))" : ""}
    ORDER BY final.created_at DESC, final.reference_id DESC
    LIMIT ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 
        DATE(CONVERT_TZ(created_at, '+00:00', '+05:00')) AS dt,
        type
      FROM purchases
      WHERE supplier_id = ?
      GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+05:00')), type

      UNION ALL

      SELECT 
        DATE(CONVERT_TZ(created_at, '+00:00', '+05:00')) AS dt,
        'payment' AS type
      FROM supplier_payments
      WHERE supplier_id = ?
    ) t
  `;

  db.query(supplierSql, [id], (err, supplierResult) => {
    if (err) {
      console.error("SUPPLIER FETCH ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch supplier" });
    }

    const supplier = supplierResult[0];

    db.query(countSql, [id, id], (countErr, countResult) => {
      if (countErr) {
        console.error("COUNT LEDGER ERROR:", countErr);
        return res.status(500).json({ error: "Failed to count ledger" });
      }

      const total = countResult[0]?.total || 0;

      // --- TOTALS QUERY ---
      db.query(totalsSql, [id, id], (totErr, totalsResult) => {
        if (totErr) {
          console.error("TOTALS ERROR:", totErr);
          return res.status(500).json({ error: "Failed to calculate totals" });
        }

        const totals = totalsResult[0] || {};

        const queryLimit = pageLimit + 1;

        const params = date
          ? [id, date, id, date]
          : [id, id];

        if (cursor) {
          const [cursorDateRaw, cursorRef] = cursor.split("|");

          // 🔥 Convert JS date string to MySQL DATETIME format
          const cursorDate = new Date(cursorDateRaw)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

          params.push(cursorDate, cursorDate, cursorRef);
        }
        params.push(queryLimit);

        db.query(ledgerSql, params, (err2, result) => {
          if (err2) {
            console.error("LEDGER ERROR:", err2);
            return res.status(500).json({ error: "Failed to fetch ledger" });
          }

          let hasMore = false;
          let ledger = result;

          if (result.length > pageLimit) {
            hasMore = true;
            ledger = result.slice(0, pageLimit); // remove extra row
          }

          res.json({
            supplier,
            ledger,
            totalTransactions: total,
            hasMore,
            nextCursor: ledger.length 
              ? `${ledger[ledger.length - 1].created_at}|${ledger[ledger.length - 1].reference_id}` 
              : null,
            summary: {
              totalPurchases: Number(totals.totalPurchases || 0),
              totalReturns: Number(totals.totalReturns || 0),
              totalPayments: Number(totals.totalPayments || 0),
              payable:
                Number(totals.totalPurchases || 0) +
                Number(totals.totalReturns || 0) -
                Number(totals.totalPayments || 0),
            },
          });
        });
      });
    });
  });
};
// 📄 GET SUPPLIER INVOICE DETAILS (books for a specific date)
export const getSupplierInvoiceDetails = (req, res) => {
  const { id, date } = req.params;
  const { type } = req.query; // 'purchase' or 'return'

  // 🔥 Validate date
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  // Debug: log params for verification
  console.log("Invoice Fetch Params:", { id, date, type });

  const sql = `
    SELECT 
      COALESCE(b.title, 'Unknown Book') AS book_name,
      p.quantity,
      ROUND(p.purchase_price, 2) AS purchase_price,
      ROUND(COALESCE(p.printed_price, b.printed_price), 2) AS printed_price,
      p.discount AS percentage,
      ROUND(
        (CASE WHEN p.type = 'return' THEN -1 ELSE 1 END) * (p.quantity * p.purchase_price),
        2
      ) AS total,
      p.type,
      p.created_at
    FROM purchases p
    LEFT JOIN books b ON b.id = p.book_id
    WHERE p.supplier_id = ?
      AND DATE(CONVERT_TZ(p.created_at, '+00:00', '+05:00')) = ?
      ${type ? "AND TRIM(LOWER(p.type)) = TRIM(LOWER(?))" : ""}
    ORDER BY p.created_at ASC
  `;

  const params = type
    ? [id, date, type]
    : [id, date];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("INVOICE DETAILS ERROR:", err);

      return res.status(500).json({
        error: "Failed to fetch invoice details",
        details: err.message, // 🔥 useful in dev
      });
    }

    console.log("INVOICE RESULT COUNT:", result.length);

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
// =========================
//    RETURN TO SUPPLIER
// =========================
export const returnToSupplier = (req, res) => {
  const {
    supplier_id,
    book_id,
    quantity,
    purchase_price,
    printed_price,
    note,
  } = req.body;

  if (!supplier_id || !book_id || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const qty = Number(quantity);
  if (qty <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  // 🔒 START TRANSACTION
  db.beginTransaction((err) => {
    if (err) {
      console.error("TX START ERROR:", err);
      return res.status(500).json({ error: "Transaction failed" });
    }

    // ✅ 1. Verify this book actually belongs to this supplier
    const checkRelationSql = `
      SELECT COUNT(*) AS count
      FROM purchases
      WHERE supplier_id = ? AND book_id = ?
    `;

    db.query(checkRelationSql, [supplier_id, book_id], (err1, relResult) => {
      if (err1) {
        return db.rollback(() => {
          console.error("RELATION CHECK ERROR:", err1);
          res.status(500).json({ error: "Validation failed" });
        });
      }

      if (!relResult[0]?.count) {
        return db.rollback(() => {
          res.status(400).json({ error: "This supplier never supplied this book" });
        });
      }

      // ✅ 2. Check stock
      const stockSql = "SELECT stock FROM books WHERE id = ? FOR UPDATE";

      db.query(stockSql, [book_id], (err2, stockResult) => {
        if (err2) {
          return db.rollback(() => {
            console.error("STOCK CHECK ERROR:", err2);
            res.status(500).json({ error: "Stock check failed" });
          });
        }

        const currentStock = stockResult[0]?.stock || 0;

        if (qty > currentStock) {
          return db.rollback(() => {
            res.status(400).json({
              error: `Cannot return more than available stock (${currentStock})`,
            });
          });
        }

        // ✅ Safe fallback prices
        const safePurchasePrice = purchase_price || 0;
        const safePrintedPrice = printed_price || 0;

        // ✅ 3. Insert return
        const insertSql = `
          INSERT INTO purchases (
            book_id,
            supplier_id,
            quantity,
            purchase_price,
            printed_price,
            type,
            note
          )
          VALUES (?, ?, ?, ?, ?, 'return', ?)
        `;

        db.query(
          insertSql,
          [book_id, supplier_id, qty, safePurchasePrice, safePrintedPrice, note],
          (err3) => {
            if (err3) {
              return db.rollback(() => {
                console.error("INSERT RETURN ERROR:", err3);
                res.status(500).json({ error: "Failed to insert return" });
              });
            }

            // ✅ 4. Update stock
            const updateStockSql = `
              UPDATE books
              SET stock = stock - ?
              WHERE id = ?
            `;

            db.query(updateStockSql, [qty, book_id], (err4) => {
              if (err4) {
                return db.rollback(() => {
                  console.error("STOCK UPDATE ERROR:", err4);
                  res.status(500).json({ error: "Stock update failed" });
                });
              }

              // ✅ COMMIT
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() => {
                    console.error("COMMIT ERROR:", commitErr);
                    res.status(500).json({ error: "Transaction commit failed" });
                  });
                }

                res.json({ message: "Return processed successfully" });
              });
            });
          }
        );
      });
    });
  });
};

export const getSupplierBooks = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT DISTINCT 
      b.id,
      b.title,
      b.stock,
      b.purchase_price,
      b.printed_price
    FROM purchases p
    JOIN books b ON b.id = p.book_id
    WHERE p.supplier_id = ?
    ORDER BY b.title ASC
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("SUPPLIER BOOKS ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch supplier books" });
    }

    res.json(result);
  });
};