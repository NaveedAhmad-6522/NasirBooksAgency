import db from "../config/db.js";

/* =========================
   ➕ ADD BOOK
========================= */
export const addBook = (req, res) => {
  let {
    title,
    publisher,
    category,
    edition,
    level,
    printed_price,
    current_price,
    purchase_price,
    stock,
    barcode,
    supplier_id,
    discount,
  } = req.body;

  // 🔥 CLEAN DATA
  title = title?.trim();
  publisher = publisher || "";
  category = category || "General";
  edition = edition || "";
  level = level && level.trim() !== "" ? level.trim() : null;
  printed_price = Number(printed_price) || 0;
  current_price = Number(current_price) || 0;
  purchase_price = Number(purchase_price) || 0;
  stock = Number(stock) || 0;
  barcode = barcode && barcode.trim() !== "" ? barcode : null;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (barcode) {
    return db.query(
      "SELECT id FROM books WHERE barcode = ?",
      [barcode],
      (err, existing) => {
        if (err) return res.status(500).json({ error: "Barcode check failed" });
        if (existing.length) {
          return res.status(400).json({ error: "Barcode already exists" });
        }

        // continue normal flow
        proceedAddBook();
      }
    );
  } else {
    proceedAddBook();
  }

  function proceedAddBook() {
    if (!supplier_id || purchase_price <= 0 || stock <= 0) {
      return res.status(400).json({ error: "Supplier, purchase price and quantity are required" });
    }

    // 🔒 CHECK SUPPLIER ACTIVE
    db.query("SELECT is_active FROM suppliers WHERE id = ?", [supplier_id], (err, result) => {
      if (err) return res.status(500).json({ error: "Supplier check failed" });

      if (!result.length || result[0].is_active === 0) {
        return res.status(400).json({ error: "Supplier is inactive" });
      }

      // continue transaction below
      db.beginTransaction((err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Transaction start failed" });
        }

        const insertBookSql = `
          INSERT INTO books 
          (title, publisher, category, edition, level, printed_price, current_price, purchase_price, stock, barcode)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertBookSql,
          [
            title,
            publisher,
            category,
            edition,
            level,
            printed_price,
            current_price,
            purchase_price,
            0,
            barcode,
          ],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                console.error("Insert Book Error:", err);
                res.status(500).json({ error: "Failed to add book" });
              });
            }

            const bookId = result.insertId;

            const insertPurchaseSql = `
              INSERT INTO purchases (book_id, supplier_id, quantity, purchase_price, printed_price, discount)
              VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
              insertPurchaseSql,
              [bookId, supplier_id, stock, purchase_price, printed_price, discount || 0],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error("Insert Purchase Error:", err);
                    res.status(500).json({ error: "Failed to add purchase" });
                  });
                }

                const updateStockSql = `
                  UPDATE books SET stock = stock + ? WHERE id = ?
                `;

                db.query(updateStockSql, [stock, bookId], (err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("Stock Update Error:", err);
                      res.status(500).json({ error: "Stock update failed" });
                    });
                  }

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error("Commit Error:", err);
                        res.status(500).json({ error: "Commit failed" });
                      });
                    }

                    res.json({ message: "Book and purchase created successfully" });
                  });
                });
              }
            );
          }
        );
      });
    });
  }
};

