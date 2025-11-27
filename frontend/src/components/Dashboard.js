import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0,
    cancelledOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setError('No user ID found. Please log in again.');
      setLoading(false);
      return;
    }
    fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching customer stats for:', user);
      const response = await axios.get(`http://localhost:5000/api/dashboard/stats/${user.uid}`);
      console.log('Customer dashboard response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching customer dashboard stats:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load dashboard statistics';
      setError(errorMessage);
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        activeOrders: 0,
        cancelledOrders: 0
      });
    } finally {
      setLoading(false);
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
          Welcome, {user?.fname || 'User'}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
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
                Total Spent
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {formatPrice(stats.totalSpent || 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Active Orders
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {stats.activeOrders}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Cancelled Orders
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {stats.cancelledOrders}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Dashboard;