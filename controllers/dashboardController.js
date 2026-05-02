import db from "../config/db.js";
import util from "util";
const promiseDb = {
  query: util.promisify(db.query).bind(db)
};

export const getDashboardData = async (req, res) => {
    try {
      const { filter, lowStockLimit = 10, lowStockOffset = 0 } = req.query;
  
      let dateCondition = "1=1";
  
      if (filter === "Today") {
        dateCondition = "DATE(created_at) = CURDATE()";
      } else if (filter === "Last 7 Days") {
        dateCondition = "created_at >= CURDATE() - INTERVAL 7 DAY";
      } else if (filter === "This Month") {
        dateCondition = "MONTH(created_at) = MONTH(CURDATE())";
      }
  
      // CUSTOMERS
      const customers = await promiseDb.query(`
        SELECT COUNT(*) as totalCustomers FROM customers
      `);
  
      // TOP BOOKS
      const topBooks = await promiseDb.query(`
        SELECT b.title, b.publisher, SUM(si.quantity) as sold
        FROM sale_items si
        JOIN books b ON si.book_id = b.id
        GROUP BY si.book_id, b.title, b.publisher
        ORDER BY sold DESC
        LIMIT 10
      `);
  
      // LOW STOCK
      const lowStock = await promiseDb.query(`
        SELECT title, publisher, stock
        FROM books
        WHERE stock < 15
        ORDER BY stock ASC
        LIMIT ${Number(lowStockLimit)} OFFSET ${Number(lowStockOffset)}
      `);

      const lowStockCountResult = await promiseDb.query(`
        SELECT COUNT(*) as total FROM books WHERE stock < 15
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
          LIMIT 24
        `);
      } else {
        chart = await promiseDb.query(`
          SELECT DATE(created_at) as date, SUM(total_amount) as total
          FROM sales
          WHERE ${dateCondition}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 7
        `);
      }
  
      res.json({
        customers: customers[0],
        topBooks,
        lowStock,
        lowStockTotal: lowStockCountResult[0].total,
        chart,
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };