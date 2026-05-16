-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: book_system
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'fb52291e-05b9-11f0-9b44-72ea4185d9af:1-1517';

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `publisher` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `edition` varchar(50) DEFAULT NULL,
  `printed_price` decimal(10,2) NOT NULL,
  `current_price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `barcode` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `level` varchar(50) DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `idx_books_title` (`title`),
  KEY `idx_books_publisher` (`publisher`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'Bio','doger','Science','2025',1600.00,1600.00,63,NULL,1,'2026-05-03 21:58:45','FSC',700.00),(2,'BOM','KIPS','Science','2025',3423.00,3423.00,23,NULL,1,'2026-05-03 21:59:44','FSC',1540.35),(3,'phy','doger','Science','2025',1400.00,1400.00,142,NULL,1,'2026-05-11 14:19:42','BS',700.00),(4,'english','doger','Science','2026',1300.00,1300.00,11,NULL,1,'2026-05-11 14:20:38','Middle',650.00),(5,'biology 9th','shams','Science','2025',300.00,300.00,268,NULL,1,'2026-05-14 12:15:13','Matric',135.00),(6,'urdu 9th','shams','Arts','2025',300.00,300.00,290,NULL,1,'2026-05-14 12:25:37','Matric',135.00),(7,'english 9th','parus','sciance','2025',360.00,360.00,0,NULL,1,'2026-05-14 12:34:56','Matric',144.00);
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_book_discounts`
--

