import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SellerRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sid: '',
    sname: '',
    pass: '',
    confirmPass: '',
    address: '',
    phno: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.sid || !formData.sname || !formData.pass || !formData.address || !formData.phno) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.pass !== formData.confirmPass) {
      setError('Passwords do not match');
      return;
    }

    if (formData.phno.length !== 10 || !/^\d+$/.test(formData.phno)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/seller/register', {
        sid: formData.sid,
        sname: formData.sname,
        pass: formData.pass,
        address: formData.address,
        phno: formData.phno
      });
      
      // Registration successful
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Register as Seller
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Seller ID"
              name="sid"
              value={formData.sid}
              onChange={handleChange}
              margin="normal"
              helperText="Create a unique seller ID (e.g., SELL001)"
            />

            <TextField
              fullWidth
              label="Store Name"
              name="sname"
              value={formData.sname}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              name="pass"
              type="password"
              value={formData.pass}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPass"
              type="password"
              value={formData.confirmPass}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phno"
              value={formData.phno}
              onChange={handleChange}
              margin="normal"
              helperText="Enter 10-digit phone number"
            />

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default SellerRegister; 