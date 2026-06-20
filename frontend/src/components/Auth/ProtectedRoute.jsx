import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const getDefaultRedirect = (role) => {
    const redirectByRole = {
        customer: "/customer/tours",
        operator: "/operator/dashboard",
        guide: "/guides/tours",
        admin: "/admin/dashboard",
    };

    return redirectByRole[role] || "/login";
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    const { isAuthenticated, user, accessToken } = useSelector((state) => state.auth);

    if (!isAuthenticated || !accessToken || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDefaultRedirect(user.role)} replace />;
    }

    return children;
};

export default ProtectedRoute;
