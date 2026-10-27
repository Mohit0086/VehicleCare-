import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="auth-loading"><div className="skeleton skeleton-title"/><div className="skeleton skeleton-line"/></div>;
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <Navigate to="/403" replace />;
  return children;
};
