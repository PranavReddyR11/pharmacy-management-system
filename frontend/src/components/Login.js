import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Container, 
  Box, 
  Select, 
  MenuItem,
  Alert
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ 
    id: '', 
    pass: '',
    accountType: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Login attempt with:', credentials);
      const response = await axios.post('http://localhost:5000/api/login', credentials);
      if (response.data.success) {
        console.log('Login successful, user data:', response.data.user);
        onLogin(response.data.user);
        navigate(credentials.accountType === 'seller' ? '/seller/dashboard' : '/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Select
              fullWidth
              value={credentials.accountType}
              onChange={(e) => setCredentials({ ...credentials, accountType: e.target.value })}
              margin="normal"
              sx={{ mb: 2 }}
              displayEmpty
            >
              <MenuItem value="" disabled>Select Account Type</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
            </Select>

            <TextField
              fullWidth
              label={credentials.accountType === 'seller' ? 'Seller ID' : 'Customer ID'}
              value={credentials.id}
              onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.pass}
              onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
              margin="normal"
            />

            <Box mt={3} display="flex" flexDirection="column" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!credentials.id || !credentials.pass || !credentials.accountType}
              >
                Login
              </Button>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  component={Link}
                  to="/register"
                  color="primary"
                >
                  Register as Customer
                </Button>
                <Button
                  component={Link}
                  to="/seller/register"
                  color="primary"
                >
                  Register as Seller
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;