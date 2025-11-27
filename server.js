const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Papu@2004',
  database: 'drugdatabase'
}).promise(); // Convert to promise-based connection

db.connect()
  .then(() => console.log('Connected to MySQL database'))
  .catch((err) => console.error('Error connecting to MySQL:', err));

// Routes

// Customer Routes
app.post('/api/register', async (req, res) => {
  const { uid, pass, fname, lname, email, address, phno } = req.body;
  try {
    await db.query(
      'INSERT INTO customer (uid, pass, fname, lname, email, address, phno) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uid, pass, fname, lname, email, address, phno]
    );
    res.json({ message: 'Customer registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller Routes
app.post('/api/seller/register', async (req, res) => {
  const { sid, sname, pass, address, phno } = req.body;
  try {
    await db.beginTransaction();
    
    // Insert the seller
    await db.query(
      'INSERT INTO seller (sid, sname, pass, address, phno) VALUES (?, ?, ?, ?, ?)',
      [sid, sname, pass, address, phno]
    );

    // Create initial inventory entries for the new seller
    await db.query(`
      INSERT INTO inventory (pid, pname, quantity, sid)
      SELECT pid, pname, 50, ? FROM product
    `, [sid]);

    await db.commit();
    res.json({ message: 'Seller registered successfully' });
  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { id, pass, accountType } = req.body;
  const table = accountType === 'seller' ? 'seller' : 'customer';
  const idField = accountType === 'seller' ? 'sid' : 'uid';
  
  try {
    const [result] = await db.query(
      `SELECT * FROM ${table} WHERE ${idField} = ? AND pass = ?`,
      [id, pass]
    );
    
    if (result.length > 0) {
      res.json({ 
        success: true, 
        user: { ...result[0], accountType } 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sellers
app.get('/api/sellers', async (req, res) => {
  try {
    const [result] = await db.query('SELECT * FROM seller');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const [result] = await db.query('SELECT * FROM product');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inventory with product details
app.get('/api/inventory', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT i.*, p.pname, p.manufacturer, p.price, p.mfg, p.exp, s.sname 
      FROM inventory i 
      JOIN product p ON i.pid = p.pid 
      JOIN seller s ON i.sid = s.sid
      ORDER BY p.pname
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search inventory by product ID
app.get('/api/inventory/search/:pid', async (req, res) => {
  const { pid } = req.params;
  try {
    const [result] = await db.query(`
      SELECT i.*, p.pname, p.manufacturer, p.price, p.mfg, p.exp, s.sname 
      FROM inventory i 
      JOIN product p ON i.pid = p.pid 
      JOIN seller s ON i.sid = s.sid 
      WHERE i.pid LIKE ?
    `, [`%${pid}%`]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer dashboard statistics
app.get('/api/dashboard/stats/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    console.log('Fetching dashboard stats for customer:', uid);
    
    // First verify if the customer exists
    const [customerResult] = await db.query('SELECT * FROM customer WHERE uid = ?', [uid]);
    
    if (!customerResult || customerResult.length === 0) {
      console.log('Customer not found:', uid);
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get order statistics with proper status handling
    const [result] = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' OR status IS NULL THEN price ELSE 0 END), 0) as totalSpent,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders,
        COUNT(CASE WHEN status IS NULL OR status = 'active' THEN 1 END) as activeOrders
      FROM orders 
      WHERE uid = ?
    `, [uid]);
    
    console.log('Customer dashboard stats result:', result[0]);
    
    res.json({
      totalOrders: result[0].totalOrders || 0,
      totalSpent: result[0].totalSpent || 0,
      cancelledOrders: result[0].cancelledOrders || 0,
      activeOrders: result[0].activeOrders || 0
    });
  } catch (err) {
    console.error('Error fetching customer dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get seller dashboard statistics
app.get('/api/seller/stats/:sid', async (req, res) => {
  const { sid } = req.params;
  try {
    console.log('Fetching dashboard stats for seller:', sid);
    
    // First verify if the seller exists
    const [sellerResult] = await db.query('SELECT * FROM seller WHERE sid = ?', [sid]);
    
    if (!sellerResult || sellerResult.length === 0) {
      console.log('Seller not found:', sid);
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get seller statistics with proper status handling
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE sid = ?) as totalOrders,
        (SELECT COALESCE(SUM(CASE WHEN status != 'cancelled' THEN price ELSE 0 END), 0) FROM orders WHERE sid = ?) as totalRevenue,
        (SELECT COUNT(*) FROM inventory WHERE sid = ?) as totalProducts,
        (SELECT COUNT(*) FROM inventory WHERE sid = ? AND quantity <= 5) as lowStockItems,
        (SELECT COUNT(*) FROM orders WHERE sid = ? AND (status IS NULL OR status = 'active')) as activeOrders,
        (SELECT COUNT(*) FROM orders WHERE sid = ? AND status = 'cancelled') as cancelledOrders
    `, [sid, sid, sid, sid, sid, sid]);
    
    console.log('Seller dashboard stats result:', result[0]);
    
    res.json({
      totalOrders: result[0].totalOrders || 0,
      totalRevenue: result[0].totalRevenue || 0,
      totalProducts: result[0].totalProducts || 0,
      lowStockItems: result[0].lowStockItems || 0,
      activeOrders: result[0].activeOrders || 0,
      cancelledOrders: result[0].cancelledOrders || 0
    });
  } catch (err) {
    console.error('Error fetching seller dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
  const { pid, uid, sid, quantity } = req.body;
  
  if (!pid || !uid || !sid || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.beginTransaction();

    // Check current inventory with row lock
    const [inventoryResult] = await db.query(
      'SELECT quantity FROM inventory WHERE pid = ? AND sid = ? FOR UPDATE',
      [pid, sid]
    );
    
    if (inventoryResult.length === 0) {
      await db.rollback();
      return res.status(404).json({ error: 'Product not found in inventory' });
    }

    const currentStock = inventoryResult[0].quantity;
    
    if (currentStock < quantity) {
      await db.rollback();
      return res.status(400).json({ 
        error: `Not enough stock. Available quantity: ${currentStock}` 
      });
    }

    // Get product price
    const [priceResult] = await db.query(
      'SELECT price FROM product WHERE pid = ?',
      [pid]
    );
    
    if (priceResult.length === 0) {
      await db.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const price = priceResult[0].price * quantity;

    // Insert order
    const [orderResult] = await db.query(
      'INSERT INTO orders (pid, sid, uid, quantity, price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [pid, sid, uid, quantity, price, 'active']
    );

    // Update inventory
    await db.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE pid = ? AND sid = ? AND quantity >= ?',
      [quantity, pid, sid, quantity]
    );

    await db.commit();
    res.json({ 
      message: 'Order placed successfully', 
      orderId: orderResult.insertId 
    });
  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Cancel order endpoint
app.post('/api/orders/cancel/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { uid } = req.body;

  try {
    await db.beginTransaction();

    // Get order details and verify ownership
    const [orderResult] = await db.query(
      'SELECT * FROM orders WHERE oid = ? AND uid = ? AND (status IS NULL OR status != "cancelled")',
      [orderId, uid]
    );

    if (orderResult.length === 0) {
      await db.rollback();
      return res.status(404).json({ error: 'Order not found or already cancelled' });
    }

    const order = orderResult[0];

    // Update order status
    await db.query(
      'UPDATE orders SET status = "cancelled" WHERE oid = ?',
      [orderId]
    );

    // Return items to inventory
    await db.query(
      'UPDATE inventory SET quantity = quantity + ? WHERE pid = ? AND sid = ?',
      [order.quantity, order.pid, order.sid]
    );

    await db.commit();
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Get orders with product and seller details
app.get('/api/orders/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const [result] = await db.query(`
      SELECT o.*, p.pname, s.sname 
      FROM orders o 
      JOIN product p ON o.pid = p.pid 
      JOIN seller s ON o.sid = s.sid 
      WHERE o.uid = ? 
      ORDER BY o.orderdatetime DESC
    `, [uid]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get seller inventory
app.get('/api/seller/inventory/:sid', async (req, res) => {
  const { sid } = req.params;
  try {
    console.log('Fetching inventory for seller:', sid);

    // First verify if the seller exists
    const [sellerResult] = await db.query('SELECT * FROM seller WHERE sid = ?', [sid]);
    
    if (!sellerResult || sellerResult.length === 0) {
      console.log('Seller not found:', sid);
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get inventory with product details
    const [result] = await db.query(`
      SELECT 
        i.*,
        p.pname,
        p.manufacturer,
        p.price,
        p.mfg,
        p.exp
      FROM inventory i
      JOIN product p ON i.pid = p.pid
      WHERE i.sid = ?
      ORDER BY p.pname
    `, [sid]);

    console.log(`Found ${result.length} inventory items for seller ${sid}`);

    // If no inventory items found, create initial inventory
    if (result.length === 0) {
      console.log('No inventory found, creating initial inventory for seller:', sid);
      
      // Get all products
      const [products] = await db.query('SELECT * FROM product');
      
      // Create inventory entries for each product
      await db.query(`
        INSERT INTO inventory (pid, pname, quantity, sid)
        SELECT pid, pname, 50, ? FROM product
      `, [sid]);

      // Fetch the newly created inventory
      const [newResult] = await db.query(`
        SELECT 
          i.*,
          p.pname,
          p.manufacturer,
          p.price,
          p.mfg,
          p.exp
        FROM inventory i
        JOIN product p ON i.pid = p.pid
        WHERE i.sid = ?
        ORDER BY p.pname
      `, [sid]);

      console.log(`Created ${newResult.length} initial inventory items for seller ${sid}`);
      res.json(newResult);
    } else {
      res.json(result);
    }
  } catch (err) {
    console.error('Error fetching seller inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update seller inventory
app.post('/api/seller/inventory/update', async (req, res) => {
  const { sid, pid, quantity } = req.body;
  
  try {
    console.log('Updating inventory:', { sid, pid, quantity });

    if (!sid || !pid || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the inventory item exists
    const [existingItem] = await db.query(
      'SELECT * FROM inventory WHERE sid = ? AND pid = ?',
      [sid, pid]
    );

    if (!existingItem || existingItem.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Update the quantity
    await db.query(
      'UPDATE inventory SET quantity = ? WHERE sid = ? AND pid = ?',
      [quantity, sid, pid]
    );

    console.log('Inventory updated successfully');
    res.json({ message: 'Inventory updated successfully' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify seller data
app.get('/api/seller/verify/:sid', async (req, res) => {
  const { sid } = req.params;
  try {
    // Check seller exists
    const [sellerResult] = await db.query('SELECT * FROM seller WHERE sid = ?', [sid]);
    
    // Check seller's inventory
    const [inventoryResult] = await db.query(`
      SELECT i.*, p.pname 
      FROM inventory i 
      JOIN product p ON i.pid = p.pid 
      WHERE i.sid = ?
    `, [sid]);

    res.json({
      sellerExists: sellerResult.length > 0,
      seller: sellerResult[0],
      inventoryCount: inventoryResult.length,
      inventory: inventoryResult
    });
  } catch (err) {
    console.error('Error verifying seller data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process payment
app.post('/api/process-payment', async (req, res) => {
  const { orderId, amount, paymentMethod, cardDetails } = req.body;
  
  try {
    await db.beginTransaction();

    // Verify order exists and hasn't been paid
    const [orderResult] = await db.query(
      'SELECT * FROM orders WHERE oid = ? AND (payment_status IS NULL OR payment_status != "completed")',
      [orderId]
    );

    if (!orderResult || orderResult.length === 0) {
      await db.rollback();
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    const order = orderResult[0];

    // In a real application, you would integrate with a payment gateway here
    // For this demo, we'll simulate a successful payment
    
    // Update order with payment details
    await db.query(
      `UPDATE orders 
       SET payment_status = 'completed',
           payment_method = ?,
           card_last_four = ?,
           payment_date = NOW()
       WHERE oid = ?`,
      [paymentMethod, cardDetails.lastFourDigits, orderId]
    );

    // Update seller's revenue
    await db.query(
      `INSERT INTO seller_stats (sid, total_revenue, total_orders)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE
       total_revenue = total_revenue + VALUES(total_revenue),
       total_orders = total_orders + 1`,
      [order.sid, amount]
    );

    await db.commit();
    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      transactionId: `TXN${Date.now()}`
    });
  } catch (err) {
    await db.rollback();
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});