import db from "../config/db.js";
export const createSale = (req, res) => {
  let { customer_id, items, paid, paid_amount } = req.body;
  // ✅ FIX: normalize undefined to null
  if (customer_id === undefined) customer_id = null;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Invalid sale data" });
  }

  // 🔥 CALCULATE TOTAL
  let total = 0;

  items.forEach((i) => {
    const price = Number(i.current_price || i.printed_price) || 0;
    const qty = Number(i.quantity) || 0;
    const disc = Number(i.discount) || 0;

    const itemTotal = price * qty;
    const discountAmount = (itemTotal * disc) / 100;

    total += itemTotal - discountAmount;
  });

  // ⚠️ Do NOT calculate remaining here; handled after knowing customer type
  let remaining = 0;

  // 🔥 GET WALK-IN IF NEEDED
  const getCustomerId = (callback) => {
    if (customer_id) return callback(customer_id);

    db.query(
      "SELECT id FROM customers WHERE is_walkin = 1 LIMIT 1",
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Walk-in fetch failed" });
        }

        // ✅ If exists, use it
        if (result.length) {
          return callback(result[0].id);
        }

        // 🔥 PRODUCTION FIX: auto-create walk-in customer
        db.query(
          "INSERT INTO customers (name, is_walkin, city, balance) VALUES ('Walk-in', 1, 'POS', 0)",
          (err2, insertResult) => {
            if (err2) {
              return res.status(500).json({ error: "Walk-in creation failed" });
            }

            callback(insertResult.insertId);
          }
        );
      }
    );
  };

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: "Transaction failed" });
      }

    getCustomerId((finalCustomerId) => {
      const paidValue = Number(paid ?? paid_amount ?? 0);

      connection.query(
        "SELECT is_walkin FROM customers WHERE id = ?",
        [finalCustomerId],
        (err, customerRes) => {
          if (err || !customerRes.length) {
            return connection.rollback(() => {
              connection.release();
              return res.status(500).json({ error: "Customer check failed" });
            });
          }

          const isWalkIn = customerRes[0].is_walkin === 1;

          // ✅ Correct remaining calculation
          remaining = isWalkIn ? 0 : Math.max(total - paidValue, 0);

          proceedWithSale(finalCustomerId, isWalkIn);
        }
      );

      const proceedWithSale = (finalCustomerId, isWalkIn) => {

        // ✅ WALK-IN SALES SHOULD ALWAYS CREATE NEW INVOICE
        if (isWalkIn) {
          return connection.query(
            "INSERT INTO sales (customer_id, total_amount, paid_amount) VALUES (?, ?, ?)",
            [finalCustomerId, total, paidValue],
            (err, saleResult) => {

              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  return res.status(500).json({
                    error: "Walk-in sale failed"
                  });
                });
              }

              return continueSaleProcess(saleResult.insertId);
            }
          );
        }

        // ✅ ALWAYS CREATE NEW INVOICE
        // 🔥 FIND TODAY'S EXISTING CUSTOMER INVOICE
        connection.query(
          `SELECT id, total_amount, paid_amount
           FROM sales
           WHERE customer_id = ?
           AND DATE(created_at) = CURDATE()
           ORDER BY id DESC
           LIMIT 1`,
          [finalCustomerId],
          (findErr, existingSales) => {

            if (findErr) {
              return connection.rollback(() => {
                connection.release();
                return res.status(500).json({ error: "Sale lookup failed" });
              });
            }

            // ✅ MERGE INTO EXISTING DAILY INVOICE
            if (existingSales.length > 0) {
              const existingSale = existingSales[0];

              const updatedTotal =
                Number(existingSale.total_amount || 0) + total;

              const updatedPaid =
                Number(existingSale.paid_amount || 0) + paidValue;

              return connection.query(
                `UPDATE sales
                 SET
                   total_amount = ?,
                   paid_amount = ?
                 WHERE id = ?`,
                [updatedTotal, updatedPaid, existingSale.id],
                (updateErr) => {
                  if (updateErr) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Sale merge failed" });
                    });
                  }

                  continueSaleProcess(existingSale.id);
                }
              );
            }

            // ✅ CREATE NEW INVOICE IF NONE EXISTS TODAY
            connection.query(
              "INSERT INTO sales (customer_id, total_amount, paid_amount) VALUES (?, ?, ?)",
              [finalCustomerId, total, paidValue],
              (err, saleResult) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    return res.status(500).json({ error: "Sale failed" });
                  });
                }

                continueSaleProcess(saleResult.insertId);
              }
            );
          }
        );
        function continueSaleProcess(saleId) {

            // 2️⃣ INSERT OR MERGE ITEMS INTO SAME DAILY INVOICE
            const saveItems = (index = 0) => {
              if (index >= items.length) {
                return updateStock();
              }

              const item = items[index];

              const saleIdValue = Number(saleId);
              const bookId = Number(item.book_id);
              const qty = Number(item.quantity || 0);
              const price = Number(item.current_price || item.printed_price || 0);
              const discount = Number(item.discount || 0);

              // 🔥 CHECK IF BOOK ALREADY EXISTS IN THIS SALE
              connection.query(
                `SELECT id, quantity
                 FROM sale_items
                 WHERE sale_id = ?
                 AND book_id = ?
                 LIMIT 1`,
                [saleIdValue, bookId],
                (findErr, existingRows) => {
                  if (findErr) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Item lookup failed" });
                    });
                  }

                  // ✅ MERGE INTO EXISTING ROW
                  if (existingRows.length > 0) {
                    const existing = existingRows[0];

                    const newQty =
                      Number(existing.quantity || 0) + qty;

                    connection.query(
                      `UPDATE sale_items
                       SET
                         quantity = ?,
                         price = ?,
                         discount = ?
                       WHERE id = ?`,
                      [newQty, price, discount, existing.id],
                      (updateErr) => {
                        if (updateErr) {
                          return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ error: "Item merge failed" });
                          });
                        }

                        saveItems(index + 1);
                      }
                    );
                  }

                  // ✅ INSERT NEW ITEM
                  else {
                    connection.query(
                      `INSERT INTO sale_items
                       (sale_id, book_id, quantity, price, discount)
                       VALUES (?, ?, ?, ?, ?)`,
                      [saleIdValue, bookId, qty, price, discount],
                      (insertErr) => {
                        if (insertErr) {
                          return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ error: "Item insert failed" });
                          });
                        }

                        saveItems(index + 1);
                      }
                    );
                  }
                }
              );
            };

            saveItems();

            // 3️⃣ UPDATE STOCK
            const updateStock = (index = 0) => {
              if (index === items.length) return updateBalance();

              const item = items[index];

              // 🔒 LOCK STOCK ROW
               connection.query(
                `SELECT stock
                 FROM books
                 WHERE id = ?
                 FOR UPDATE`,
                [Number(item.book_id)],
                (stockErr, stockRows) => {

                  if (stockErr) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Stock lock failed" });
                    });
                  }

                  if (!stockRows.length) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(404).json({ error: "Book not found" });
                    });
                  }

                  const currentStock = Number(stockRows[0].stock || 0);
                  const requestedQty = Number(item.quantity || 0);

                  // ❌ Prevent overselling
                  if (currentStock < requestedQty) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(400).json({
                        error: `Insufficient stock for book ID ${item.book_id}`
                      });
                    });
                  }

                  // ✅ SAFE STOCK UPDATE
                  connection.query(
                    "UPDATE books SET stock = stock - ? WHERE id = ?",
                    [requestedQty, Number(item.book_id)],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          return res.status(500).json({ error: "Stock failed" });
                        });
                      }

                      updateStock(index + 1);
                    }
                  );
                }
              );
            };

            // 4️⃣ UPDATE CUSTOMER BALANCE (🔥 FIXED)
            const updateBalance = () => {

              // ✅ WALK-IN: DO NOT UPDATE BALANCE
              if (isWalkIn) {
                return connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Commit failed" });
                    });
                  }

                  connection.release();
                  return res.json({
                    message: "Sale completed",
                    sale_id: saleId,
                    total,
                    paid: paidValue,
                    remaining,
                    newBalance: 0,
                  });
                });
              }

              // 🔽 NORMAL CUSTOMER FLOW
              connection.query(
                "SELECT balance FROM customers WHERE id = ?",
                [finalCustomerId],
                (err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      return res.status(500).json({ error: "Balance fetch failed" });
                    });
                  }

                  const oldBalance = Number(result[0]?.balance) || 0;

                  const newBalance = oldBalance + total - paidValue;

                  connection.query(
                    "UPDATE customers SET balance = ? WHERE id = ?",
                    [newBalance, finalCustomerId],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          return res.status(500).json({ error: "Balance update failed" });
                        });
                      }

                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ error: "Commit failed" });
                          });
                        }

                        connection.release();
                        res.json({
                          message: "Sale completed",
                          sale_id: saleId,
                          total,
                          paid: paidValue,
                          remaining,
                          newBalance,
                        });
                      });
                    }
                  );
                }
              );
            };
        }
      };
    });
  });
});
};


