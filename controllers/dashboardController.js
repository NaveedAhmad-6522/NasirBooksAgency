import db from "../config/db.js";
import util from "util";
const promiseDb = {
  query: util.promisify(db.query).bind(db)
};

export const getDashboardData = async (req, res) => {
    try {
      const { filter } = req.query;
  
      let dateCondition = "1=1";
  
      if (filter === "Today") {
        dateCondition = "DATE(created_at) = CURDATE()";
      } else if (filter === "Last 7 Days") {
        dateCondition = "created_at >= CURDATE() - INTERVAL 7 DAY";
      } else if (filter === "This Month") {
        dateCondition = "MONTH(created_at) = MONTH(CURDATE())";
      }
  
      // SALES (CURRENT vs PREVIOUS PERIOD)
      let currentCondition = "1=1";
      let previousCondition = "1=1";

      if (filter === "Today") {
        currentCondition = "DATE(created_at) = CURDATE()";
        previousCondition = "DATE(created_at) = CURDATE() - INTERVAL 1 DAY";
      } else if (filter === "Last 7 Days") {
        currentCondition = "created_at >= CURDATE() - INTERVAL 7 DAY";
        previousCondition = `
          created_at >= CURDATE() - INTERVAL 14 DAY
          AND created_at < CURDATE() - INTERVAL 7 DAY
        `;
      } else if (filter === "This Month") {
        currentCondition = "MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())";
        previousCondition = "MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 MONTH)";
      }

      const currentSales = await promiseDb.query(`
        SELECT 
          IFNULL(SUM(total_amount),0) as totalSales,
          COUNT(*) as totalOrders
        FROM sales
        WHERE ${currentCondition}
      `);

      const previousSales = await promiseDb.query(`
        SELECT 
          IFNULL(SUM(total_amount),0) as previousSales,
          COUNT(*) as previousOrders
        FROM sales
        WHERE ${previousCondition}
      `);
  
      // CUSTOMERS
      const customers = await promiseDb.query(`
        SELECT COUNT(*) as totalCustomers FROM customers
      `);
  
      // RECEIVABLE (TOTAL outstanding - no filter)
      const receivable = await promiseDb.query(`
        SELECT IFNULL(SUM(balance), 0) AS receivable
        FROM customers
      `);
  
      // TOP BOOKS
      const topBooks = await promiseDb.query(`
        SELECT b.title, b.publisher, SUM(si.quantity) as sold
        FROM sale_items si
        JOIN books b ON si.book_id = b.id
        GROUP BY si.book_id, b.title, b.publisher
        ORDER BY sold DESC
        LIMIT 7
      `);
  
      // LOW STOCK
      const lowStock = await promiseDb.query(`
        SELECT title, publisher, stock
        FROM books
        WHERE stock < 10
        ORDER BY stock ASC
      `);
  
      // SALES CHART
      let chart = [];

      if (filter === "Today") {
        chart = await promiseDb.query(`
          SELECT 
            HOUR(created_at) as hour,
            SUM(total_amount) as total
          FROM sales
          WHERE DATE(created_at) = CURDATE()
          GROUP BY HOUR(created_at)
          ORDER BY hour
        `);
      } else {
        chart = await promiseDb.query(`
          SELECT DATE(created_at) as date, SUM(total_amount) as total
          FROM sales
          WHERE ${dateCondition}
          GROUP BY DATE(created_at)
          ORDER BY date
        `);
      }
  
      res.json({
        sales: {
          totalSales: currentSales[0].totalSales,
          totalOrders: currentSales[0].totalOrders,
          previousSales: previousSales[0].previousSales,
          previousOrders: previousSales[0].previousOrders,
        },
        customers: customers[0],
        receivable: receivable[0],
        topBooks,
        lowStock,
        chart,
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };