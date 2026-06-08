import db from "../config/db.js";

// In-memory rebuild lock map
const customerLedgerRebuildLocks = new Map();

// Helper function to rebuild customer ledger and update balances in sales and customers
async function rebuildCustomerLedger(customerId) {
  // Ledger rebuild lock: prevent concurrent rebuilds for same customer
  if (customerLedgerRebuildLocks.has(customerId)) {
    return customerLedgerRebuildLocks.get(customerId);
  }

  // The actual transactional rebuild logic is inside this inner Promise
  const rebuildPromise = new Promise((innerResolve, innerReject) => {
    (async () => {
      let connection;

      try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const [customerRows] = await connection.query(
          `SELECT opening_balance FROM customers WHERE id = ?`,
          [customerId]
        );

        let runningBalance = Number(
          customerRows[0]?.opening_balance || 0
        );

        const ledgerSql = `
          SELECT * FROM (
            SELECT
              id,
              total_amount AS amount,
              created_at,
              'sale' AS type
            FROM sales
            WHERE customer_id = ?

            UNION ALL

            SELECT
              id,
              amount,
              created_at,
              'payment' AS type
            FROM payments
            WHERE customer_id = ?

            UNION ALL

            SELECT
              id,
              amount,
              created_at,
              'return' AS type
            FROM customer_returns
            WHERE customer_id = ?

            UNION ALL

            SELECT
              id,
              paid_amount AS amount,
              created_at,
              'payment' AS type
            FROM sales
            WHERE customer_id = ?
              AND paid_amount > 0
          ) x
          ORDER BY created_at ASC, id ASC
        `;

        const [ledgerRows] = await connection.query(
          ledgerSql,
          [customerId, customerId, customerId, customerId]
        );

        const saleUpdates = [];

        for (const row of ledgerRows) {
          const amount = Number(row.amount || 0);

          if (row.type === 'sale') {
            const previousBalance = runningBalance;
            runningBalance += amount;

            saleUpdates.push({
              saleId: row.id,
              previousBalance,
              customerBalance: runningBalance,
            });
          } else {
            runningBalance -= amount;
          }
        }

        const finalBalance = Number(runningBalance.toFixed(2));

        await connection.query(
          'UPDATE customers SET balance = ? WHERE id = ?',
          [finalBalance, customerId]
        );

        for (const sale of saleUpdates) {
          await connection.query(
            `UPDATE sales
             SET previous_balance = ?,
                 customer_balance = ?
             WHERE id = ?`,
            [
              sale.previousBalance,
              sale.customerBalance,
              sale.saleId,
            ]
          );
        }

        await connection.commit();
        innerResolve(finalBalance);

      } catch (err) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (_) {}
        }
        innerReject(err);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    })();
  });

  customerLedgerRebuildLocks.set(customerId, rebuildPromise);
  rebuildPromise.finally(() => {
    customerLedgerRebuildLocks.delete(customerId);
  });
  return rebuildPromise;
}

