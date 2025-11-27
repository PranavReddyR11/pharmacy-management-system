import React from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

function Navbar({ onLogout, user }) {
  const navigate = useNavigate();
  const isSeller = !!user?.sid;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Pharmacy Management System
        </Typography>
        <Box>
          <Button 
            color="inherit" 
            onClick={() => navigate(isSeller ? '/seller/dashboard' : '/dashboard')}
          >
            Dashboard
          </Button>
          {isSeller ? (
            <Button color="inherit" onClick={() => navigate('/seller/dashboard')}>
              Manage Inventory
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/inventory')}>
                View Inventory
              </Button>
              <Button color="inherit" onClick={() => navigate('/orders')}>
                Orders
              </Button>
            </>
          )}
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;