DROP TABLE IF EXISTS `customer_book_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_book_discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `book_id` int DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_customer_book` (`customer_id`,`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_book_discounts`
--

LOCK TABLES `customer_book_discounts` WRITE;
/*!40000 ALTER TABLE `customer_book_discounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_book_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_discounts`
--

DROP TABLE IF EXISTS `customer_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `book_id` int DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_customer_book` (`customer_id`,`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_discounts`
--

LOCK TABLES `customer_discounts` WRITE;
/*!40000 ALTER TABLE `customer_discounts` DISABLE KEYS */;
INSERT INTO `customer_discounts` VALUES (1,1,2,44.00),(3,1,1,33.00),(12,2,2,44.00),(14,2,1,23.00),(16,1,4,40.00),(18,2,3,49.00),(26,1,3,32.00),(28,1,6,45.00),(34,1,5,45.00),(131,1,7,50.00);
/*!40000 ALTER TABLE `customer_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_returns`
--

DROP TABLE IF EXISTS `customer_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `items` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_returns_customer_date` (`customer_id`,`created_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_returns`
--

LOCK TABLES `customer_returns` WRITE;
/*!40000 ALTER TABLE `customer_returns` DISABLE KEYS */;
INSERT INTO `customer_returns` VALUES (1,2,1916.88,'2026-05-04 10:28:37','[{\"price\": 1916.88, \"book_id\": 2, \"edition\": \"2025\", \"discount\": 44, \"quantity\": 1, \"book_name\": \"BOM\", \"publisher\": \"KIPS\", \"original_price\": 3423}]'),(2,1,1916.88,'2026-05-04 10:35:17','[{\"price\": 1916.88, \"book_id\": 2, \"edition\": \"2025\", \"discount\": 44, \"quantity\": 1, \"book_name\": \"BOM\", \"publisher\": \"KIPS\", \"original_price\": 3423}]'),(3,1,1072.00,'2026-05-05 12:46:14','[{\"price\": 1072, \"book_id\": 1, \"edition\": \"2025\", \"discount\": 33, \"quantity\": 1, \"book_name\": \"Bio\", \"publisher\": \"doger\", \"original_price\": 1600}]'),(4,1,780.00,'2026-05-11 14:29:38','[{\"price\": 780, \"book_id\": 4, \"edition\": \"2026\", \"discount\": 40, \"quantity\": 1, \"book_name\": \"english\", \"publisher\": \"doger\", \"original_price\": 1300}]'),(5,2,8958.00,'2026-05-12 19:37:24','[{\"price\": 714, \"book_id\": 3, \"edition\": \"2025\", \"discount\": 49, \"quantity\": 1, \"book_name\": \"phy\", \"publisher\": \"doger\", \"original_price\": 1400}, {\"price\": 714, \"book_id\": 3, \"edition\": \"2025\", \"discount\": 49, \"quantity\": 2, \"book_name\": \"phy\", \"publisher\": \"doger\", \"original_price\": 1400}, {\"price\": 1300, \"book_id\": 4, \"edition\": \"2026\", \"discount\": 0, \"quantity\": 1, \"book_name\": \"english\", \"publisher\": \"doger\", \"original_price\": 1300}, {\"price\": 714, \"book_id\": 3, \"edition\": \"2025\", \"discount\": 49, \"quantity\": 6, \"book_name\": \"phy\", \"publisher\": \"doger\", \"original_price\": 1400}, {\"price\": 1232, \"book_id\": 1, \"edition\": \"2025\", \"discount\": 23, \"quantity\": 1, \"book_name\": \"Bio\", \"publisher\": \"doger\", \"original_price\": 1600}]'),(6,1,14791.52,'2026-05-14 12:04:02','[{\"price\": 1916.88, \"book_id\": 2, \"edition\": \"2025\", \"discount\": 44, \"quantity\": 4, \"book_name\": \"BOM\", \"publisher\": \"KIPS\", \"original_price\": 3423}, {\"price\": 1072, \"book_id\": 1, \"edition\": \"2025\", \"discount\": 33, \"quantity\": 2, \"book_name\": \"Bio\", \"publisher\": \"doger\", \"original_price\": 1600}, {\"price\": 780, \"book_id\": 4, \"edition\": \"2026\", \"discount\": 40, \"quantity\": 1, \"book_name\": \"english\", \"publisher\": \"doger\", \"original_price\": 1300}, {\"price\": 1400, \"book_id\": 3, \"edition\": \"2025\", \"discount\": 0, \"quantity\": 3, \"book_name\": \"phy\", \"publisher\": \"doger\", \"original_price\": 1400}]'),(7,1,7020.00,'2026-05-14 18:29:31','[{\"price\": 780, \"book_id\": 4, \"edition\": \"2026\", \"discount\": 40, \"quantity\": 9, \"book_name\": \"english\", \"publisher\": \"doger\", \"original_price\": 1300}]');
/*!40000 ALTER TABLE `customer_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `city` varchar(100) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `is_walkin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_customers_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'jamal khan','03408056511',NULL,'2026-05-03 21:52:18','swat',21823.28,0),(2,'omar','04323454654',NULL,'2026-05-03 21:52:46','kohat',3968.00,0),(3,'Walk-in',NULL,NULL,'2026-05-03 22:09:40','POS',0.00,1),(4,'jamal khan','0344564365',NULL,'2026-05-14 12:51:07','chakdara',3242.00,0);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('cash','online') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sale_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payments_customer_date` (`customer_id`,`created_at` DESC),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,2,1234.00,NULL,'2026-05-14 12:41:45',NULL),(2,2,33.00,NULL,'2026-05-14 12:42:23',NULL),(3,1,13.00,NULL,'2026-05-14 18:24:29',NULL),(4,1,1224.00,NULL,'2026-05-14 18:24:58',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_history`
--

DROP TABLE IF EXISTS `price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int DEFAULT NULL,
  `old_price` decimal(10,2) DEFAULT NULL,
  `new_price` decimal(10,2) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_history`
--

LOCK TABLES `price_history` WRITE;
/*!40000 ALTER TABLE `price_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `quantity` int NOT NULL,
  `purchase_price` decimal(10,2) NOT NULL,
  `printed_price` decimal(10,2) DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('purchase','return') DEFAULT 'purchase',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `idx_purchases_book_date` (`book_id`,`created_at` DESC),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (1,1,1,65,700.00,1600.00,0.00,'2026-05-03 21:58:45','purchase',NULL),(2,2,2,45,1540.35,3423.00,0.00,'2026-05-03 21:59:44','purchase',NULL),(3,2,2,1,1541.35,3423.00,54.97,'2026-05-04 08:39:21','purchase',NULL),(4,2,2,8,1540.35,3423.00,0.00,'2026-05-04 10:29:22','return',''),(5,2,2,2,1540.35,3423.00,0.00,'2026-05-04 10:34:24','return','my marzi'),(6,2,2,1,1540.35,3423.00,0.00,'2026-05-04 10:34:56','return',''),(7,3,1,123,700.00,1400.00,0.00,'2026-05-11 14:19:42','purchase',NULL),(8,4,1,45,650.00,1300.00,0.00,'2026-05-11 14:20:38','purchase',NULL),(9,2,2,1,1540.35,3423.00,0.00,'2026-05-13 20:26:31','return',''),(10,2,2,1,1540.35,3423.00,0.00,'2026-05-13 20:26:54','return',''),(11,5,2,300,135.00,300.00,0.00,'2026-05-14 12:15:13','purchase',NULL),(12,6,2,300,135.00,300.00,0.00,'2026-05-14 12:25:37','purchase',NULL),(13,7,2,300,144.00,360.00,0.00,'2026-05-14 12:34:56','purchase',NULL);
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int DEFAULT NULL,
  `book_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `final_price` decimal(10,2) DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT NULL,
  `profit` decimal(10,2) DEFAULT NULL,
  `returned_quantity` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_sale_id` (`sale_id`),
  KEY `idx_sale_items_book_id` (`book_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,2,1,3423.00,NULL,NULL,44.00,NULL,1),(2,1,1,1,1600.00,NULL,NULL,23.00,NULL,1),(3,2,2,1,3423.00,NULL,NULL,44.00,NULL,1),(4,3,2,1,3423.00,NULL,NULL,30.00,NULL,0),(5,4,2,1,3423.00,NULL,NULL,0.00,NULL,0),(6,5,2,1,3423.00,NULL,NULL,0.00,NULL,0),(7,6,2,4,3423.00,NULL,NULL,44.00,NULL,4),(8,6,1,1,1600.00,NULL,NULL,33.00,NULL,1),(9,7,2,1,3423.00,NULL,NULL,44.00,NULL,0),(10,8,2,1,3423.00,NULL,NULL,44.00,NULL,0),(11,8,4,1,1300.00,NULL,NULL,40.00,NULL,1),(12,9,4,1,1300.00,NULL,NULL,40.00,NULL,1),(13,9,2,1,3423.00,NULL,NULL,44.00,NULL,0),(14,10,4,1,1300.00,NULL,NULL,0.00,NULL,0),(15,11,4,1,1300.00,NULL,NULL,40.00,NULL,1),(16,12,3,1,1400.00,NULL,NULL,0.00,NULL,0),(17,13,4,1,1300.00,NULL,NULL,0.00,NULL,0),(18,13,3,1,1400.00,NULL,NULL,0.00,NULL,0),(19,14,4,1,1300.00,NULL,NULL,0.00,NULL,1),(20,15,3,1,1400.00,NULL,714.00,49.00,NULL,9),(21,11,4,1,1300.00,NULL,NULL,40.00,NULL,1),(22,11,4,1,1300.00,NULL,NULL,40.00,NULL,1),(23,16,4,1,1300.00,NULL,NULL,40.00,NULL,1),(24,16,3,1,1400.00,NULL,NULL,0.00,NULL,1),(25,17,4,2,1300.00,NULL,NULL,40.00,NULL,2),(26,17,3,2,1400.00,NULL,NULL,0.00,NULL,2),(27,17,4,1,1300.00,NULL,NULL,40.00,NULL,1),(28,17,4,1,1300.00,NULL,NULL,40.00,NULL,1),(29,17,3,1,1400.00,NULL,NULL,0.00,NULL,0),(30,17,2,2,3423.00,NULL,NULL,44.00,NULL,0),(31,17,1,2,1600.00,NULL,NULL,33.00,NULL,2),(32,18,4,29,1300.00,NULL,22620.00,40.00,NULL,1),(33,18,3,3,1400.00,NULL,2856.00,32.00,NULL,0),(34,19,5,21,300.00,NULL,NULL,0.00,NULL,0),(35,19,4,1,1300.00,NULL,NULL,0.00,NULL,0),(36,19,3,1,1400.00,NULL,NULL,0.00,NULL,0),(37,19,2,1,3423.00,NULL,NULL,0.00,NULL,0),(38,19,1,1,1600.00,NULL,NULL,0.00,NULL,0),(41,19,7,295,360.00,NULL,NULL,0.00,NULL,0),(42,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(43,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(44,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(45,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(46,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(47,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(48,15,3,1,1400.00,NULL,714.00,49.00,NULL,0),(49,20,7,1,360.00,NULL,NULL,0.00,NULL,0),(50,21,7,4,360.00,NULL,NULL,50.00,NULL,0),(51,21,6,5,300.00,NULL,NULL,45.00,NULL,0),(52,21,5,7,300.00,NULL,NULL,45.00,NULL,0),(53,21,4,2,1300.00,NULL,NULL,40.00,NULL,0),(54,21,3,2,1400.00,NULL,NULL,32.00,NULL,0),(55,21,2,1,3423.00,NULL,NULL,44.00,NULL,0),(56,21,1,1,1600.00,NULL,NULL,33.00,NULL,0),(57,22,6,1,300.00,NULL,NULL,0.00,NULL,0),(58,20,6,1,300.00,NULL,NULL,0.00,NULL,0),(59,23,6,1,300.00,NULL,NULL,45.00,NULL,0),(60,24,6,1,300.00,NULL,NULL,0.00,NULL,0),(61,25,4,1,1300.00,NULL,NULL,0.00,NULL,0),(62,26,6,1,300.00,NULL,NULL,45.00,NULL,0),(63,27,5,4,300.00,NULL,660.00,45.00,NULL,0);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  `remaining_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('cash','online','credit') DEFAULT 'cash',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_customer_date` (`customer_id`,`created_at` DESC),
  KEY `idx_sales_created_at` (`created_at`),
  KEY `idx_sales_customer_id` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,2,3148.88,540.00,NULL,'cash','2026-05-03 22:05:47'),(2,1,1916.88,432.00,NULL,'cash','2026-05-03 22:07:23'),(3,3,2396.10,2396.10,NULL,'cash','2026-05-03 22:09:40'),(4,3,3423.00,3422.00,NULL,'cash','2026-05-03 22:11:28'),(5,3,3423.00,3423.00,NULL,'cash','2026-05-03 22:12:51'),(6,1,8739.52,12807.00,NULL,'cash','2026-05-04 18:27:56'),(7,1,1916.88,1900.00,NULL,'cash','2026-05-05 12:40:26'),(8,1,2696.88,1599.00,NULL,'cash','2026-05-11 14:22:42'),(9,1,2696.88,0.00,NULL,'cash','2026-05-11 14:23:29'),(10,3,1300.00,0.00,NULL,'cash','2026-05-12 15:14:56'),(11,1,2340.00,385.00,NULL,'cash','2026-05-12 15:17:27'),(12,3,1400.00,0.00,NULL,'cash','2026-05-12 15:17:36'),(13,3,2700.00,0.00,NULL,'cash','2026-05-12 15:19:27'),(14,2,1300.00,0.00,NULL,'cash','2026-05-12 17:22:16'),(15,2,4998.00,0.00,NULL,'cash','2026-05-12 17:22:34'),(16,1,2180.00,0.00,NULL,'cash','2026-05-12 19:57:35'),(17,1,13297.76,9000.00,NULL,'cash','2026-05-12 19:58:04'),(18,1,25476.00,1500.00,NULL,'cash','2026-05-14 10:19:06'),(19,3,113563.00,113563.00,NULL,'cash','2026-05-14 12:17:52'),(20,2,660.00,0.00,NULL,'cash','2026-05-14 18:31:29'),(21,1,9512.88,0.00,NULL,'cash','2026-05-14 18:46:00'),(22,3,300.00,298.00,NULL,'cash','2026-05-14 19:44:44'),(23,1,165.00,0.00,NULL,'cash','2026-05-14 19:56:52'),(24,3,300.00,0.00,NULL,'cash','2026-05-14 19:57:29'),(25,3,1300.00,0.00,NULL,'cash','2026-05-14 19:57:41'),(26,1,165.00,0.00,NULL,'cash','2026-05-14 20:05:55'),(27,1,660.00,0.00,NULL,'cash','2026-05-14 20:06:24');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_ledger`
--

DROP TABLE IF EXISTS `supplier_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int DEFAULT NULL,
  `type` enum('purchase','payment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_ledger_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_ledger`
--

LOCK TABLES `supplier_ledger` WRITE;
/*!40000 ALTER TABLE `supplier_ledger` DISABLE KEYS */;
INSERT INTO `supplier_ledger` VALUES (1,2,'payment',-45632.00,1,'2026-05-03 21:54:20'),(2,1,'payment',-23453.00,2,'2026-05-03 21:54:43'),(3,2,'payment',-43.00,3,'2026-05-03 21:55:02'),(4,2,'payment',500.00,4,'2026-05-11 14:33:15'),(5,1,'payment',120000.00,5,'2026-05-14 12:44:02');
/*!40000 ALTER TABLE `supplier_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
INSERT INTO `supplier_payments` VALUES (1,2,-45632.00,'opening','2026-05-03 21:54:20'),(2,1,-23453.00,'','2026-05-03 21:54:43'),(3,2,-43.00,'opening','2026-05-03 21:55:02'),(4,2,500.00,'pepsi','2026-05-11 14:33:15'),(5,1,120000.00,'naveed la me warkli','2026-05-14 12:44:02');
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suppliers_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Dogar Brothers','03408056511','islamabad',1,'2026-05-03 21:53:00'),(2,'haris','03324565765','peshawar sadar',1,'2026-05-03 21:53:30');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin') DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','1234','admin','2026-05-04 20:09:52');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15 14:56:48
