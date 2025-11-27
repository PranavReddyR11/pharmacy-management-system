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
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

function Inventory({ user }) {
  const [inventory, setInventory] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filteredInventory, setFilteredInventory] = useState([]);

  useEffect(() => {
    fetchInventory();
    if (user?.uid) {
      fetchRecentOrders();
    }
  }, [user]);

  useEffect(() => {
    filterInventory();
  }, [searchTerm, inventory]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/inventory');
      setInventory(response.data);
      setFilteredInventory(response.data);
    } catch (err) {
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${user.uid}`);
      // Get unique products from orders, sorted by most recent
      const uniqueOrders = response.data
        .sort((a, b) => new Date(b.orderdatetime) - new Date(a.orderdatetime))
        .filter((order, index, self) => 
          index === self.findIndex((o) => o.pid === order.pid)
        )
        .slice(0, 5); // Show only last 5 unique products
      setRecentOrders(uniqueOrders);
    } catch (err) {
      console.error('Failed to fetch recent orders:', err);
    }
  };

  const filterInventory = () => {
    if (!searchTerm) {
      setFilteredInventory(inventory);
      return;
    }

    const filtered = inventory.filter(item => 
      item.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(filtered);
  };

  const formatPrice = (price) => {
    const priceInRupees = price / 100;
    return `₹${priceInRupees.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
          Inventory
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Products" />
            {user?.uid && <Tab label="Recently Ordered" />}
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by Product ID, Name, Manufacturer, or Seller"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Price (INR)</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Mfg Date</TableCell>
                    <TableCell>Exp Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow 
                      key={`${item.pid}-${item.sid}`}
                      sx={{
                        backgroundColor: item.quantity <= 5 ? '#fff3e0' : 'inherit'
                      }}
                    >
                      <TableCell>{item.pid}</TableCell>
                      <TableCell>{item.pname}</TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell>{item.sname}</TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        {item.quantity <= 5 ? (
                          <Typography color="error">
                            {item.quantity} (Low Stock)
                          </Typography>
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>{new Date(item.mfg).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(item.exp).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {tabValue === 1 && user?.uid && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Last Ordered From</TableCell>
                  <TableCell>Current Availability</TableCell>
                  <TableCell>Price Range (INR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => {
                  const availableSellers = inventory.filter(item => item.pid === order.pid);
                  const priceRange = availableSellers.reduce(
                    (acc, item) => ({
                      min: Math.min(acc.min, item.price),
                      max: Math.max(acc.max, item.price)
                    }),
                    { min: Infinity, max: -Infinity }
                  );

                  return (
                    <TableRow key={order.pid}>
                      <TableCell>{order.pid}</TableCell>
                      <TableCell>{order.pname}</TableCell>
                      <TableCell>{order.sname}</TableCell>
                      <TableCell>
                        {availableSellers.length > 0 ? (
                          `Available from ${availableSellers.length} seller${availableSellers.length > 1 ? 's' : ''}`
                        ) : (
                          <Typography color="error">Currently Unavailable</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {availableSellers.length > 0 ? (
                          priceRange.min === priceRange.max ? 
                          formatPrice(priceRange.min) :
                          `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No recent orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

export default Inventory;