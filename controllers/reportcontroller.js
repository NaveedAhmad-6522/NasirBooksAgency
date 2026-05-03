import db from "../config/db.js";

export const getDashboardReport = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    // Ensure date is in YYYY-MM-DD format
    const formatDate = (d) => {
      const dt = new Date(d);
      return dt.toISOString().split("T")[0];
    };

    const safeDate = formatDate(date);

    let dateCondition = "";
    const params = [safeDate];

    if (filter === "Today") {
      dateCondition = `DATE(created_at) = ?`;
    }

    if (filter === "This Week") {
      // TODO: secure this with prepared statements
      dateCondition = `YEARWEEK(created_at, 1) = YEARWEEK('${safeDate}', 1)`;
    }

    if (filter === "This Month") {
      // TODO: secure this with prepared statements
      dateCondition = `
        MONTH(created_at) = MONTH('${safeDate}') 
        AND YEAR(created_at) = YEAR('${safeDate}')
      `;
    }

    let effectiveDateCondition = dateCondition;

    // 🔹 SALES (FIXED)
    let [sales] = await db.promise().query(`
      SELECT 
        COUNT(*) as ordersCount,
        SUM(total_amount) as totalSales,
        SUM(paid_amount) as totalReceived
      FROM sales
      WHERE ${effectiveDateCondition}
    `, params);

    // Fallback for Today if no data on selected date → use latest available date
    if (filter === "Today" && (!sales[0].ordersCount || sales[0].ordersCount === 0)) {
      const [latest] = await db.promise().query(`
        SELECT DATE(MAX(created_at)) as latestDate FROM sales
      `);
      const latestDate = formatDate(latest[0].latestDate);

      if (latestDate) {
        effectiveDateCondition = `DATE(created_at) = ?`;
        params[0] = latestDate;

        [sales] = await db.promise().query(`
          SELECT 
            COUNT(*) as ordersCount,
            SUM(total_amount) as totalSales,
            SUM(paid_amount) as totalReceived
          FROM sales
          WHERE ${effectiveDateCondition}
        `, params);
      }
    }

    // 🔹 PURCHASES (keep as is for now)
    const [payments] = await db.promise().query(`
      SELECT 
        IFNULL(SUM(amount), 0) as totalPaid
      FROM supplier_payments
      WHERE ${effectiveDateCondition}
    `, params);

    // 🔹 CUSTOMER RECEIVABLE (correct source and filter aware)
    const [receivable] = await db.promise().query(`
      SELECT IFNULL(SUM(remaining_amount), 0) as totalReceivable
      FROM sales
      WHERE ${effectiveDateCondition}
    `, params);

    // 🔹 BOOKS
    const [books] = await db.promise().query(`
      SELECT 
        SUM(purchase_price * stock) as stockValue,
        SUM(stock) as totalBooks,
        SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStockItems
      FROM books
    `);

    // 🔹 HOURLY SALES (for chart)
    let chartDataQuery = "";

    if (filter === "Today") {
      chartDataQuery = `
        SELECT 
          HOUR(created_at) as hour,
          SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY HOUR(created_at)
        ORDER BY hour
      `;
    }

    if (filter === "This Week") {
      chartDataQuery = `
        SELECT 
          DAYNAME(created_at) as day,
          SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY day
        ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
      `;
    }

    if (filter === "This Month") {
      chartDataQuery = `
        SELECT 
          DAY(created_at) as day,
          SUM(total_amount) as total
        FROM sales
        WHERE ${effectiveDateCondition}
        GROUP BY DAY(created_at)
        ORDER BY day
      `;
    }

    const [chartRows] = await db.promise().query(chartDataQuery, params);

    // 🔹 PAYMENT FLOW (for chart)
    const paymentFlow = {
      received: Number(sales[0].totalReceived || 0),
      paid: Number(payments[0].totalPaid || 0),
    };

    const netCashFlow =
      (sales[0].totalReceived || 0) -
      (payments[0].totalPaid || 0);

    const [profitData] = await db.promise().query(`
      SELECT 
        SUM((b.current_price - b.purchase_price) * p.quantity) as profit
      FROM purchases p
      JOIN books b ON p.book_id = b.id
    `);

    const profit = Number(profitData[0].profit || 0);

    res.json({
      ordersCount: sales[0].ordersCount || 0,
      totalSales: sales[0].totalSales || 0,
      totalReceived: sales[0].totalReceived || 0,
      totalReceivable: Number(receivable[0].totalReceivable || 0),
      totalPaid: Number(payments[0].totalPaid || 0),
      netCashFlow,
      profit: Number(profit || 0),
      totalBooks: Number(books[0].totalBooks || 0),
      stockValue: Number(books[0].stockValue || 0),
      lowStockItems: Number(books[0].lowStockItems || 0),
      hourlySales: chartRows.map(r => ({
        hour: r.hour ?? null,
        day: r.day ?? null,
        date: r.day ?? null,
        week: r.week ?? null,
        total: Number(r.total || 0)
      })),
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

    const formatDate = (d) => {
      const dt = new Date(d);
      return dt.toISOString().split("T")[0];
    };

    const safeDate = formatDate(date);

    let condition = "1=1";

    if (filter === "Today") {
      condition += ` AND DATE(s.created_at) = '${safeDate}'`;
    }

    if (filter === "This Week") {
      condition += ` AND YEARWEEK(s.created_at, 1) = YEARWEEK('${safeDate}', 1)`;
    }

    if (filter === "This Month") {
      condition += ` AND MONTH(s.created_at) = MONTH('${safeDate}') AND YEAR(s.created_at) = YEAR('${safeDate}')`;
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
    `);

    const formatted = rows.map(r => ({
      id: r.id,
      customer: r.customer,
      total_amount: Number(r.total_amount),
      paid_amount: Number(r.paid_amount),
      remaining: Number(r.remaining),
      payment_method: r.payment_method,
      created_at: r.created_at
    }));

    res.json(formatted);

  } catch (error) {
    console.error("❌ SALES DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPaymentsDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => {
      const dt = new Date(d);
      return dt.toISOString().split("T")[0];
    };

    const safeDate = formatDate(date);

    let condition = "1=1";

    if (filter === "Today") {
      condition += ` AND DATE(sp.created_at) = '${safeDate}'`;
    }

    if (filter === "This Week") {
      condition += ` AND YEARWEEK(sp.created_at, 1) = YEARWEEK('${safeDate}', 1)`;
    }

    if (filter === "This Month") {
      condition += ` AND MONTH(sp.created_at) = MONTH('${safeDate}') AND YEAR(sp.created_at) = YEAR('${safeDate}')`;
    }

    const [rows] = await db.promise().query(`
      SELECT 
        sp.id,
        s.name AS supplier,
        ROUND(sp.amount, 2) AS amount,
        sp.note,
        sp.created_at
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE ${condition}
      ORDER BY sp.created_at DESC
    `);

    const formatted = rows.map(r => ({
      id: r.id,
      supplier: r.supplier,
      amount: Number(r.amount),
      note: r.note,
      created_at: r.created_at
    }));

    res.json(formatted);

  } catch (error) {
    console.error("❌ PAYMENTS DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getReceivableDetails = async (req, res) => {
  try {
    const { filter = "Today", date } = req.query;

    const formatDate = (d) => {
      const dt = new Date(d);
      return dt.toISOString().split("T")[0];
    };

    const safeDate = formatDate(date);

    let condition = "1=1";

    if (filter === "Today") {
      condition += ` AND DATE(created_at) = '${safeDate}'`;
    }

    if (filter === "This Week") {
      condition += ` AND YEARWEEK(created_at, 1) = YEARWEEK('${safeDate}', 1)`;
    }

    if (filter === "This Month") {
      condition += ` AND MONTH(created_at) = MONTH('${safeDate}') AND YEAR(created_at) = YEAR('${safeDate}')`;
    }

    const [rows] = await db.promise().query(`
      SELECT 
        c.name AS customer,
        SUM(s.remaining_amount) as balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${condition}
      GROUP BY c.name
      HAVING balance > 0
      ORDER BY balance DESC
    `);

    const formatted = rows.map(r => ({
      customer: r.customer,
      balance: Number(r.balance)
    }));

    res.json(formatted);

  } catch (error) {
    console.error("❌ RECEIVABLE DETAILS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};