import db from "../config/db.js";

export const getDashboardReport = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => {
      if (!d) return null;
      return d; // use date directly to avoid timezone shift
    };

    const safeDate = formatDate(date);

    let dateCondition = "1=1";
    let params = [];

    if (filter === "Today") {
      dateCondition = `DATE(created_at) = ?`;
      params = [safeDate];
    }

    if (filter === "This Week") {
      dateCondition = `DATE(created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    if (filter === "This Month") {
      dateCondition = `DATE(created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    let effectiveDateCondition = dateCondition;

    let [sales] = await db.promise().query(`
      SELECT 
        COUNT(*) as ordersCount,
        SUM(total_amount) as totalSales,
        SUM(paid_amount) as totalReceived
      FROM sales
      WHERE ${effectiveDateCondition}
    `, params);


    const [payments] = await db.promise().query(`
      SELECT IFNULL(SUM(amount), 0) as totalPaid
      FROM supplier_payments sp
      WHERE ${effectiveDateCondition.replaceAll('created_at', 'sp.created_at')}
    `, params);

// 🔹 CUSTOMER RETURNS
const [customerReturnsRows] = await db.promise().query(`
  SELECT IFNULL(SUM(amount), 0) as totalCustomerReturns
  FROM customer_returns
  WHERE ${effectiveDateCondition.replaceAll('created_at', 'customer_returns.created_at')}
`, params);

// 🔹 SUPPLIER RETURNS (from purchases)
const [supplierReturnsRows] = await db.promise().query(`
  SELECT IFNULL(SUM(quantity * purchase_price), 0) as totalSupplierReturns
  FROM purchases
  WHERE type = 'return'
  AND ${effectiveDateCondition}
`, params);

const customerReturns = Number(customerReturnsRows[0]?.totalCustomerReturns || 0);
const supplierReturns = Number(supplierReturnsRows[0]?.totalSupplierReturns || 0);

    const [profitRows] = await db.promise().query(`
  SELECT 
    IFNULL(SUM(
      (si.price * si.quantity) - (p.purchase_price * si.quantity)
    ), 0) AS totalProfit
  FROM sale_items si
  LEFT JOIN (
    SELECT book_id, MAX(purchase_price) as purchase_price
    FROM purchases
    GROUP BY book_id
  ) p ON si.book_id = p.book_id
`);

const totalProfit = Number(profitRows[0]?.totalProfit || 0);

    // 🔹 TOTAL PAYABLE (ALL-TIME, ignore filters)
    const [payableRows] = await db.promise().query(`
      SELECT 
        IFNULL(SUM(
          CASE 
            WHEN p.type = 'purchase' THEN p.quantity * p.purchase_price
            WHEN p.type = 'return' THEN - (p.quantity * p.purchase_price)
            ELSE 0
          END
        ), 0)
        - IFNULL((
          SELECT SUM(amount) FROM supplier_payments
        ), 0) 
        AS totalPayable
      FROM purchases p
    `);

    const totalPayable = Number(payableRows[0]?.totalPayable || 0);

    // 🔹 TOTAL RECEIVABLE (ALL-TIME, ignore filters)
    const [receivable] = await db.promise().query(`
      SELECT IFNULL(SUM(total_amount - paid_amount), 0) as totalReceivable
      FROM sales
      WHERE (total_amount - paid_amount) > 0
    `);

    const [books] = await db.promise().query(`
      SELECT 
        SUM(purchase_price * stock) as stockValue,
        SUM(stock) as totalBooks,
        SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStockItems
      FROM books
    `);

    let chartDataQuery = "";

    if (filter === "Today") {
      chartDataQuery = `
        SELECT HOUR(created_at) as hour, SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY HOUR(created_at)
        ORDER BY hour
      `;
    }

    if (filter === "This Week") {
      chartDataQuery = `
        SELECT DAYNAME(created_at) as day, SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY DAYNAME(created_at)
        ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
      `;
    }

    if (filter === "This Month") {
      chartDataQuery = `
        SELECT DAY(created_at) as day, SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY DAY(created_at)
        ORDER BY day
      `;
    }

    const [chartRows] = chartDataQuery
      ? await db.promise().query(chartDataQuery, params)
      : [[]];

    const paymentFlow = {
      received: Number(sales[0].totalReceived || 0),
      paid: Number(payments[0].totalPaid || 0),
    };

    const netCashFlow = (sales[0].totalReceived || 0) - (payments[0].totalPaid || 0);

    res.json({
      ordersCount: sales[0].ordersCount || 0,
      totalSales: sales[0].totalSales || 0,
      totalReceived: sales[0].totalReceived || 0,
      totalReceivable: Number(receivable[0].totalReceivable || 0),
      totalPaid: Number(payments[0].totalPaid || 0),
      customerReturns,
      supplierReturns,
      totalPayable,
      profit: totalProfit,
      netCashFlow,
      totalBooks: Number(books[0].totalBooks || 0),
      stockValue: Number(books[0].stockValue || 0),
      lowStockItems: Number(books[0].lowStockItems || 0),
      hourlySales: chartRows.map(r => {
        // TODAY (hourly)
        if (filter === "Today") {
          return {
            hour: r.hour,
            total: Number(r.total || 0)
          };
        }

        // WEEK (day name)
        if (filter === "This Week") {
          return {
            day: r.day,
            total: Number(r.total || 0)
          };
        }

        // MONTH (day number)
        if (filter === "This Month") {
          return {
            day: r.day,
            total: Number(r.total || 0)
          };
        }

        return {
          total: Number(r.total || 0)
        };
      }),
      paymentFlow
    });

  } catch (error) {
    console.error("❌ REPORT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getSalesDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => d; // avoid UTC shift
    const safeDate = formatDate(date);

    let condition = "1=1";
    let params = [];

    if (filter === "Today") {
      condition = `DATE(s.created_at) = ?`;
      params = [safeDate];
    }

    if (filter === "This Week") {
      condition = `DATE(s.created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    if (filter === "This Month") {
      condition = `DATE(s.created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    const [rows] = await db.promise().query(`
      SELECT 
        s.id,
        c.name AS customer,
        s.total_amount,
        s.paid_amount,
        (s.total_amount - s.paid_amount) AS remaining,
        s.payment_method,
        s.created_at
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${condition}
      ORDER BY s.created_at DESC
    `, params);

    res.json(rows.map(r => ({
      id: r.id,
      customer: r.customer,
      total_amount: Number(r.total_amount),
      paid_amount: Number(r.paid_amount),
      remaining: Number(r.remaining),
      payment_method: r.payment_method,
      created_at: r.created_at
    })));

  } catch (error) {
    console.error("❌ SALES DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPaymentsDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => d; // avoid UTC shift
    const safeDate = formatDate(date);

    let condition = "1=1";
    let params = [];

    if (filter === "Today") {
      condition = `DATE(sp.created_at) = ?`;
      params = [safeDate];
    }

    if (filter === "This Week") {
      condition = `DATE(sp.created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    if (filter === "This Month") {
      condition = `DATE(sp.created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    const [rows] = await db.promise().query(`
      SELECT 
        sp.id,
        s.name AS supplier,
        sp.amount,
        sp.note,
        sp.created_at
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE ${condition}
      ORDER BY sp.created_at DESC
    `, params);

    res.json(rows.map(r => ({
      id: r.id,
      supplier: r.supplier,
      amount: Number(r.amount),
      note: r.note,
      created_at: r.created_at
    })));

  } catch (error) {
    console.error("❌ PAYMENTS DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getReceivableDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => d; // avoid UTC shift
    const safeDate = formatDate(date);

    let condition = "1=1";
    let params = [];

    if (filter === "Today") {
      condition = `DATE(s.created_at) = ?`;
      params = [safeDate];
    }

    if (filter === "This Week") {
      condition = `DATE(s.created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    if (filter === "This Month") {
      condition = `DATE(s.created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }

    const [rows] = await db.promise().query(`
      SELECT 
        c.name AS customer,
        SUM(s.total_amount - s.paid_amount) as balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${condition}
      GROUP BY c.name
      HAVING balance > 0
      ORDER BY balance DESC
    `, params);

    res.json(rows.map(r => ({
      customer: r.customer,
      balance: Number(r.balance)
    })));

  } catch (error) {
    console.error("❌ RECEIVABLE DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPayableDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => d;
    const safeDate = formatDate(date);

    // NOTE: Payable is ALL-TIME (no filter), but we keep filter structure for future use

    const [rows] = await db.promise().query(`
      SELECT 
        s.name AS supplier,
        IFNULL(SUM(
          CASE 
            WHEN p.type = 'purchase' THEN p.quantity * p.purchase_price
            WHEN p.type = 'return' THEN - (p.quantity * p.purchase_price)
            ELSE 0
          END
        ), 0)
        - IFNULL((
          SELECT SUM(sp.amount)
          FROM supplier_payments sp
          WHERE sp.supplier_id = p.supplier_id
        ), 0) AS balance
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      GROUP BY p.supplier_id
      HAVING balance > 0
      ORDER BY balance DESC
    `);

    res.json(rows.map(r => ({
      supplier: r.supplier,
      balance: Number(r.balance || 0)
    })));

  } catch (error) {
    console.error("❌ PAYABLE DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getInventoryDetails = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        title,
        publisher,
        category,
        edition,
        printed_price,
        purchase_price,
        current_price,
        stock,
        (stock * purchase_price) AS total_cost,
        (stock * current_price) AS total_retail,
        ((current_price - purchase_price) * stock) AS potential_profit
      FROM books
      ORDER BY stock DESC
    `);

    const data = rows.map(r => ({
      title: r.title,
      publisher: r.publisher,
      category: r.category,
      edition: r.edition,
      printed_price: Number(r.printed_price || 0),
      purchase_price: Number(r.purchase_price || 0),
      current_price: Number(r.current_price || 0),
      stock: Number(r.stock || 0),
      total_cost: Number(r.total_cost || 0),
      total_retail: Number(r.total_retail || 0),
      potential_profit: Number(r.potential_profit || 0)
    }));

    // Summary row
    const summary = {
      title: "TOTAL",
      publisher: "",
      category: "",
      edition: "",
      printed_price: 0,
      purchase_price: 0,
      current_price: 0,
      stock: data.reduce((sum, r) => sum + r.stock, 0),
      total_cost: data.reduce((sum, r) => sum + r.total_cost, 0),
      total_retail: data.reduce((sum, r) => sum + r.total_retail, 0),
      potential_profit: data.reduce((sum, r) => sum + r.potential_profit, 0)
    };

    res.json([...data, summary]);

  } catch (error) {
    console.error("❌ INVENTORY DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getLowStockDetails = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        title,
        publisher,
        edition,
        stock
      FROM books
      WHERE stock < 10
      ORDER BY stock ASC
    `);

    res.json(rows.map(r => ({
      title: r.title,
      publisher: r.publisher,
      edition: r.edition,
      stock: Number(r.stock || 0)
    })));

  } catch (error) {
    console.error("❌ LOW STOCK DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getProfitDetails = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
SELECT 
  b.title,
  b.publisher,
  b.edition,
  si.price AS selling_price,
  p.purchase_price,
  b.printed_price,
  SUM(si.quantity) AS total_sold,

  (si.price - p.purchase_price) AS profit_per_unit,

  CASE 
    WHEN p.purchase_price > 0 
    THEN ((si.price - p.purchase_price) / p.purchase_price) * 100
    ELSE 0
  END AS profit_percentage,

  SUM((si.price - p.purchase_price) * si.quantity) AS total_profit

FROM sale_items si
LEFT JOIN books b ON si.book_id = b.id
LEFT JOIN (
  SELECT book_id, MAX(purchase_price) AS purchase_price
  FROM purchases
  GROUP BY book_id
) p ON si.book_id = p.book_id

GROUP BY si.book_id, si.price, p.purchase_price
ORDER BY total_profit DESC;
    `);

    const data = rows.map(r => ({
      title: r.title,
      publisher: r.publisher,
      edition: r.edition,
      purchase_price: Number(r.purchase_price || 0),
      selling_price: Number(r.selling_price || 0),
      printed_price: Number(r.printed_price || 0),
      total_sold: Number(r.total_sold || 0),
      profit_per_unit: Number(r.profit_per_unit || 0),
      profit_percentage: Number(r.profit_percentage || 0).toFixed(2),
      total_profit: Number(r.total_profit || 0)
    }));

    const summary = {
      title: "TOTAL",
      publisher: "",
      edition: "",
      purchase_price: 0,
      selling_price: 0,
      printed_price: 0,
      total_sold: data.reduce((s, r) => s + r.total_sold, 0),
      profit_per_unit: 0,
      profit_percentage: "",
      total_profit: data.reduce((s, r) => s + r.total_profit, 0)
    };

    res.json([...data, summary]);

  } catch (error) {
    console.error("❌ PROFIT DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getCustomerReturnsDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;
    const safeDate = date;
    let condition = "1=1";
    let params = [];
    if (filter === "Today") {
      condition = `DATE(cr.created_at) = ?`;
      params = [safeDate];
    }
    if (filter === "This Week") {
      condition = `DATE(cr.created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }
    if (filter === "This Month") {
      condition = `DATE(cr.created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }
    const [rows] = await db.promise().query(`
      SELECT 
        cr.id,
        c.name AS customer,
        cr.amount,
        cr.items,
        cr.created_at
      FROM customer_returns cr
      LEFT JOIN customers c ON cr.customer_id = c.id
      WHERE ${condition}
      ORDER BY cr.created_at DESC
    `, params);

    let result = [];

    for (const r of rows) {
      let items = [];

      try {
        if (!r.items) {
          items = [];
        } else if (typeof r.items === "string") {
          items = JSON.parse(r.items);
        } else {
          items = r.items;
        }

        if (!Array.isArray(items)) {
          items = [items];
        }
      } catch (e) {
        console.error("❌ JSON parse error:", r.items);
        items = [];
      }

      if (items.length === 0) {
        result.push({
          return_id: r.id,
          customer: r.customer,
          title: "",
          publisher: "",
          edition: "",
          quantity: 0,
          purchase_price: 0,
          printed_price: 0,
          total_amount: Number(r.amount || 0),
          return_date: r.created_at
        });
      }

      for (const item of items) {
        const [bookRows] = await db.promise().query(`
          SELECT title, publisher, edition, printed_price, purchase_price
          FROM books
          WHERE id = ?
        `, [item.book_id]);
        
        const book = bookRows[0] || {};
        const qty = Number(item.quantity || item.qty || 0);
        const salePrice = Number(item.price || 0);
        
        result.push({
          return_id: r.id,
          customer: r.customer,
          title: book.title || item.book_name || "",
          publisher: book.publisher || item.publisher || "",
          edition: book.edition || item.edition || "",
          quantity: qty,
          purchase_price: Number(book.purchase_price || 0),
          printed_price: Number(book.printed_price || 0),
          total_amount: qty * salePrice,
          return_date: r.created_at
        });
      }
    }

    res.json(result);

  } catch (error) {
    console.error("❌ CUSTOMER RETURNS DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getSupplierReturnsDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;
    const safeDate = date;
    let condition = "1=1";
    let params = [];
    if (filter === "Today") {
      condition = `DATE(p.created_at) = ?`;
      params = [safeDate];
    }
    if (filter === "This Week") {
      condition = `DATE(p.created_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
      params = [safeDate, safeDate];
    }
    if (filter === "This Month") {
      condition = `DATE(p.created_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
      params = [safeDate, safeDate];
    }
    const [rows] = await db.promise().query(`
      SELECT 
  p.id,
  b.title,
  b.publisher,
  b.edition,
  s.name AS supplier,
  p.quantity,
  p.purchase_price,
  (p.quantity * p.purchase_price) AS total_amount,
  p.created_at AS return_date
FROM purchases p
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN books b ON p.book_id = b.id
WHERE p.type = 'return'
AND ${condition}
ORDER BY p.created_at DESC
    `, params);

    res.json(rows.map(r => ({
      id: r.id,
      supplier: r.supplier,
      quantity: Number(r.quantity || 0),
      purchase_price: Number(r.purchase_price || 0),
      total_amount: Number(r.total_amount || 0),
      created_at: r.created_at
    })));

  } catch (error) {
    console.error("❌ SUPPLIER RETURNS DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};