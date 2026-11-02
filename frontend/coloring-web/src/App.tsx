import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";


/* ============================================================
   PUBLIC PAGES
============================================================ */

import Home from "./pages/Home";

import ColoringPage from "./pages/ColoringPage";

import CategoryPage from "./pages/CategoryPage";

import SearchPage from "./pages/SearchPage";


/* ============================================================
   AUTH
============================================================ */

import Login from "./pages/Login";

import Register from "./pages/Register";

import Account from "./pages/Account";


/* ============================================================
   ADMIN
============================================================ */

import AdminRoute from "./admin/AdminRoute";

import AdminLayout from "./admin/AdminLayout";

import AdminDashboard from "./admin/AdminDashboard";

import AdminColoringPages from "./admin/AdminColoringPages";

import AdminCategories from "./admin/AdminCategories";

import AdminUsers from "./admin/AdminUsers";


/* ============================================================
   AUTH PROVIDER
============================================================ */

import { AuthProvider } from "./auth/AuthContext";


import "./index.css";


function App() {

    return (

        <BrowserRouter>

            <AuthProvider>

                <Routes>


                    {/* =================================================
                        PUBLIC WEBSITE
                    ================================================= */}

                    <Route
                        path="/"
                        element={
                            <Home />
                        }
                    />


                    <Route
                        path="/search"
                        element={
                            <SearchPage />
                        }
                    />


                    <Route
                        path="/coloring/:slug"
                        element={
                            <ColoringPage />
                        }
                    />


                    <Route
                        path="/category/:slug"
                        element={
                            <CategoryPage />
                        }
                    />


                    {/* =================================================
                        AUTH
                    ================================================= */}

                    <Route
                        path="/login"
                        element={
                            <Login />
                        }
                    />


                    <Route
                        path="/register"
                        element={
                            <Register />
                        }
                    />


                    <Route
                        path="/account"
                        element={
                            <Account />
                        }
                    />


                    {/* =================================================
                        ADMIN AREA

                        ONLY Admin role can access
                    ================================================= */}

                    <Route element={<AdminRoute />}>

                        <Route
                            path="/admin"
                            element={
                                <AdminLayout />
                            }
                        >

                            <Route
                                index
                                element={
                                    <AdminDashboard />
                                }
                            />

                            <Route
                                path="coloring-pages"
                                element={
                                    <AdminColoringPages />
                                }
                            />

                            <Route
                                path="categories"
                                element={
                                    <AdminCategories />
                                }
                            />

                            <Route
                                path="users"
                                element={
                                    <AdminUsers />
                                }
                            />

                        </Route>

                    </Route>


                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}


export default App;