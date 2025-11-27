import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';
import Payment from './Payment';

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    pid: '',
    sid: '',
    quantity: ''
  });
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchSellers();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${user.uid}`);
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products');
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sellers');
      setSellers(response.data);
    } catch (err) {
      setError('Failed to fetch sellers');
    }
  };

  const formatPrice = (price) => {
    const priceInRupees = price / 100;
    return `₹${priceInRupees.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`;
  };

  const handleProductChange = (e) => {
    setError('');
    setNewOrder({ ...newOrder, pid: e.target.value, sid: '', quantity: '' });
  };

  const handleSellerChange = (e) => {
    setError('');
    setNewOrder({ ...newOrder, sid: e.target.value, quantity: '' });
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      if (!newOrder.pid || !newOrder.sid || !newOrder.quantity) {
        setError('Please fill in all fields');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/orders', {
        pid: newOrder.pid,
        sid: newOrder.sid,
        uid: user.uid,
        quantity: parseInt(newOrder.quantity)
      });

      setSuccess('Order placed successfully');
      setOpenDialog(false);
      setError('');
      fetchOrders();
      setNewOrder({ pid: '', sid: '', quantity: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingOrder(orderId);
      await axios.post(`http://localhost:5000/api/orders/cancel/${orderId}`, {
        uid: user.uid
      });
      setSuccess('Order cancelled successfully');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handlePayment = (order) => {
    console.log('Processing payment for order:', order);
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    setShowPayment(false);
    setSelectedOrder(null);
    setSuccess('Payment successful!');
    fetchOrders(); // Refresh orders list
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedOrder(null);
  };

  if (showPayment) {
    return (
      <Payment
        order={selectedOrder}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <Container>
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setError('');
              setOpenDialog(true);
              setNewOrder({ pid: '', sid: '', quantity: '' });
            }}
          >
            Place New Order
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price (INR)</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.oid}>
                  <TableCell>{order.oid}</TableCell>
                  <TableCell>{order.pname || order.pid}</TableCell>
                  <TableCell>{order.sname || order.sid}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{formatPrice(order.price)}</TableCell>
                  <TableCell>{new Date(order.orderdatetime).toLocaleString()}</TableCell>
                  <TableCell>{order.status || 'active'}</TableCell>
                  <TableCell>
                    {order.status === 'cancelled' ? (
                      <Typography color="error">
                        Cancelled
                      </Typography>
                    ) : order.payment_status ? (
                      <Typography color="primary">
                        {order.payment_status === 'completed' ? 'Paid' : order.payment_status}
                      </Typography>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handlePayment(order)}
                      >
                        Pay Now
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {(!order.status || order.status !== 'cancelled') && !order.payment_status && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelOrder(order.oid)}
                        disabled={cancellingOrder === order.oid}
                      >
                        {cancellingOrder === order.oid ? (
                          <CircularProgress size={20} />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog 
          open={openDialog} 
          onClose={() => {
            setError('');
            setOpenDialog(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Place New Order</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <FormControl fullWidth margin="dense">
              <InputLabel>Select Medicine</InputLabel>
              <Select
                value={newOrder.pid}
                onChange={handleProductChange}
                label="Select Medicine"
              >
                {products.map((product) => (
                  <MenuItem key={product.pid} value={product.pid}>
                    {product.pname} - {formatPrice(product.price)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Select Seller</InputLabel>
              <Select
                value={newOrder.sid}
                onChange={handleSellerChange}
                label="Select Seller"
                disabled={!newOrder.pid}
              >
                {sellers.map((seller) => (
                  <MenuItem key={seller.sid} value={seller.sid}>
                    {seller.sname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Quantity"
              type="number"
              fullWidth
              value={newOrder.quantity}
              onChange={(e) => {
                setError('');
                setNewOrder({ ...newOrder, quantity: e.target.value });
              }}
              inputProps={{ min: 1 }}
              disabled={!newOrder.sid}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setError('');
              setOpenDialog(false);
            }} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handlePlaceOrder} 
              color="primary" 
              variant="contained"
              disabled={loading || !newOrder.pid || !newOrder.sid || !newOrder.quantity}
            >
              {loading ? <CircularProgress size={24} /> : 'Place Order'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default Orders;