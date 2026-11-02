import {
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

function Header() {
    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const [
        search,
        setSearch,
    ] = useState("");

    const navigate =
        useNavigate();

    const {
        user,
        isAuthenticated,
        loading,
        logout,
    } = useAuth();

    const handleSearch = (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        const query =
            search.trim();

        if (!query) {
            return;
        }

        navigate(
            `/search?q=${encodeURIComponent(
                query
            )}`
        );

        setMenuOpen(false);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleLogout = () => {
        logout();

        setMenuOpen(false);

        navigate("/");
    };

    return (
        <header className="site-header">
            <div className="header-container">

                {/* Logo */}

                <Link
                    to="/"
                    className="site-logo"
                    onClick={
                        closeMenu
                    }
                >
                    <span className="logo-icon">
                        🎨
                    </span>

                    <span className="logo-text">
                        TheColor
                        <span>
                            Clone
                        </span>
                    </span>
                </Link>

                {/* Desktop Navigation */}

                <nav className="desktop-nav">
                    <Link to="/">
                        Home
                    </Link>

                    <a href="#categories">
                        Categories
                    </a>

                    <a href="#popular">
                        Popular
                    </a>

                    <a href="#latest">
                        Latest
                    </a>
                </nav>

                {/* Desktop Search */}

                <form
                    className="header-search"
                    onSubmit={
                        handleSearch
                    }
                >
                    <span className="search-icon">
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search coloring pages..."
                        value={search}
                        onChange={(
                            e
                        ) =>
                            setSearch(
                                e.target
                                    .value
                            )
                        }
                    />
                </form>

                {/* Authentication */}

                {!loading &&
                    (isAuthenticated ? (
                        <div className="header-user">
                        <Link
                            to="/account"
                            className="header-user-name"
                            onClick={closeMenu}
                        >
                            {user?.displayName || "User"}
                        </Link>

                            <button
                                type="button"
                                className="header-logout"
                                onClick={
                                    handleLogout
                                }
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="header-login"
                            onClick={() =>
                                navigate(
                                    "/login"
                                )
                            }
                        >
                            Login
                        </button>
                    ))}

                {/* Mobile Menu */}

                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={() =>
                        setMenuOpen(
                            !menuOpen
                        )
                    }
                    aria-label="Toggle navigation"
                    aria-expanded={
                        menuOpen
                    }
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Navigation */}

            {menuOpen && (
                <div className="mobile-nav">

                    <Link
                        to="/"
                        onClick={
                            closeMenu
                        }
                    >
                        Home
                    </Link>

                    <a
                        href="#categories"
                        onClick={
                            closeMenu
                        }
                    >
                        Categories
                    </a>

                    <a
                        href="#popular"
                        onClick={
                            closeMenu
                        }
                    >
                        Popular
                    </a>

                    <a
                        href="#latest"
                        onClick={
                            closeMenu
                        }
                    >
                        Latest
                    </a>

                    <form
                        className="mobile-search"
                        onSubmit={
                            handleSearch
                        }
                    >
                        <input
                            type="text"
                            placeholder="Search coloring pages..."
                            value={search}
                            onChange={(
                                e
                            ) =>
                                setSearch(
                                    e.target
                                        .value
                                )
                            }
                        />

                        <button type="submit">
                            Search
                        </button>
                    </form>

                    {!loading &&
                        (isAuthenticated ? (
                            <div className="mobile-account">
                                <div className="mobile-user-name">
                                    {user?.displayName ||
                                        "User"}
                                </div>

                                <button
                                    type="button"
                                    className="mobile-login"
                                    onClick={
                                        handleLogout
                                    }
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="mobile-login"
                                    onClick={() => {
                                        closeMenu();

                                        navigate(
                                            "/login"
                                        );
                                    }}
                                >
                                    Login
                                </button>

                                <Link
                                    to="/register"
                                    className="mobile-register"
                                    onClick={
                                        closeMenu
                                    }
                                >
                                    Create Account
                                </Link>
                            </>
                        ))}
                </div>
            )}
        </header>
    );
}

export default Header;
