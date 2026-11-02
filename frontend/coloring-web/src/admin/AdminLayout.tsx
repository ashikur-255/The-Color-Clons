import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";

import "./admin.css";

export default function AdminLayout() {
    return (
        <div className="admin-layout">

            {/* Sidebar */}

            <AdminSidebar />


            {/* Main Area */}

            <div className="admin-main">

                {/* Topbar */}

                <header className="admin-topbar">

                    <div>
                        <h1>
                            Admin Panel
                        </h1>

                        <p>
                            Manage your coloring website
                        </p>
                    </div>


                    {/* Admin User */}

                    <div className="admin-user">

                        <div className="admin-avatar">
                            A
                        </div>

                        <div>
                            <strong>
                                Administrator
                            </strong>

                            <span>
                                Admin
                            </span>
                        </div>

                    </div>

                </header>


                {/* Page Content */}

                <main className="admin-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}