import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import components
import Login from './components/Login';
import Register from './components/Register';
import SellerRegister from './components/SellerRegister';
import Dashboard from './components/Dashboard';
import SellerDashboard from './components/SellerDashboard';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isAuthenticated && <Navbar onLogout={handleLogout} user={user} />}
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to={user?.sid ? "/seller/dashboard" : "/dashboard"} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={<Register />} 
          />
          <Route 
            path="/seller/register" 
            element={<SellerRegister />} 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated && !user?.sid ? (
                <Dashboard user={user} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/seller/dashboard" 
            element={
              isAuthenticated && user?.sid ? (
                <SellerDashboard user={user} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/inventory" 
            element={
              isAuthenticated ? (
                <Inventory user={user} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/orders" 
            element={
              isAuthenticated ? (
                <Orders user={user} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to="/login" />} 
          />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;