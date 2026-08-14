import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../services/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    const user = getStoredUser();

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to dashboard (or 403 page) if role not allowed
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
