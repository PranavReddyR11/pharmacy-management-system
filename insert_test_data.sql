-- Insert sample products
INSERT INTO product (pname, manufacturer, price) VALUES
('Paracetamol', 'GSK', 5.99),
('Amoxicillin', 'Pfizer', 12.99),
('Aspirin', 'Bayer', 4.99),
('Ibuprofen', 'Johnson & Johnson', 6.99);

-- Insert these products into inventory
INSERT INTO inventory (pid, quantity) 
SELECT pid, 100 FROM product; 