// ✅ OUTSIDE FUNCTION (IMPORTANT)
export const getSales = (req, res) => {
  const { search = "", filter = "all", limit = 20 } = req.query;

  let condition = "WHERE 1=1";
  const params = [];

  // 🔍 SEARCH (customer name or sale id)
  if (search) {
    condition += " AND (customers.name LIKE ? OR sales.id LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  // 📅 DATE FILTER
  if (filter === "today") {
    condition += " AND DATE(sales.created_at) = CURDATE()";
  } else if (filter === "week") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (filter === "month") {
    condition += " AND MONTH(sales.created_at) = MONTH(NOW()) AND YEAR(sales.created_at) = YEAR(NOW())";
  } else if (filter === "3months") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)";
  } else if (filter === "6months") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)";
  } else if (filter === "year") {
    condition += " AND YEAR(sales.created_at) = YEAR(NOW())";
  }

  const sql = `
    SELECT 
      sales.*, 
      customers.name AS customer_name,
      customers.balance AS customer_balance,
      customers.is_walkin
    FROM sales
    LEFT JOIN customers 
      ON sales.customer_id = customers.id
    ${condition}
    ORDER BY sales.id DESC
    LIMIT ?
  `;

  db.query(sql, [...params, Number(limit)], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch sales" });
    }

    const formatted = result.map((s) => {
      const isWalkIn = s.is_walkin === 1;
      const paid = Number(s.paid_amount || 0);

      const remaining = isWalkIn
        ? 0
        : (Number(s.total_amount) - paid);

      return {
        ...s,
        received_amount: paid,
        remaining,
        previous_balance: isWalkIn
          ? 0
          : Math.max(Number(s.customer_balance || 0) - remaining, 0),
      };
    });

    res.json(formatted);
  });
};


