-- 001_initial_schema.sql

-- =========================
-- CORE TABLES
-- =========================

CREATE TABLE suppliers (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_suppliers_name (name)
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  city VARCHAR(100),
  balance DECIMAL(10,2) DEFAULT 0.00,
  is_walkin TINYINT DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB;

CREATE TABLE books (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  publisher VARCHAR(150),
  category VARCHAR(100),
  edition VARCHAR(50),
  printed_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  barcode VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(50),
  purchase_price DECIMAL(10,2),
  PRIMARY KEY (id),
  UNIQUE KEY barcode (barcode),
  KEY idx_books_title (title),
  KEY idx_books_publisher (publisher)
) ENGINE=InnoDB;

-- =========================
-- SALES
-- =========================

CREATE TABLE sales (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT,
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  payment_method ENUM('cash','online','credit') DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_customer_date (customer_id, created_at DESC),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sale_items (
  id INT NOT NULL AUTO_INCREMENT,
  sale_id INT,
  book_id INT,
  quantity INT,
  price DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  final_price DECIMAL(10,2),
  discount DECIMAL(5,2),
  profit DECIMAL(10,2),
  returned_quantity INT DEFAULT 0,
  PRIMARY KEY (id),
  KEY sale_id (sale_id),
  KEY book_id (book_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_sale_items_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT,
  amount DECIMAL(10,2),
  payment_method ENUM('cash','online'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sale_id INT,
  PRIMARY KEY (id),
  KEY idx_payments_customer_date (customer_id, created_at DESC),
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- =========================
-- PURCHASES / SUPPLIERS
-- =========================

CREATE TABLE purchases (
  id INT NOT NULL AUTO_INCREMENT,
  book_id INT NOT NULL,
  supplier_id INT NOT NULL,
  quantity INT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  printed_price DECIMAL(10,2),
  discount DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type ENUM('purchase','return') DEFAULT 'purchase',
  note TEXT,
  PRIMARY KEY (id),
  KEY supplier_id (supplier_id),
  KEY idx_purchases_book_date (book_id, created_at DESC),
  CONSTRAINT fk_purchases_book FOREIGN KEY (book_id)
    REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE supplier_ledger (
  id INT NOT NULL AUTO_INCREMENT,
  supplier_id INT,
  type ENUM('purchase','payment') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY supplier_id (supplier_id),
  CONSTRAINT fk_supplier_ledger FOREIGN KEY (supplier_id)
    REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE supplier_payments (
  id INT NOT NULL AUTO_INCREMENT,
  supplier_id INT,
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY supplier_id (supplier_id),
  CONSTRAINT fk_supplier_payments FOREIGN KEY (supplier_id)
    REFERENCES suppliers(id)
) ENGINE=InnoDB;

-- =========================
-- RETURNS / HISTORY
-- =========================

CREATE TABLE customer_returns (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  items JSON,
  PRIMARY KEY (id),
  KEY idx_returns_customer_date (customer_id, created_at DESC),
  CONSTRAINT fk_returns_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE price_history (
  id INT NOT NULL AUTO_INCREMENT,
  book_id INT,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY book_id (book_id),
  CONSTRAINT fk_price_history FOREIGN KEY (book_id)
    REFERENCES books(id)
) ENGINE=InnoDB;

-- =========================
-- DISCOUNTS
-- =========================

CREATE TABLE customer_discounts (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT,
  book_id INT,
  discount DECIMAL(5,2) DEFAULT 0.00,
  PRIMARY KEY (id),
  UNIQUE KEY unique_customer_book (customer_id, book_id)
) ENGINE=InnoDB;

CREATE TABLE customer_book_discounts (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT,
  book_id INT,
  discount DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_customer_book (customer_id, book_id)
) ENGINE=InnoDB;