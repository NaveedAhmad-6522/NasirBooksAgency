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
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  db.query(
    "SELECT name, phone, city, balance FROM customers WHERE id = ?",
    [id],
    (err, customerResult) => {
      if (err) return res.status(500).json({ error: "Customer fetch failed" });
      if (!customerResult.length) return res.status(404).json({ error: "Customer not found" });

      const customer = customerResult[0];

      const ledgerSql = `
  SELECT id, amount, created_at, type, items FROM (

    -- ✅ INDIVIDUAL SALES (no grouping)
    SELECT 
      id,
      total_amount AS amount,
      created_at,
      'sale' AS type,
      NULL AS items
    FROM sales
    WHERE customer_id = ?

    UNION ALL

    SELECT id, amount, created_at, 'payment' AS type, NULL AS items
    FROM payments WHERE customer_id = ?

    UNION ALL

    SELECT id, paid_amount AS amount, created_at, 'payment' AS type, NULL AS items
    FROM sales WHERE customer_id = ? AND paid_amount > 0

    UNION ALL

    SELECT id, amount, created_at, 'return' AS type, items
    FROM customer_returns WHERE customer_id = ?

  ) AS ledger
  ORDER BY created_at ASC, id ASC
  LIMIT ? OFFSET ?
`;

      const totalsSql = `
        SELECT 
          SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END) AS debit,
          SUM(CASE WHEN type IN ('payment','return') THEN amount ELSE 0 END) AS credit
        FROM (
          SELECT total_amount AS amount, 'sale' AS type FROM sales WHERE customer_id = ?
          UNION ALL
          SELECT amount, 'payment' FROM payments WHERE customer_id = ?
          UNION ALL
          SELECT paid_amount, 'payment' FROM sales WHERE customer_id = ? AND paid_amount > 0
          UNION ALL
          SELECT amount, 'return' FROM customer_returns WHERE customer_id = ?
        ) t
      `;

      const countSql = `
        SELECT COUNT(*) AS total FROM (
          SELECT id FROM sales WHERE customer_id = ?
          UNION ALL
          SELECT id FROM payments WHERE customer_id = ?
          UNION ALL
          SELECT id FROM sales WHERE customer_id = ? AND paid_amount > 0
          UNION ALL
          SELECT id FROM customer_returns WHERE customer_id = ?
        ) t
      `;

      db.query(ledgerSql, [id, id, id, id, limit, offset], (err, ledger) => {
        if (err) return res.status(500).json({ error: "Ledger fetch failed" });

        db.query(totalsSql, [id, id, id, id], (err2, totalsResult) => {
          if (err2) return res.status(500).json({ error: "Totals fetch failed" });

          db.query(countSql, [id, id, id, id], (err3, countResult) => {
            if (err3) return res.status(500).json({ error: "Count fetch failed" });

            const totals = totalsResult[0] || {};
            const totalRecords = countResult[0]?.total || 0;

            // opening balance (derived)
            const openingBalance = Number(customer.balance || 0) - (Number(totals.debit || 0) - Number(totals.credit || 0));

            // we calculate from oldest → newest
            let running = openingBalance;

            // already in ASC order from DB
            const calculated = ledger.map(e => {
              const amt = Number(e.amount || 0);
              if (e.type === 'sale') running += amt;
              else running -= amt;
              return { ...e, amount: amt, balance: Number(running) };
            });

            // then reverse back to DESC for UI
            const fullLedger = [
              ...calculated.reverse(),
              {
                id: 'OPENING',
                amount: 0,
                created_at: null,
                type: 'opening',
                balance: openingBalance
              }
            ];

            res.json({
              customer,
              ledger: fullLedger,
              totals: {
                debit: Number(totals.debit || 0) + Number(openingBalance || 0),
                credit: Number(totals.credit || 0),
                net: (Number(totals.debit || 0) + Number(openingBalance || 0)) - Number(totals.credit || 0),
              },
              pagination: {
                page,
                limit,
                total: totalRecords,
                totalPages: Math.ceil(totalRecords / limit)
              },
              final_balance: Number(customer.balance || 0)
            });
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
/* =========================
   📚 GET CUSTOMER PURCHASED BOOKS
========================= */
export const getCustomerSales = (req, res) => {
  const { id } = req.params;

  const sql = `
  SELECT 
    MIN(si.id) AS id,
    si.book_id,
    b.title AS book_name,
    b.publisher,
    b.edition AS edition,
    SUM(si.quantity) AS quantity,
    SUM(COALESCE(si.returned_quantity, 0)) AS returned_quantity,
    (SUM(si.quantity) - SUM(COALESCE(si.returned_quantity, 0))) AS remaining_quantity,
    COALESCE(AVG(si.price), 0) AS price,
    MAX(s.created_at) AS created_at,
    COALESCE(cbd.discount, 0) AS discount_percentage
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  LEFT JOIN books b ON si.book_id = b.id
  LEFT JOIN customer_discounts cbd 
    ON cbd.book_id = si.book_id 
    AND cbd.customer_id = s.customer_id
  WHERE s.customer_id = ?
  GROUP BY si.book_id
  ORDER BY created_at DESC
`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Customer Sales Fetch Error:", err);
      return res.status(500).json({ error: "Failed to fetch customer sales" });
    }

    res.json(result);
  });
};


/* =========================
   🔁 CUSTOMER RETURN (UPDATE STOCK + BALANCE)
========================= */
export const addCustomerReturn = (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !items || !items.length) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // =======================================================
  // 1) ADD accumulator BEFORE processItem
  // =======================================================
  let returnItems = [];
  let totalReturnAmount = 0;

  // Move handleRows above its first usage
  const handleRows = (err, rows, quantity, index) => {
    if (err || !rows.length) {
      console.error(err);
      return res.status(500).json({ error: "No sales found for this book" });
    }

    // 2️⃣ Calculate total available
    let totalQty = 0;
    let totalReturned = 0;

    rows.forEach(r => {
      totalQty += Number(r.quantity || 0);
      totalReturned += Number(r.returned_quantity || 0);
    });

    const available = totalQty - totalReturned;

    if (quantity > available) {
      return res.status(400).json({
        error: `Return exceeds available quantity. Available: ${available}`
      });
    }

    let remainingToReturn = quantity;

    // 3️⃣ Deduct from rows (FIFO)
    const updateNext = (i) => {
      if (i >= rows.length || remainingToReturn <= 0) {
        // update stock + balance after distribution
        const price = Number(rows[0].price || 0);
        const discountPercent = Number(
          rows[0].discount_percentage ?? rows[0].discount ?? 0
        );

        // apply discount
        const discountedPrice = price - (price * discountPercent / 100);

        const returnAmount = quantity * discountedPrice;

        // update stock
        db.query(
          "UPDATE books SET stock = stock + ? WHERE id = ?",
          [quantity, rows[0].book_id]
        );

        // update customer balance
        db.query(
          "UPDATE customers SET balance = balance - ? WHERE id = ?",
          [returnAmount, customer_id]
        );

        // =======================================================
        // 2) MODIFY handleRows → REMOVE DB insert logic
        // =======================================================
        const itemObj = {
          book_id: rows[0].book_id,
          book_name: rows[0].book_name || "",
          publisher: rows[0].publisher || "",
          edition: rows[0].edition || "",
          quantity,
          price: discountedPrice,
          original_price: price,
          discount: discountPercent
        };

        returnItems.push(itemObj);
        totalReturnAmount += returnAmount;

        return processItem(index + 1);
      }

      const row = rows[i];
      const rowAvailable = Number(row.quantity) - Number(row.returned_quantity || 0);

      if (rowAvailable <= 0) {
        return updateNext(i + 1);
      }

      const take = Math.min(rowAvailable, remainingToReturn);

      db.query(
        `UPDATE sale_items 
         SET returned_quantity = COALESCE(returned_quantity,0) + ? 
         WHERE id = ?`,
        [take, row.id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Return update failed" });
          }

          remainingToReturn -= take;
          updateNext(i + 1);
        }
      );
    };

    updateNext(0);
  };

  // =======================================================
  // processItem
  // =======================================================
  const processItem = (index) => {
    // =======================================================
    // 3) FINALIZE INVOICE AFTER LOOP
    // =======================================================
    if (index >= items.length) {

      // 🔥 CREATE / UPDATE SINGLE INVOICE HERE
      db.query(
        `SELECT id, items FROM customer_returns 
         WHERE customer_id = ? 
         AND DATE(CONVERT_TZ(created_at,'+00:00','+05:00')) = DATE(CONVERT_TZ(NOW(),'+00:00','+05:00'))`,
        [customer_id],
        (err, existing) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Return fetch failed" });
          }

          if (existing && existing.length) {
            let existingItems = [];
            if (existing[0].items) {
              try {
                if (typeof existing[0].items === "string") {
                  existingItems = JSON.parse(existing[0].items);
                } else if (typeof existing[0].items === "object") {
                  existingItems = existing[0].items;
                }
              } catch (e) {
                console.error("Items parse error:", e);
                existingItems = [];
              }
            }

            const mergedItems = [...existingItems, ...returnItems];

            db.query(
              `UPDATE customer_returns 
               SET amount = amount + ?, items = ?
               WHERE id = ?`,
              [totalReturnAmount, JSON.stringify(mergedItems), existing[0].id]
            );
          } else {
            // NOTE: (previous dues handled in frontend using customer.balance before update)
            db.query(
              `INSERT INTO customer_returns (customer_id, amount, items)
               VALUES (?, ?, ?)`,
              [customer_id, totalReturnAmount, JSON.stringify(returnItems)]
            );
          }

          // return customer_id in response for fallback customer info fetch
          return res.json({ 
            message: "Return processed successfully",
            customer_id
          });
        }
      );
      return;
    }

    const { book_id, sale_item_id, quantity } = items[index];

    // 1️⃣ Fetch ALL sale items for this book or by sale_item_id
    let sql;
    let params;

    if (book_id) {
      sql = `
        SELECT 
  si.*,
  b.title AS book_name,
  b.publisher,
  b.edition,
  cbd.discount AS discount_percentage
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
LEFT JOIN books b ON b.id = si.book_id
LEFT JOIN customer_discounts cbd
  ON cbd.book_id = si.book_id
  AND cbd.customer_id = s.customer_id
WHERE s.customer_id = ?
AND si.book_id = ?
ORDER BY si.id ASC
      `;
      params = [customer_id, book_id];
    } else if (sale_item_id) {
      // 🔥 First get book_id from sale_item_id
      return db.query(
        `SELECT si.book_id 
         FROM sale_items si 
         JOIN sales s ON s.id = si.sale_id 
         WHERE s.customer_id = ? AND si.id = ?`,
        [customer_id, sale_item_id],
        (err, result) => {
          if (err || !result.length) {
            return res.status(500).json({ error: "Sale item not found" });
          }

          const resolvedBookId = result[0].book_id;

          // 🔥 Now fetch ALL rows for that book (IMPORTANT FIX)
          const sql2 = `
   SELECT 
  si.*,
  b.title AS book_name,
  b.publisher,
  b.edition,
  cbd.discount AS discount_percentage
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
LEFT JOIN books b ON b.id = si.book_id
LEFT JOIN customer_discounts cbd
  ON cbd.book_id = si.book_id
  AND cbd.customer_id = s.customer_id
WHERE s.customer_id = ?
AND si.book_id = ?
ORDER BY si.id ASC
          `;

          db.query(sql2, [customer_id, resolvedBookId], (err, rows) => handleRows(err, rows, quantity, index));
        }
      );
    }

    if (book_id) {
      db.query(sql, params, (err, rows) => handleRows(err, rows, quantity, index));
    }
  };

  processItem(0);
};
/* =========================
   👤 GET SINGLE CUSTOMER
========================= */
export const getCustomerById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT id, name, phone, city, address, balance FROM customers WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Fetch Customer Error:", err);
        return res.status(500).json({ error: "Failed to fetch customer" });
      }

      if (!result.length) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(result[0]);
    }
  );
};