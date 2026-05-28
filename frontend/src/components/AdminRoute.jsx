import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return isAuthenticated && user && user.role === 'Admin' ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
};

export default AdminRoute;
