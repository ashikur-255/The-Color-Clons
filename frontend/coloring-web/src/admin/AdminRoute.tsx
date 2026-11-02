import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function AdminRoute() {
    const {
        user,
        isAuthenticated,
        loading,
    } = useAuth();

    const location =
        useLocation();


    /*
     * Wait until authentication
     * restoration is completed.
     */

    if (loading) {
        return (
            <div className="admin-route-loading">

                <div className="admin-route-loader">
                    <div />
                    <div />
                    <div />
                </div>

                <p>
                    Checking admin access...
                </p>

            </div>
        );
    }


    /*
     * Not logged in
     */

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname,
                }}
            />
        );
    }


    /*
     * Check Admin role
     */

    const roles =
        Array.isArray(
            (user as any).roles
        )
            ? (user as any).roles
            : [];

    const isAdmin =
        roles.some(
            (role: unknown) =>
                String(role).toLowerCase() ===
                "admin"
        );


    /*
     * Logged in but not Admin
     */

    if (!isAdmin) {
        return (
            <Navigate
                to="/account"
                replace
            />
        );
    }


    /*
     * Admin
     */

    return <Outlet />;
}