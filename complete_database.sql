-- Drop existing database if exists and create new one
DROP DATABASE IF EXISTS drugdatabase;
CREATE DATABASE drugdatabase;
USE drugdatabase;

-- Create customer table
CREATE TABLE customer (
  uid varchar(20) NOT NULL,
  pass varchar(20) DEFAULT NULL,
  fname varchar(15) DEFAULT NULL,
  lname varchar(15) DEFAULT NULL,
  email varchar(30) DEFAULT NULL,
  address varchar(128) DEFAULT NULL,
  phno bigint DEFAULT NULL,
  PRIMARY KEY (uid)
);

-- Create seller table
CREATE TABLE seller (
  sid varchar(15) NOT NULL,
  sname varchar(20) DEFAULT NULL,
  pass varchar(20) DEFAULT NULL,
  address varchar(128) DEFAULT NULL,
  phno bigint DEFAULT NULL,
  PRIMARY KEY (sid)
);

-- Create product table
CREATE TABLE product (
  pid varchar(15) NOT NULL,
  pname varchar(20) DEFAULT NULL,
  manufacturer varchar(20) DEFAULT NULL,
  mfg date DEFAULT NULL,
  exp date DEFAULT NULL,
  price int DEFAULT NULL,
  PRIMARY KEY (pid),
  UNIQUE KEY pname (pname)
);

-- Create inventory table
CREATE TABLE inventory (
  pid varchar(15) NOT NULL,
  pname varchar(20) DEFAULT NULL,
  quantity int unsigned DEFAULT NULL,
  sid varchar(15) NOT NULL,
  PRIMARY KEY (pid,sid),
  CONSTRAINT fk01 FOREIGN KEY (pid) REFERENCES product (pid) ON DELETE CASCADE,
  CONSTRAINT fk02 FOREIGN KEY (pname) REFERENCES product (pname) ON DELETE CASCADE,
  CONSTRAINT fk03 FOREIGN KEY (sid) REFERENCES seller (sid) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE orders (
 oid int NOT NULL AUTO_INCREMENT,
 pid varchar(15) DEFAULT NULL,
 sid varchar(15) DEFAULT NULL,
 uid varchar(15) DEFAULT NULL,
 orderdatetime datetime DEFAULT NULL,
 quantity int unsigned DEFAULT NULL,
 price int unsigned DEFAULT NULL,
 status varchar(20) DEFAULT NULL,
 PRIMARY KEY (oid),
 CONSTRAINT fk04 FOREIGN KEY (pid) REFERENCES product (pid) ON DELETE CASCADE,
 CONSTRAINT fk05 FOREIGN KEY (sid) REFERENCES seller (sid) ON DELETE CASCADE,
 CONSTRAINT fk06 FOREIGN KEY (uid) REFERENCES customer (uid) ON DELETE CASCADE
);

-- Set the auto increment start value for orders
ALTER TABLE orders AUTO_INCREMENT=1000;

-- Create trigger to update order datetime
DELIMITER //
CREATE TRIGGER updatetime 
BEFORE INSERT ON orders 
FOR EACH ROW
BEGIN
    SET NEW.orderdatetime = NOW();
END//
DELIMITER ;

-- Create trigger to update inventory after order
DELIMITER //
CREATE TRIGGER inventorytrigger 
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE qnty int;
    DECLARE productid varchar(20);

    SELECT pid INTO productid
    FROM orders
    ORDER BY oid DESC
    LIMIT 1;

    SELECT quantity INTO qnty 
    FROM orders
    ORDER BY oid DESC
    LIMIT 1;

    UPDATE inventory
    SET quantity = quantity - qnty
    WHERE pid = productid;
END//
DELIMITER ;

-- Create procedure to get seller orders
DELIMITER //
CREATE PROCEDURE getsellerorders(IN param1 VARCHAR(20))
BEGIN
    SELECT * FROM orders WHERE sid = param1;
END //
DELIMITER ;

-- Create procedure to get customer orders
DELIMITER //
CREATE PROCEDURE getorders(IN param1 VARCHAR(20))
BEGIN
    SELECT * FROM orders WHERE uid = param1;
END //
DELIMITER ;

-- Insert sample customers
INSERT INTO customer (uid, pass, fname, lname, email, address, phno) VALUES
('CUST001', 'pass123', 'John', 'Doe', 'john@email.com', '123 Main St', 9876543210),
('CUST002', 'pass123', 'Jane', 'Smith', 'jane@email.com', '456 Oak St', 9876543211);

-- Insert sample sellers
INSERT INTO seller (sid, sname, pass, address, phno) VALUES
('SELL001', 'City Pharmacy', 'pass123', '789 Market St', 9876543212),
('SELL002', 'Med Store', 'pass123', '321 Park Ave', 9876543213);

-- Insert sample products
INSERT INTO product (pid, pname, manufacturer, mfg, exp, price) VALUES
('P001', 'Paracetamol', 'GSK', '2024-01-01', '2026-01-01', 599),
('P002', 'Amoxicillin', 'Pfizer', '2024-01-01', '2026-01-01', 1299),
('P003', 'Aspirin', 'Bayer', '2024-01-01', '2026-01-01', 499),
('P004', 'Ibuprofen', 'J&J', '2024-01-01', '2026-01-01', 699),
('P005', 'Crocin', 'GSK', '2024-01-01', '2026-01-01', 299),
('P006', 'Dolo 650', 'Micro Labs', '2024-01-01', '2026-01-01', 399),
('P007', 'Azithromycin', 'Cipla', '2024-01-01', '2026-01-01', 1499),
('P008', 'Cetirizine', 'Sun Pharma', '2024-01-01', '2026-01-01', 399),
('P009', 'Omeprazole', 'AstraZeneca', '2024-01-01', '2026-01-01', 899),
('P010', 'Metformin', 'Novartis', '2024-01-01', '2026-01-01', 799),
('P011', 'Lisinopril', 'Lupin', '2024-01-01', '2026-01-01', 999),
('P012', 'Atorvastatin', 'Pfizer', '2024-01-01', '2026-01-01', 1299);

-- Insert inventory for all products with different stock levels
INSERT INTO inventory (pid, pname, quantity, sid) VALUES
-- Out of stock items
('P001', 'Paracetamol', 0, 'SELL001'),
('P005', 'Crocin', 0, 'SELL001'),
('P006', 'Dolo 650', 0, 'SELL001'),
-- Low stock items
('P002', 'Amoxicillin', 5, 'SELL001'),
('P007', 'Azithromycin', 5, 'SELL001'),
-- Normal stock items
('P003', 'Aspirin', 100, 'SELL001'),
('P004', 'Ibuprofen', 100, 'SELL001'),
('P008', 'Cetirizine', 100, 'SELL001'),
('P009', 'Omeprazole', 100, 'SELL001'),
('P010', 'Metformin', 100, 'SELL001'),
('P011', 'Lisinopril', 100, 'SELL001'),
('P012', 'Atorvastatin', 100, 'SELL001');

-- Add some items to second seller
INSERT INTO inventory (pid, pname, quantity, sid) VALUES
('P001', 'Paracetamol', 50, 'SELL002'),
('P002', 'Amoxicillin', 50, 'SELL002'),
('P003', 'Aspirin', 50, 'SELL002'); 