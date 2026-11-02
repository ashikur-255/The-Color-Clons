import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
    return (
        <aside className="admin-sidebar">

            {/* =========================================
                BRAND
            ========================================= */}

            <div className="admin-brand">

                <div className="admin-brand-mark">
                    TC
                </div>

                <div>
                    <div className="admin-brand-title">
                        TheColorClone
                    </div>

                    <div className="admin-brand-subtitle">
                        Admin Panel
                    </div>
                </div>

            </div>


            {/* =========================================
                ADMIN NAVIGATION
            ========================================= */}

            <nav className="admin-nav">

                {/* Dashboard */}

                <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                        `admin-nav-item ${isActive ? "active" : ""
                        }`
                    }
                >
                    <span>⌂</span>
                    <span>Dashboard</span>
                </NavLink>


                {/* Coloring Pages */}

                <NavLink
                    to="/admin/coloring-pages"
                    className={({ isActive }) =>
                        `admin-nav-item ${isActive ? "active" : ""
                        }`
                    }
                >
                    <span>🎨</span>
                    <span>Coloring Pages</span>
                </NavLink>


                {/* Categories */}

                <NavLink
                    to="/admin/categories"
                    className={({ isActive }) =>
                        `admin-nav-item ${isActive ? "active" : ""
                        }`
                    }
                >
                    <span>▦</span>
                    <span>Categories</span>
                </NavLink>


                {/* Users */}

                <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                        `admin-nav-item ${isActive ? "active" : ""
                        }`
                    }
                >
                    <span>♙</span>
                    <span>Users</span>
                </NavLink>

            </nav>


            {/* =========================================
                SIDEBAR BOTTOM
            ========================================= */}

            <div className="admin-sidebar-bottom">

                <NavLink
                    to="/"
                    className="admin-nav-item"
                >
                    <span>←</span>
                    <span>Back to Website</span>
                </NavLink>

            </div>

        </aside>
    );
}