export const getSaleById = (req, res) => {
  const { id } = req.params;

  const saleSql = `
    SELECT 
      s.*, 
      c.name AS customer_name,
      c.balance AS customer_balance,
      c.is_walkin
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `;

  const itemsSql = `
    SELECT si.*, b.title
    FROM sale_items si
    JOIN books b ON si.book_id = b.id
    WHERE si.sale_id = ?
  `;

  db.query(saleSql, [id], (err, saleResult) => {
    if (err) return res.status(500).json(err);
    db.query(itemsSql, [id], (err, itemsResult) => {
      if (err) return res.status(500).json(err);

      const s = saleResult[0];

      if (!s) {
        return res.status(404).json({ error: "Sale not found" });
      }
      
      const isWalkIn = s.is_walkin === 1;
      const paid = Number(s.paid_amount || 0);

      const remaining = isWalkIn
        ? 0
        : (Number(s.total_amount) - paid);

      const previousBalance = isWalkIn
        ? 0
        : Math.max(
            Number(s.customer_balance || 0) - remaining,
            0
          );

      res.json({
        sale: {
          ...s,
          received_amount: paid,
          remaining,
          previous_balance: previousBalance,
        },
        previous_balance: previousBalance,
        items: itemsResult,
      });
    });
  });
};

export const exportSales = (req, res) => {
  const { search = "", filter = "all" } = req.query;

  let condition = "WHERE 1=1";
  const params = [];

  // 🔍 SEARCH
  if (search) {
    condition += " AND (customers.name LIKE ? OR sales.id LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  // 📅 DATE FILTER
  if (filter === "today") {
    condition += " AND DATE(sales.created_at) = CURDATE()";
  } else if (filter === "week") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (filter === "month") {
    condition += " AND MONTH(sales.created_at) = MONTH(NOW()) AND YEAR(sales.created_at) = YEAR(NOW())";
  } else if (filter === "3months") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)";
  } else if (filter === "6months") {
    condition += " AND sales.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)";
  } else if (filter === "year") {
    condition += " AND YEAR(sales.created_at) = YEAR(NOW())";
  }

  const sql = `
    SELECT 
      sales.id,
      customers.name AS customer_name,
      sales.total_amount,
      sales.paid_amount,
      sales.created_at
    FROM sales
    LEFT JOIN customers ON sales.customer_id = customers.id
    ${condition}
    ORDER BY sales.id DESC
  `;

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Export failed" });
    }

    // 🔥 Create CSV (Excel-compatible)
    const header = "ID,Customer,Total,Paid,Date\n";

    const rows = result
      .map((s) =>
        `${s.id},"${s.customer_name}",${s.total_amount},${s.paid_amount},${s.created_at}`
      )
      .join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", "attachment; filename=sales.xlsx");

    res.send(csv);
  });
};