-- Drop existing database and tables
DROP DATABASE IF EXISTS drugdatabase;

CREATE SCHEMA drugdatabase;

USE drugdatabase;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS seller_stats;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS seller;
DROP TABLE IF EXISTS customer;

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

CREATE TABLE seller (
  sid varchar(15) NOT NULL,
  sname varchar(20) DEFAULT NULL,
  pass varchar(20) DEFAULT NULL,
  address varchar(128) DEFAULT NULL,
  phno bigint DEFAULT NULL,
  PRIMARY KEY (sid)
);

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

CREATE TABLE orders (
  oid int NOT NULL AUTO_INCREMENT,
  pid varchar(15) DEFAULT NULL,
  sid varchar(15) DEFAULT NULL,
  uid varchar(15) DEFAULT NULL,
  orderdatetime datetime DEFAULT NULL,
  quantity int unsigned DEFAULT NULL,
  price int unsigned DEFAULT NULL,
  status varchar(20) DEFAULT NULL,
  payment_status varchar(20) DEFAULT NULL,
  payment_method varchar(20) DEFAULT NULL,
  card_last_four varchar(4) DEFAULT NULL,
  payment_date datetime DEFAULT NULL,
  PRIMARY KEY (oid),
  CONSTRAINT fk04 FOREIGN KEY (pid) REFERENCES product (pid) ON DELETE CASCADE,
  CONSTRAINT fk05 FOREIGN KEY (sid) REFERENCES seller (sid) ON DELETE CASCADE,
  CONSTRAINT fk06 FOREIGN KEY (uid) REFERENCES customer (uid) ON DELETE CASCADE
);

-- Create seller_stats table for revenue tracking
CREATE TABLE seller_stats (
  sid varchar(15) NOT NULL,
  total_revenue decimal(10,2) DEFAULT 0.00,
  total_orders int DEFAULT 0,
  PRIMARY KEY (sid),
  CONSTRAINT fk_seller_stats FOREIGN KEY (sid) REFERENCES seller (sid) ON DELETE CASCADE
);

-- Set the auto increment start value for orders
ALTER TABLE orders AUTO_INCREMENT=1000;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS updatetime;
DROP TRIGGER IF EXISTS inventorytrigger;
DROP TRIGGER IF EXISTS update_seller_stats;

-- Create trigger to update order datetime
DELIMITER //
CREATE TRIGGER updatetime 
BEFORE INSERT ON orders 
FOR EACH ROW
BEGIN
    SET NEW.orderdatetime = NOW();
END//

-- Create trigger to update inventory after order
DELIMITER //
CREATE TRIGGER inventorytrigger 
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    -- Update inventory directly using NEW values from the trigger
    UPDATE inventory
    SET quantity = quantity - NEW.quantity
    WHERE pid = NEW.pid AND sid = NEW.sid;
END//

-- Create trigger to update seller stats after payment
DELIMITER //
CREATE TRIGGER update_seller_stats
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        UPDATE seller_stats 
        SET total_revenue = total_revenue + NEW.price,
            total_orders = total_orders + 1
        WHERE sid = NEW.sid;
    END IF;
END//

DELIMITER ;

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS getsellerorders;
DROP PROCEDURE IF EXISTS getorders;

-- Create stored procedures
DELIMITER //
CREATE PROCEDURE getsellerorders(IN param1 VARCHAR(20))
BEGIN
    SELECT * FROM orders WHERE sid = param1;
END //

DELIMITER //
CREATE PROCEDURE getorders(IN param1 VARCHAR(20))
BEGIN
    SELECT * FROM orders WHERE uid = param1;
END //

DELIMITER ;

-- Insert sample data
INSERT INTO customer (uid, pass, fname, lname, email, address, phno) VALUES
('CUST001', 'pass123', 'John', 'Doe', 'john@email.com', '123 Main St', 9876543210),
('CUST002', 'pass123', 'Jane', 'Smith', 'jane@email.com', '456 Oak St', 9876543211);

INSERT INTO seller (sid, sname, pass, address, phno) VALUES
('SELL001', 'MedStore', 'pass123', '789 Market St', 9876543212),
('SELL002', 'PharmaCare', 'pass123', '321 Pine St', 9876543213);

INSERT INTO product (pid, pname, manufacturer, mfg, exp, price) VALUES
('P001', 'Paracetamol', 'GSK', '2024-01-01', '2026-01-01', 599),
('P002', 'Amoxicillin', 'Pfizer', '2024-01-01', '2026-01-01', 1299),
('P003', 'Aspirin', 'Bayer', '2024-01-01', '2026-01-01', 499),
('P004', 'Ibuprofen', 'J&J', '2024-01-01', '2026-01-01', 699),
('P005', 'Crocin', 'GSK', '2024-01-01', '2026-01-01', 299),
('P006', 'Dolo 650', 'Micro Labs', '2024-01-01', '2026-01-01', 399);

-- Initialize inventory for sellers
INSERT INTO inventory (pid, pname, quantity, sid)
SELECT p.pid, p.pname, 
    CASE 
        WHEN p.pid IN ('P001', 'P005') THEN 5  -- Low stock
        ELSE 100  -- Normal stock
    END as quantity,
    s.sid
FROM product p
CROSS JOIN seller s;

-- Initialize seller stats
INSERT INTO seller_stats (sid, total_revenue, total_orders)
SELECT sid, 0, 0 FROM seller; 