/* =========================
   📚 GET ALL BOOKS
========================= */
export const getBooks = (req, res) => {
  const { status = "active", page = 1, limit = 10, search = "" } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  let condition = "WHERE 1=1";
  const params = [];

  if (status === "active") condition += " AND b.is_active = 1";
  if (status === "hidden") condition += " AND b.is_active = 0";

  if (search) {
    condition += " AND (b.title LIKE ? OR b.category LIKE ? OR b.publisher LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const sql = `
    SELECT 
      b.id,
      b.title,
      b.publisher,

      IFNULL(b.category, 'General') AS category,
      IFNULL(b.edition, '') AS edition,

      CAST(b.printed_price AS DECIMAL(10,2)) AS printed_price,
      CAST(b.current_price AS DECIMAL(10,2)) AS current_price,
      CAST(IFNULL(b.purchase_price, 0) AS DECIMAL(10,2)) AS purchase_price,
      CAST(IFNULL(p.purchase_price, 0) AS DECIMAL(10,2)) AS last_purchase_price,

      CAST(b.stock AS SIGNED) AS stock,

      IFNULL(b.barcode, '') AS barcode,
      b.is_active,
      b.created_at,
      IFNULL(b.level, '') AS level,

      p.supplier_id,
      s.name AS supplier_name,
      p.discount AS percentage

    FROM books b

    LEFT JOIN purchases p ON p.id = (
      SELECT id FROM purchases
      WHERE book_id = b.id
      ORDER BY created_at DESC
      LIMIT 1
    )

    LEFT JOIN suppliers s ON p.supplier_id = s.id

    ${condition}

    ORDER BY b.id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [...params, limitNum, offset], (err, result) => {
    if (err) {
      console.error("Fetch Error:", err);
      return res.status(500).json({ error: "Failed to fetch books" });
    }

    res.json(result);
  });
};

/* =========================
   🔍 SEARCH BOOKS
========================= */
export const searchBooks = (req, res) => {
  const { q = "" } = req.query;

  const sql = `
    SELECT 
      id,
      title,
      publisher,

      IFNULL(category, 'General') AS category,
      IFNULL(edition, '') AS edition,

      CAST(printed_price AS DECIMAL(10,2)) AS printed_price,
      CAST(current_price AS DECIMAL(10,2)) AS current_price,
      CAST(IFNULL(purchase_price, 0) AS DECIMAL(10,2)) AS purchase_price,

      CAST(stock AS SIGNED) AS stock,

      IFNULL(barcode, '') AS barcode,
      is_active,
      created_at,
      IFNULL(level, '') AS level

    FROM books
    WHERE (title LIKE ? OR publisher LIKE ?) AND is_active = 1
    ORDER BY id DESC
    LIMIT 20
  `;

  db.query(sql, [`%${q}%`, `%${q}%`], (err, result) => {
    if (err) {
      console.error("Search Error:", err);
      return res.status(500).json({ error: "Search failed" });
    }

    res.json(result);
  });
};

/* =========================
   💰 UPDATE PRICE
========================= */
export const updatePrice = (req, res) => {
  const { id } = req.params;
  const { new_price } = req.body;

  const price = Number(new_price) || 0;

  db.query(
    "SELECT current_price FROM books WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Fetch failed" });
      }

      if (!result.length) {
        return res.status(404).json({ error: "Book not found" });
      }

      const old_price = Number(result[0].current_price);

      db.query(
        "UPDATE books SET current_price = ? WHERE id = ?",
        [price, id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Update failed" });
          }

          db.query(
            "INSERT INTO price_history (book_id, old_price, new_price) VALUES (?, ?, ?)",
            [id, old_price, price],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "History save failed" });
              }

              res.json({ message: "Price updated successfully" });
            }
          );
        }
      );
    }
  );
};

/* =========================
   🔁 TOGGLE BOOK STATUS
========================= */
export const toggleBookStatus = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT is_active FROM books WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Toggle Fetch Error:", err);
        return res.status(500).json({ error: "Failed to fetch book" });
      }

      if (!result.length) {
        return res.status(404).json({ error: "Book not found" });
      }

      const currentStatus = result[0].is_active;
      const newStatus = currentStatus ? 0 : 1;

      db.query(
        "UPDATE books SET is_active = ? WHERE id = ?",
        [newStatus, id],
        (err) => {
          if (err) {
            console.error("Toggle Update Error:", err);
            return res.status(500).json({ error: "Failed to update status" });
          }

          res.json({ message: "Status updated successfully", is_active: newStatus });
        }
      );
    }
  );
};

// =========================
//   📖 GET BOOK BY ID
// =========================
export const getBookById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      b.*, 
      p.supplier_id,
      p.purchase_price,
      p.discount AS percentage
    FROM books b
    LEFT JOIN purchases p ON p.book_id = b.id
    WHERE b.id = ?
    ORDER BY p.created_at DESC
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("GET BOOK BY ID ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch book" });
    }

    if (!result.length) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(result[0]);
  });
};

