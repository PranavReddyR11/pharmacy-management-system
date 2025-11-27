import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import axios from 'axios';

function SellerDashboard({ user }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockItems: 0,
    activeOrders: 0,
    cancelledOrders: 0
  });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');

  useEffect(() => {
    if (!user?.sid) {
      setError('No seller ID found. Please log in again.');
      setLoading(false);
      return;
    }
    fetchSellerStats();
    fetchSellerInventory();
  }, [user]);

  const fetchSellerStats = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching seller stats for:', user);
      const response = await axios.get(`http://localhost:5000/api/seller/stats/${user.sid}`);
      console.log('Seller dashboard response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching seller stats:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load seller statistics';
      setError(errorMessage);
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        lowStockItems: 0,
        activeOrders: 0,
        cancelledOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerInventory = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching inventory for seller:', user.sid);
      const response = await axios.get(`http://localhost:5000/api/seller/inventory/${user.sid}`);
      console.log('Inventory response:', response.data);
      
      if (!response.data) {
        throw new Error('No inventory data received from server');
      }
      
      setInventory(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load inventory';
      setError(errorMessage);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    try {
      setError('');
      console.log('Updating stock:', {
        sid: user.sid,
        pid: selectedItem.pid,
        quantity: parseInt(newQuantity)
      });

      await axios.post(`http://localhost:5000/api/seller/inventory/update`, {
        sid: user.sid,
        pid: selectedItem.pid,
        quantity: parseInt(newQuantity)
      });

      setOpenDialog(false);
      await fetchSellerInventory(); // Refresh inventory after update
    } catch (err) {
      console.error('Error updating stock:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update stock';
      setError(errorMessage);
    }
  };

  const formatPrice = (price) => {
    return `₹${Number(price/100).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return (
      <Container>
        <Box mt={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.sname || 'Seller'}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Total Orders
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {stats.totalOrders}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Total Revenue
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {formatPrice(stats.totalRevenue || 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Total Products
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {stats.totalProducts}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Low Stock Items
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {stats.lowStockItems}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ p: 2 }}>
            Inventory Management
          </Typography>

          <Box p={3}>
            <Grid container spacing={2}>
              {inventory.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.pid}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6">{item.pname}</Typography>
                    <Typography color="textSecondary">ID: {item.pid}</Typography>
                    <Typography>Stock: {item.quantity}</Typography>
                    <Typography>Price: {formatPrice(item.price)}</Typography>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => {
                          setSelectedItem(item);
                          setNewQuantity(item.quantity.toString());
                          setOpenDialog(true);
                        }}
                      >
                        Update Stock
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Update Stock Level</DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <TextField
                label="New Quantity"
                type="number"
                fullWidth
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateStock}
              variant="contained" 
              color="primary"
              disabled={!newQuantity || parseInt(newQuantity) < 0}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default SellerDashboard; 