// IMPORTANT DATABASE SAFETY:
// Run once in MySQL:
// ALTER TABLE sale_items
// ADD UNIQUE unique_sale_book (sale_id, book_id);

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
  phone = phone ? phone.trim() : null;
  city = city || null;
  balance = Number(balance) || 0;

  const createCustomerRecord = () => {
    const sql = `
      INSERT INTO customers (
        name,
        phone,
        city,
        balance,
        opening_balance
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        name,
        phone,
        city,
        balance,
        balance
      ],
      (err, result) => {
      if (err) {
        console.error("Insert Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Customer with this phone number already exists"
          });
        }

        return res.status(500).json({ error: "Failed to create customer" });
      }

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
    }
  );
  };

  if (!phone) {
    return createCustomerRecord();
  }

  db.query(
    "SELECT id, name FROM customers WHERE phone = ? LIMIT 1",
    [phone],
    (checkErr, existingRows) => {
      if (checkErr) {
        console.error(checkErr);
        return res.status(500).json({ error: "Customer validation failed" });
      }

      if (existingRows.length) {
        return res.status(409).json({
          message: `Customer already exists: ${existingRows[0].name}`
        });
      }

      createCustomerRecord();
    }
  );
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
    "SELECT name, phone, city, balance, opening_balance FROM customers WHERE id = ?",
    [id],
    (err, customerResult) => {
      if (err) return res.status(500).json({ error: "Customer fetch failed" });
      if (!customerResult.length) return res.status(404).json({ error: "Customer not found" });

      const customer = customerResult[0];

      const ledgerSql = `
  SELECT id, amount, created_at, type, items FROM (

    -- ✅ INDIVIDUAL SALES (with invoice items)
    SELECT 
      s.id,
      s.total_amount AS amount,
      s.created_at,
      'sale' AS type,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', si.id,
            'book_id', si.book_id,
            'quantity', si.quantity,
            'price', si.price,
            'discount', si.discount,
            'title', b.title,
            'publisher', b.publisher,
            'edition', b.edition
          )
        )
        FROM sale_items si
        LEFT JOIN books b ON b.id = si.book_id
        WHERE si.sale_id = s.id
      ) AS items
    FROM sales s
    WHERE s.customer_id = ?

    UNION ALL

    SELECT 
      id,
      amount,
      created_at,
      'payment' AS type,
      NULL AS items
    FROM payments
    WHERE customer_id = ?

    UNION ALL

    SELECT 
      id,
      paid_amount AS amount,
      created_at,
      'sale_payment' AS type,
      NULL AS items
    FROM sales
    WHERE customer_id = ?
      AND paid_amount > 0

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
          SUM(CASE WHEN type IN ('payment','sale_payment','return') THEN amount ELSE 0 END) AS credit
        FROM (
          SELECT total_amount AS amount, 'sale' AS type FROM sales WHERE customer_id = ?
          UNION ALL
          SELECT amount, 'payment' FROM payments WHERE customer_id = ?
          UNION ALL
          SELECT paid_amount, 'sale_payment' FROM sales WHERE customer_id = ? AND paid_amount > 0
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

            let running = Number(customer.opening_balance || 0);
            const calculated = [];

            if (Math.abs(running) > 0.009) {
              calculated.push({
                id: 'opening',
                amount: running,
                type: 'opening',
                created_at: null,
                balance: Number(running.toFixed(2))
              });
            }

            for (const e of ledger) {
              const amt = Number(e.amount || 0);

              if (e.type === 'sale') {
                running += amt;
              } else if (
                e.type === 'payment' ||
                e.type === 'sale_payment' ||
                e.type === 'return'
              ) {
                running -= amt;
              }

              calculated.push({
                ...e,
                amount: amt,
                balance: Number(running.toFixed(2))
              });
            }

            const fullLedger = calculated.reverse();

            res.json({
              customer,
              ledger: fullLedger,
              totals: {
                debit: Number(totals.debit || 0),
                credit: Number(totals.credit || 0),
                net: Number(customer.balance || 0),
              },
              pagination: {
                page,
                limit,
                total: totalRecords,
                totalPages: Math.ceil(totalRecords / limit)
              },
              opening_balance: Number(customer.opening_balance || 0),
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

export const updateLedgerTransaction = (req, res) => {
  const { id } = req.params;
  const { type, amount, newAmount } = req.body;

  const updatedAmount = Number(
    newAmount ?? amount ?? 0
  );

  if (!type) {
    return res.status(400).json({ error: "Transaction type required" });
  }

  // ==========================================
  // PAYMENT UPDATE
  // ==========================================
  if (type === "payment") {
    db.query(
      "SELECT customer_id, amount FROM payments WHERE id = ?",
      [id],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Payment fetch failed" });
        }

        if (!rows.length) {
          return res.status(404).json({ error: "Payment not found" });
        }

        const payment = rows[0];
        const customerId = payment.customer_id;

        db.query(
          "UPDATE payments SET amount = ? WHERE id = ?",
          [updatedAmount, id],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: "Payment update failed" });
            }

            rebuildCustomerLedger(customerId)
              .then((newBalance) => {
                return res.json({
                  success: true,
                  message: "Payment updated successfully",
                  customer_balance: newBalance
                });
              })
              .catch((e) => {
                console.error(e);
                return res.status(500).json({ error: "Ledger rebuild failed" });
              });
          }
        );
      }
    );

    return;
  }

  // ==========================================
  // SALE UPDATE
  // ==========================================
  if (type === "sale") {

    const { items = [] } = req.body;
    const sanitizedItems = items
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        discount: Number(item.discount || 0),
        price: Number(item.price || item.current_price || 0),
        book_id: Number(item.book_id || 0),
      }))
      .filter((item) => item.book_id && item.quantity >= 0 && item.price >= 0);

    db.query(
      "SELECT customer_id, total_amount FROM sales WHERE id = ?",
      [id],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Sale fetch failed" });
        }

        if (!rows.length) {
          return res.status(404).json({ error: "Sale not found" });
        }

        const sale = rows[0];
        const oldAmount = Number(sale.total_amount || 0);

        // 🔥 prevent completely empty invoices
        const activeItems = sanitizedItems.filter(i => Number(i.quantity || 0) > 0);

        if (!activeItems.length) {
          return res.status(400).json({
            error: "Invoice must contain at least one item"
          });
        }

        if (!sanitizedItems.length) {
          return res.status(400).json({ error: "No valid invoice items provided" });
        }

        let completed = 0;
        let newTotal = 0;

        sanitizedItems.forEach((item) => {
          const qty = Number(item.quantity || 0);
          // 🔥 quantity 0 means remove item from invoice
          if (qty === 0) {

            db.query(
              `SELECT quantity
               FROM sale_items
               WHERE sale_id = ? AND book_id = ?
               LIMIT 1`,
              [id, item.book_id],
              (oldErr, oldRows) => {

                if (oldErr) {
                  console.error(oldErr);
                  return res.status(500).json({ error: "Old item fetch failed" });
                }

                const oldQty = Number(oldRows[0]?.quantity || 0);

                // restore stock
                db.query(
                  `UPDATE books
                   SET stock = stock + ?
                   WHERE id = ?`,
                  [oldQty, item.book_id],
                  (stockErr) => {

                    if (stockErr) {
                      console.error(stockErr);
                      return res.status(500).json({ error: "Stock restore failed" });
                    }

                    // delete invoice row
                    db.query(
                      `DELETE FROM sale_items
                       WHERE sale_id = ? AND book_id = ?`,
                      [id, item.book_id],
                      (deleteErr) => {

                        if (deleteErr) {
                          console.error(deleteErr);
                          return res.status(500).json({ error: "Invoice item delete failed" });
                        }

                        completed++;

                        if (completed === sanitizedItems.length) {
                          const diff = newTotal - oldAmount;

                              db.query(
                                "UPDATE sales SET total_amount = ? WHERE id = ?",
                                [newTotal, id],
                                (err3) => {
                                  if (err3) {
                                    console.error(err3);
                                    return res.status(500).json({ error: "Sale total update failed" });
                                  }

                                  rebuildCustomerLedger(sale.customer_id)
                                    .then(() => {
                                      return res.json({
                                        success: true,
                                        message: "Invoice updated successfully",
                                        total: newTotal
                                      });
                                    })
                                    .catch((e) => {
                                      console.error(e);
                                      return res.status(500).json({ error: "Ledger rebuild failed" });
                                    });
                                }
                              );
                        }
                      }
                    );
                  }
                );
              }
            );

            return;
          }
          const discount = Number(item.discount || 0);
          const price = Number(item.price || item.current_price || 0);

          const discounted = price * (1 - discount / 100);
          const finalTotal = discounted * qty;

          newTotal += finalTotal;

// 🔥 fetch previous quantity for stock adjustment
          db.query(
            `SELECT quantity
             FROM sale_items
             WHERE sale_id = ? AND book_id = ?
             LIMIT 1`,
            [id, item.book_id],
            (stockErr, stockRows) => {

              if (stockErr) {
                console.error(stockErr);
                return res.status(500).json({ error: "Stock lookup failed" });
              }

              const oldQty = Number(stockRows[0]?.quantity || 0);

              // positive = deduct more stock
              // negative = restore stock
              const diffQty = qty - oldQty;

              // 🔥 validate available stock first
              db.query(
                `SELECT stock
                 FROM books
                 WHERE id = ?
                 LIMIT 1`,
                [item.book_id],
                (stockCheckErr, stockCheckRows) => {

                  if (stockCheckErr) {
                    console.error(stockCheckErr);
                    return res.status(500).json({
                      error: "Stock validation failed"
                    });
                  }

                  const availableStock = Number(stockCheckRows[0]?.stock || 0);

                  // only validate when increasing quantity
                  if (diffQty > 0 && availableStock < diffQty) {
                    return res.status(400).json({
                      error: `Insufficient stock for item ${item.book_id}`
                    });
                  }

                  // 🔥 update inventory stock
                  db.query(
                    `UPDATE books
                     SET stock = stock - ?
                     WHERE id = ?`,
                    [diffQty, item.book_id],
                    (stockUpdateErr) => {

                      if (stockUpdateErr) {
                        console.error(stockUpdateErr);
                        return res.status(500).json({ error: "Stock update failed" });
                      }

                      // 🔥 continue updating invoice item
                      db.query(
                        `UPDATE sale_items si
                         JOIN sales s ON s.id = si.sale_id
                         SET
                           si.quantity = ?,
                           si.discount = ?,
                           si.final_price = ?,
                           si.price = ?
                         WHERE s.id = ? AND si.book_id = ?`,
                        [qty, discount, finalTotal, price, id, item.book_id],
                        (err2) => {
                          if (err2) {
                            console.error(err2);
                            return res.status(500).json({ error: "Sale item update failed" });
                          }

                          // 🔥 ALSO UPDATE CUSTOMER DISCOUNT TABLE
                          db.query(
                            `INSERT INTO customer_discounts (
                              customer_id,
                              book_id,
                              discount
                            )
                            VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                              discount = VALUES(discount)`,
                            [sale.customer_id, item.book_id, discount],
                            (discountErr) => {
                              if (discountErr) {
                                console.error("Customer discount update error:", discountErr);
                              }

                              completed++;

                              if (completed === sanitizedItems.length) {
                                const diff = newTotal - oldAmount;

                                db.query(
                                  "UPDATE sales SET total_amount = ? WHERE id = ?",
                                  [newTotal, id],
                                  (err3) => {
                                    if (err3) {
                                      console.error(err3);
                                      return res.status(500).json({ error: "Sale total update failed" });
                                    }

                                    rebuildCustomerLedger(sale.customer_id)
                                      .then(() => {
                                        return res.json({
                                          success: true,
                                          message: "Invoice updated successfully",
                                          total: newTotal
                                        });
                                      })
                                      .catch((e) => {
                                        console.error(e);
                                        return res.status(500).json({ error: "Ledger rebuild failed" });
                                      });
                                  }
                                );
                              }
                            }
                          );
                          return;
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      }
    );

    return;
  }

  // ==========================================
  // RETURN UPDATE
  // ==========================================
  if (type === "return") {
    db.query(
      "SELECT customer_id, amount FROM customer_returns WHERE id = ?",
      [id],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Return fetch failed" });
        }

        if (!rows.length) {
          return res.status(404).json({ error: "Return not found" });
        }

        const ret = rows[0];
        const oldAmount = Number(ret.amount || 0);
        const diff = updatedAmount - oldAmount;

        db.query(
          "UPDATE customer_returns SET amount = ? WHERE id = ?",
          [updatedAmount, id],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: "Return update failed" });
            }

            rebuildCustomerLedger(ret.customer_id)
              .then(() => {
                return res.json({
                  success: true,
                  message: "Return updated successfully"
                });
              })
              .catch((e) => {
                console.error(e);
                return res.status(500).json({ error: "Ledger rebuild failed" });
              });
          }
        );
      }
    );

    return;
  }

  return res.status(400).json({ error: "Unsupported transaction type" });
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

    // Rebuild customer ledger after payment insert
    rebuildCustomerLedger(customer_id)
      .then(() => {
        res.json({
          message: 'Payment added successfully'
        });
      })
      .catch((e) => {
        console.error(e);
        return res.status(500).json({ error: 'Ledger rebuild failed' });
      });
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
// 🔥 REQUIRED MYSQL INDEXES FOR SCALE
// CREATE INDEX idx_sales_customer ON sales(customer_id);
// CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
// CREATE INDEX idx_sale_items_book ON sale_items(book_id);
// CREATE INDEX idx_books_title ON books(title);
// CREATE INDEX idx_books_publisher ON books(publisher);
// CREATE INDEX idx_sales_created ON sales(created_at);

export const getCustomerSales = (req, res) => {
  const { id } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const search = (req.query.search || "").trim();

  const offset = (page - 1) * limit;

  let searchCondition = "";
  let searchParams = [];

  // 🔥 scalable SQL search
  if (search) {
    searchCondition = `
      AND (
        b.title LIKE ?
        OR b.publisher LIKE ?
        OR b.edition LIKE ?
      )
    `;

    const like = `%${search}%`;
    searchParams = [like, like, like];
  }

  // 🔥 paginated main query
  const sql = `
    SELECT 
      MIN(si.id) AS id,
      si.book_id,
      b.title AS book_name,
      b.publisher,
      b.edition AS edition,

      SUM(si.quantity) AS quantity,

      SUM(COALESCE(si.returned_quantity, 0)) AS returned_quantity,

      GREATEST(
        SUM(si.quantity) - SUM(COALESCE(si.returned_quantity, 0)),
        0
      ) AS remaining_quantity,

      COALESCE(AVG(si.price), 0) AS price,

      MAX(s.created_at) AS created_at,

      COALESCE(cbd.discount, 0) AS discount_percentage

    FROM sale_items si

    JOIN sales s
      ON s.id = si.sale_id

    LEFT JOIN books b
      ON si.book_id = b.id

    LEFT JOIN customer_discounts cbd 
      ON cbd.book_id = si.book_id 
      AND cbd.customer_id = s.customer_id

    WHERE s.customer_id = ?
    ${searchCondition}

    GROUP BY si.book_id

    ORDER BY MAX(s.created_at) DESC

    LIMIT ? OFFSET ?
  `;

  // 🔥 count query for pagination
  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT si.book_id
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN books b ON si.book_id = b.id
      WHERE s.customer_id = ?
      ${searchCondition}
      GROUP BY si.book_id
    ) x
  `;

  const mainParams = [
    id,
    ...searchParams,
    limit,
    offset,
  ];

  const countParams = [
    id,
    ...searchParams,
  ];

  db.query(countSql, countParams, (countErr, countRows) => {
    if (countErr) {
      console.error("Customer Sales Count Error:", countErr);
      return res.status(500).json({
        error: "Failed to count customer sales",
      });
    }

    const total = Number(countRows[0]?.total || 0);

    db.query(sql, mainParams, (err, result) => {
      if (err) {
        console.error("Customer Sales Fetch Error:", err);
        return res.status(500).json({
          error: "Failed to fetch customer sales",
        });
      }

      res.json({
        data: result,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + result.length < total,
        },
      });
    });
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

          const finishAndRebuild = () => {
            // After insert/update, always rebuild the ledger (await style)
            rebuildCustomerLedger(customer_id)
              .then(() => {
                // return customer_id in response for fallback customer info fetch
                return res.json({ 
                  message: "Return processed successfully",
                  customer_id
                });
              })
              .catch((e) => {
                console.error(e);
                return res.status(500).json({ error: "Ledger rebuild failed" });
              });
          };

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
              [totalReturnAmount, JSON.stringify(mergedItems), existing[0].id],
              finishAndRebuild
            );
          } else {
            // NOTE: (previous dues handled in frontend using customer.balance before update)
            db.query(
              `INSERT INTO customer_returns (customer_id, amount, items)
               VALUES (?, ?, ?)`,
              [customer_id, totalReturnAmount, JSON.stringify(returnItems)],
              finishAndRebuild
            );
          }
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
    "SELECT id, name, phone, city, address, balance, opening_balance FROM customers WHERE id = ?",
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

/* =========================
   ✏️ UPDATE CUSTOMER
========================= */
export const updateCustomer = (req, res) => {
  const { id } = req.params;
  let { name, phone, city, address } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Customer name is required",
    });
  }

  name = name.trim();
  phone = phone ? phone.trim() : null;
  city = city || null;
  address = address || null;

  const runUpdate = () => {
    db.query(
      `UPDATE customers
       SET
         name = ?,
         phone = ?,
         city = ?,
         address = ?
       WHERE id = ?`,
      [name, phone, city, address, id],
      (err) => {
        if (err) {
          console.error("Update Customer Error:", err);

          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Customer with this phone number already exists"
            });
          }

          return res.status(500).json({
            error: "Failed to update customer",
          });
        }

        db.query(
          `SELECT
             id,
             name,
             phone,
             city,
             address,
             balance,
             opening_balance
           FROM customers
           WHERE id = ?`,
          [id],
          (err2, rows) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({
                error: "Customer updated but fetch failed",
              });
            }

            res.json({
              success: true,
              customer: rows[0],
            });
          }
        );
      }
    );
  };

  if (!phone) {
    return runUpdate();
  }

  db.query(
    "SELECT id, name FROM customers WHERE phone = ? AND id <> ? LIMIT 1",
    [phone, id],
    (checkErr, existingRows) => {
      if (checkErr) {
        console.error(checkErr);
        return res.status(500).json({ error: "Customer validation failed" });
      }

      if (existingRows.length) {
        return res.status(409).json({
          message: `Customer already exists: ${existingRows[0].name}`
        });
      }

      runUpdate();
    }
  );
};

/* =========================
   🏙️ CITY SUMMARY REPORT
========================= */
export const getCitySummary = (req, res) => {
  const { city = "" } = req.query;

  if (!city.trim()) {
    return res.status(400).json({
      error: "City is required"
    });
  }

  const sql = `
    SELECT
      id,
      name,
      phone,
      city,
      balance
    FROM customers
    WHERE city LIKE ?
    ORDER BY name ASC
  `;

  db.query(sql, [`%${city}%`], (err, rows) => {
    if (err) {
      console.error("City Summary Error:", err);
      return res.status(500).json({
        error: "Failed to fetch city customers"
      });
    }

    const totalOutstanding = rows.reduce(
      (sum, c) => sum + Number(c.balance || 0),
      0
    );

    res.json({
      city,
      totalCustomers: rows.length,
      totalOutstanding,
      customers: rows
    });
  });
};