export const restockBook = (req, res) => {
  const { id } = req.params;

  let { supplier_id, quantity, purchase_price, percentage, printed_price } = req.body;

  quantity = Number(quantity) || 0;
  purchase_price = Number(purchase_price) || 0;
  percentage = Number(percentage) || 0;

  if (!supplier_id || quantity <= 0 || purchase_price <= 0) {
    return res.status(400).json({
      error: "Supplier, quantity and purchase price are required",
    });
  }
 
  // 🔒 CHECK SUPPLIER ACTIVE
  db.query("SELECT is_active FROM suppliers WHERE id = ?", [supplier_id], (err2, supResult) => {
    if (err2) return res.status(500).json({ error: "Supplier check failed" });

    if (!supResult.length || supResult[0].is_active === 0) {
      return res.status(400).json({ error: "Supplier is inactive" });
    }

    // continue existing logic below
    db.query("SELECT is_active FROM books WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: "Fetch failed" });

      if (!result.length) return res.status(404).json({ error: "Book not found" });

      if (!result[0].is_active) {
        return res.status(400).json({ error: "Cannot restock inactive book" });
      }

      db.beginTransaction((err) => {
        if (err) {
          return res.status(500).json({ error: "Transaction start failed" });
        }

        // 1️⃣ Insert purchase
        const purchaseSql = `
          INSERT INTO purchases (book_id, supplier_id, quantity, purchase_price, printed_price, discount)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
          purchaseSql,
          [id, supplier_id, quantity, purchase_price, printed_price || null, percentage || 0],
          (err) => {
            if (err) {
              return db.rollback(() => {
                console.error(err);
                res.status(500).json({ error: "Failed to insert purchase" });
              });
            }

            // 2️⃣ Update stock
            const stockSql = `
              UPDATE books SET stock = stock + ? WHERE id = ?
            `;

            db.query(stockSql, [quantity, id], (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error(err);
                  res.status(500).json({ error: "Stock update failed" });
                });
              }

              // 🔥 OPTIONAL: update printed price if provided
              if (printed_price && Number(printed_price) > 0) {
                const updatePriceSql = `
                  UPDATE books SET printed_price = ?, current_price = ? WHERE id = ?
                `;

                return db.query(updatePriceSql, [Number(printed_price), Number(printed_price), id], (err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error(err);
                      res.status(500).json({ error: "Printed price update failed" });
                    });
                  }

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).json({ error: "Commit failed" });
                      });
                    }

                    res.json({ message: "Stock restocked & price updated" });
                  });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: "Commit failed" });
                  });
                }

                res.json({ message: "Stock restocked successfully" });
              });
            });
          }
        );
      });
    });
  });
};

//update book
export const updateBook = async (req, res) => {
  const { id } = req.params;

  const {
    title,
    publisher,
    category,
    edition,
    printed_price,
    purchase_price,
    stock,
    level,
  } = req.body;
  console.log("UPDATE BOOK LEVEL:", level);

  try {
    const connection = db.promise();

    // Check if book exists
    const [existing] = await connection.query(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    // 🔥 Save price history
    const oldPrinted = existing[0].printed_price;

    if (Number(printed_price) !== Number(oldPrinted)) {
      await connection.query(
        "INSERT INTO price_history (book_id, old_price, new_price) VALUES (?, ?, ?)",
        [id, oldPrinted, Number(printed_price)]
      );
    }

    // Update book
    await connection.query(
      `UPDATE books SET 
        title = ?,
        publisher = ?,
        category = ?,
        edition = ?,
        printed_price = ?,
        current_price = ?,
        stock = ?,
        level = ?
      WHERE id = ?`,
      [
        title,
        publisher,
        category,
        edition,
        Number(printed_price),
        Number(printed_price),
        stock ? Number(stock) : 0,
        level && level.trim() !== "" ? level.trim() : null,
        id,
      ]
    );

    // Fetch latest purchase for this book
    const [purchase] = await connection.query(
      `SELECT supplier_id, purchase_price, discount AS percentage
       FROM purchases
       WHERE book_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );

    res.json({
      message: "Book updated successfully",
      purchase: purchase[0] || null
    });

  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};