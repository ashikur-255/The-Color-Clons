import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import apiClient from "../api/client";

import "./admin-dashboard.css";

// ============================================================
// TYPES
// ============================================================

interface DashboardColoringPage {
    id: number;
    title?: string;
    name?: string;
    slug?: string;

    categoryId?: number;
    categoryName?: string;

    thumbnailUrl?: string | null;
    imageUrl?: string | null;
    svgUrl?: string | null;

    isPublished?: boolean;

    viewCount?: number;
    likeCount?: number;
    downloadCount?: number;

    // Fallback property names
    views?: number;
    likes?: number;
    downloads?: number;

    rating?: number;
    averageRating?: number;

    createdAt?: string;
}

interface DashboardUser {
    id: number;
    displayName?: string;
    email?: string;
    isActive?: boolean;
    createdAt?: string;
    roles?: string[];
}

interface DashboardCategory {
    id: number;
    name?: string;
    slug?: string;
}

interface DashboardStats {
    totalViews: number;
    totalLikes: number;
    totalDownloads: number;
}

// ============================================================
// HELPERS
// ============================================================

const API_ORIGIN = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5100"
).replace(/\/+$/, "");

function getArray<T>(response: any): T[] {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    return [];
}

function getPageTitle(page: DashboardColoringPage) {
    return page.title || page.name || "Untitled Coloring Page";
}

function getViews(page: DashboardColoringPage) {
    return Number(
        page.viewCount ??
        page.views ??
        0
    );
}

function getLikes(page: DashboardColoringPage) {
    return Number(
        page.likeCount ??
        page.likes ??
        0
    );
}

function getDownloads(page: DashboardColoringPage) {
    return Number(
        page.downloadCount ??
        page.downloads ??
        0
    );
}

function getRating(page: DashboardColoringPage) {
    return Number(
        page.rating ??
        page.averageRating ??
        0
    );
}

function resolveMediaUrl(
    url?: string | null
) {
    if (!url) {
        return "";
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return `${API_ORIGIN}${url.startsWith("/")
            ? url
            : `/${url}`
        }`;
}

function getThumbnailUrl(
    page: DashboardColoringPage
) {
    return resolveMediaUrl(
        page.thumbnailUrl ||
        page.imageUrl ||
        page.svgUrl
    );
}

function formatNumber(
    value: number
) {
    return new Intl.NumberFormat(
        "en-US"
    ).format(value);
}

function formatDate(
    date?: string
) {
    if (!date) {
        return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "—";
    }

    return parsed.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminDashboard() {
    const [
        pages,
        setPages,
    ] = useState<DashboardColoringPage[]>([]);

    const [
        users,
        setUsers,
    ] = useState<DashboardUser[]>([]);

    const [
        categories,
        setCategories,
    ] = useState<DashboardCategory[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    const loadDashboard = useCallback(
        async (
            isRefresh = false
        ) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const results =
                    await Promise.allSettled([
                        apiClient.get(
                            "/coloringpages"
                        ),

                        apiClient.get(
                            "/categories"
                        ),

                        apiClient.get(
                            "/admin/users"
                        ),
                    ]);

                // ------------------------------------------------
                // COLORING PAGES
                // ------------------------------------------------

                const pagesResult =
                    results[0];

                if (
                    pagesResult.status ===
                    "fulfilled"
                ) {
                    const pageData =
                        getArray<DashboardColoringPage>(
                            pagesResult.value
                        );

                    setPages(pageData);
                }

                // ------------------------------------------------
                // CATEGORIES
                // ------------------------------------------------

                const categoriesResult =
                    results[1];

                if (
                    categoriesResult.status ===
                    "fulfilled"
                ) {
                    const categoryData =
                        getArray<DashboardCategory>(
                            categoriesResult.value
                        );

                    setCategories(
                        categoryData
                    );
                }

                // ------------------------------------------------
                // USERS
                // ------------------------------------------------

                const usersResult =
                    results[2];

                if (
                    usersResult.status ===
                    "fulfilled"
                ) {
                    const userData =
                        getArray<DashboardUser>(
                            usersResult.value
                        );

                    setUsers(userData);
                }

                const failed =
                    results.filter(
                        (result) =>
                            result.status ===
                            "rejected"
                    );

                if (
                    failed.length ===
                    results.length
                ) {
                    setError(
                        "Unable to load dashboard data."
                    );
                }
            } catch (err) {
                console.error(
                    "Dashboard loading error:",
                    err
                );

                setError(
                    "Something went wrong while loading dashboard data."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // ========================================================
    // DERIVED DATA
    // ========================================================

    const publishedPages =
        useMemo(
            () =>
                pages.filter(
                    (page) =>
                        page.isPublished !==
                        false
                ),
            [pages]
        );

    const draftPages =
        useMemo(
            () =>
                pages.filter(
                    (page) =>
                        page.isPublished ===
                        false
                ),
            [pages]
        );

    const activeUsers =
        useMemo(
            () =>
                users.filter(
                    (user) =>
                        user.isActive !==
                        false
                ),
            [users]
        );

    const administrators =
        useMemo(
            () =>
                users.filter(
                    (user) =>
                        user.roles?.some(
                            (role) =>
                                role.toLowerCase() ===
                                "admin"
                        )
                ),
            [users]
        );

    // ========================================================
    // CONTENT PERFORMANCE
    // ========================================================

    const performance =
        useMemo<DashboardStats>(
            () => {
                return pages.reduce(
                    (
                        total,
                        page
                    ) => {
                        total.totalViews +=
                            getViews(page);

                        total.totalLikes +=
                            getLikes(page);

                        total.totalDownloads +=
                            getDownloads(page);

                        return total;
                    },
                    {
                        totalViews: 0,
                        totalLikes: 0,
                        totalDownloads: 0,
                    }
                );
            },
            [pages]
        );

    // ========================================================
    // RECENT PAGES
    // ========================================================

    const recentPages =
        useMemo(() => {
            return [...pages]
                .sort(
                    (
                        a,
                        b
                    ) => {
                        const dateA =
                            new Date(
                                a.createdAt ||
                                0
                            ).getTime();

                        const dateB =
                            new Date(
                                b.createdAt ||
                                0
                            ).getTime();

                        return (
                            dateB -
                            dateA
                        );
                    }
                )
                .slice(0, 5);
        }, [pages]);

    // ========================================================
    // POPULAR PAGES
    // ========================================================

    const popularPages =
        useMemo(() => {
            return [...pages]
                .sort(
                    (
                        a,
                        b
                    ) => {
                        const scoreA =
                            getViews(a) +
                            getLikes(a) * 10 +
                            getDownloads(a) * 5;

                        const scoreB =
                            getViews(b) +
                            getLikes(b) * 10 +
                            getDownloads(b) * 5;

                        return (
                            scoreB -
                            scoreA
                        );
                    }
                )
                .slice(0, 5);
        }, [pages]);

    // ========================================================
    // CATEGORY DISTRIBUTION
    // ========================================================

    const categoryStats =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    number
                >();

            pages.forEach(
                (page) => {
                    const name =
                        page.categoryName ||
                        "Uncategorized";

                    map.set(
                        name,
                        (map.get(name) ||
                            0) + 1
                    );
                }
            );

            return Array.from(
                map.entries()
            )
                .sort(
                    (
                        [, a],
                        [, b]
                    ) => b - a
                )
                .slice(0, 6);
        }, [pages]);

    const maxCategoryCount =
        Math.max(
            ...categoryStats.map(
                ([, count]) =>
                    count
            ),
            1
        );

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-loading">
                    <div className="dashboard-spinner" />
                    <p>
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="dashboard-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="dashboard-header">

                <div>
                    <div className="dashboard-eyebrow">
                        OVERVIEW
                    </div>

                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Monitor your coloring
                        platform, content and
                        users from one place.
                    </p>
                </div>

                <button
                    className="dashboard-refresh-btn"
                    onClick={() =>
                        loadDashboard(true)
                    }
                    disabled={refreshing}
                >
                    <span
                        className={
                            refreshing
                                ? "dashboard-refresh-icon spinning"
                                : "dashboard-refresh-icon"
                        }
                    >
                        ↻
                    </span>

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="dashboard-alert">
                    <span>!</span>
                    <div>
                        <strong>
                            Dashboard warning
                        </strong>
                        <p>
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* ==================================================
                MAIN STATS
            ================================================== */}

            <div className="dashboard-stats-grid">

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon purple">
                        👥
                    </div>

                    <div className="dashboard-stat-arrow">
                        ↗
                    </div>

                    <div className="dashboard-stat-number">
                        {formatNumber(
                            users.length
                        )}
                    </div>

                    <div className="dashboard-stat-title">
                        Total Users
                    </div>

                    <div className="dashboard-stat-description">
                        Registered accounts
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon green">
                        ✓
                    </div>

                    <div className="dashboard-stat-arrow">
                        ↗
                    </div>

                    <div className="dashboard-stat-number">
                        {formatNumber(
                            activeUsers.length
                        )}
                    </div>

                    <div className="dashboard-stat-title">
                        Active Users
                    </div>

                    <div className="dashboard-stat-description">
                        {users.length > 0
                            ? `${Math.round(
                                (activeUsers.length /
                                    users.length) *
                                100
                            )}% of all users`
                            : "0% of all users"}
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon orange">
                        ♛
                    </div>

                    <div className="dashboard-stat-arrow">
                        ↗
                    </div>

                    <div className="dashboard-stat-number">
                        {formatNumber(
                            administrators.length
                        )}
                    </div>

                    <div className="dashboard-stat-title">
                        Administrators
                    </div>

                    <div className="dashboard-stat-description">
                        Platform administrators
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon blue">
                        🎨
                    </div>

                    <div className="dashboard-stat-arrow">
                        ↗
                    </div>

                    <div className="dashboard-stat-number">
                        {formatNumber(
                            publishedPages.length
                        )}
                    </div>

                    <div className="dashboard-stat-title">
                        Coloring Pages
                    </div>

                    <div className="dashboard-stat-description">
                        Published content
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon pink">
                        ▦
                    </div>

                    <div className="dashboard-stat-arrow">
                        ↗
                    </div>

                    <div className="dashboard-stat-number">
                        {formatNumber(
                            categories.length
                        )}
                    </div>

                    <div className="dashboard-stat-title">
                        Categories
                    </div>

                    <div className="dashboard-stat-description">
                        Content categories
                    </div>
                </div>
            </div>

            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="dashboard-section">

                <div className="dashboard-section-heading">
                    <div>
                        <div className="dashboard-eyebrow">
                            MANAGEMENT
                        </div>

                        <h3>
                            Quick Actions
                        </h3>
                    </div>
                </div>

                <div className="dashboard-actions-grid">

                    <Link
                        to="/admin/coloring-pages"
                        className="dashboard-action-card"
                    >
                        <div className="dashboard-action-icon blue">
                            🎨
                        </div>

                        <div className="dashboard-action-content">
                            <strong>
                                Manage Coloring Pages
                            </strong>

                            <span>
                                Create, edit and
                                publish coloring
                                content
                            </span>
                        </div>

                        <span className="dashboard-action-arrow">
                            →
                        </span>
                    </Link>

                    <Link
                        to="/admin/categories"
                        className="dashboard-action-card"
                    >
                        <div className="dashboard-action-icon purple">
                            ▦
                        </div>

                        <div className="dashboard-action-content">
                            <strong>
                                Manage Categories
                            </strong>

                            <span>
                                Organize your
                                content structure
                            </span>
                        </div>

                        <span className="dashboard-action-arrow">
                            →
                        </span>
                    </Link>

                    <Link
                        to="/admin/users"
                        className="dashboard-action-card"
                    >
                        <div className="dashboard-action-icon green">
                            👥
                        </div>

                        <div className="dashboard-action-content">
                            <strong>
                                Manage Users
                            </strong>

                            <span>
                                View accounts and
                                permissions
                            </span>
                        </div>

                        <span className="dashboard-action-arrow">
                            →
                        </span>
                    </Link>
                </div>
            </section>

            {/* ==================================================
                RECENT + POPULAR
            ================================================== */}

            <div className="dashboard-two-column">

                {/* RECENT */}

                <section className="dashboard-panel">

                    <div className="dashboard-panel-header">
                        <div>
                            <div className="dashboard-eyebrow">
                                CONTENT
                            </div>

                            <h3>
                                Recent Coloring Pages
                            </h3>
                        </div>

                        <Link
                            to="/admin/coloring-pages"
                            className="dashboard-view-all"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="dashboard-list">

                        {recentPages.length ===
                            0 ? (
                            <div className="dashboard-empty">
                                No coloring pages
                                found.
                            </div>
                        ) : (
                            recentPages.map(
                                (
                                    page
                                ) => {
                                    const image =
                                        getThumbnailUrl(
                                            page
                                        );

                                    return (
                                        <div
                                            className="dashboard-content-row"
                                            key={
                                                page.id
                                            }
                                        >
                                            <div className="dashboard-thumb">
                                                {image ? (
                                                    <img
                                                        src={
                                                            image
                                                        }
                                                        alt={getPageTitle(
                                                            page
                                                        )}
                                                    />
                                                ) : (
                                                    <span>
                                                        🎨
                                                    </span>
                                                )}
                                            </div>

                                            <div className="dashboard-row-info">
                                                <strong>
                                                    {getPageTitle(
                                                        page
                                                    )}
                                                </strong>

                                                <span>
                                                    {page.categoryName ||
                                                        "Coloring Page"}
                                                </span>

                                                <small>
                                                    {formatDate(
                                                        page.createdAt
                                                    )}
                                                </small>
                                            </div>

                                            <span
                                                className={
                                                    page.isPublished ===
                                                        false
                                                        ? "dashboard-status draft"
                                                        : "dashboard-status published"
                                                }
                                            >
                                                <i />
                                                {page.isPublished ===
                                                    false
                                                    ? "Draft"
                                                    : "Published"}
                                            </span>
                                        </div>
                                    );
                                }
                            )
                        )}
                    </div>
                </section>

                {/* POPULAR */}

                <section className="dashboard-panel">

                    <div className="dashboard-panel-header">
                        <div>
                            <div className="dashboard-eyebrow">
                                PERFORMANCE
                            </div>

                            <h3>
                                Popular Pages
                            </h3>
                        </div>

                        <Link
                            to="/admin/coloring-pages"
                            className="dashboard-view-all"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="dashboard-popular-list">

                        {popularPages.length ===
                            0 ? (
                            <div className="dashboard-empty">
                                No coloring pages
                                found.
                            </div>
                        ) : (
                            popularPages.map(
                                (
                                    page,
                                    index
                                ) => (
                                    <div
                                        className="dashboard-popular-row"
                                        key={
                                            page.id
                                        }
                                    >
                                        <span className="dashboard-rank">
                                            {String(
                                                index +
                                                1
                                            ).padStart(
                                                2,
                                                "0"
                                            )}
                                        </span>

                                        <div className="dashboard-popular-thumb">
                                            {getThumbnailUrl(
                                                page
                                            ) ? (
                                                <img
                                                    src={getThumbnailUrl(
                                                        page
                                                    )}
                                                    alt={getPageTitle(
                                                        page
                                                    )}
                                                />
                                            ) : (
                                                <span>
                                                    🎨
                                                </span>
                                            )}
                                        </div>

                                        <div className="dashboard-popular-info">
                                            <strong>
                                                {getPageTitle(
                                                    page
                                                )}
                                            </strong>

                                            <div className="dashboard-mini-metrics">
                                                <span>
                                                    ◉{" "}
                                                    {formatNumber(
                                                        getViews(
                                                            page
                                                        )
                                                    )}
                                                </span>

                                                <span>
                                                    ♡{" "}
                                                    {formatNumber(
                                                        getLikes(
                                                            page
                                                        )
                                                    )}
                                                </span>

                                                <span>
                                                    ↓{" "}
                                                    {formatNumber(
                                                        getDownloads(
                                                            page
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="dashboard-rating">
                                            <span>
                                                ★
                                            </span>

                                            {getRating(
                                                page
                                            ).toFixed(
                                                1
                                            )}
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                </section>
            </div>

            {/* ==================================================
                PERFORMANCE + CATEGORY
            ================================================== */}

            <div className="dashboard-two-column">

                <section className="dashboard-panel">

                    <div className="dashboard-panel-header">
                        <div>
                            <div className="dashboard-eyebrow">
                                PLATFORM ENGAGEMENT
                            </div>

                            <h3>
                                Content Performance
                            </h3>
                        </div>
                    </div>

                    <div className="dashboard-performance-grid">

                        <div className="dashboard-performance-item">
                            <span className="performance-icon">
                                ◉
                            </span>

                            <strong>
                                {formatNumber(
                                    performance.totalViews
                                )}
                            </strong>

                            <span>
                                Total Views
                            </span>
                        </div>

                        <div className="dashboard-performance-item">
                            <span className="performance-icon">
                                ♡
                            </span>

                            <strong>
                                {formatNumber(
                                    performance.totalLikes
                                )}
                            </strong>

                            <span>
                                Total Likes
                            </span>
                        </div>

                        <div className="dashboard-performance-item">
                            <span className="performance-icon">
                                ↓
                            </span>

                            <strong>
                                {formatNumber(
                                    performance.totalDownloads
                                )}
                            </strong>

                            <span>
                                Downloads
                            </span>
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel">

                    <div className="dashboard-panel-header">
                        <div>
                            <div className="dashboard-eyebrow">
                                CONTENT MIX
                            </div>

                            <h3>
                                Categories
                            </h3>
                        </div>

                        <Link
                            to="/admin/categories"
                            className="dashboard-view-all"
                        >
                            Manage →
                        </Link>
                    </div>

                    <div className="dashboard-category-list">

                        {categoryStats.length ===
                            0 ? (
                            <div className="dashboard-empty">
                                No category data
                                available.
                            </div>
                        ) : (
                            categoryStats.map(
                                ([
                                    name,
                                    count,
                                ]) => (
                                    <div
                                        className="dashboard-category-item"
                                        key={
                                            name
                                        }
                                    >
                                        <div className="dashboard-category-label">
                                            <span>
                                                {
                                                    name
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    count
                                                }
                                            </strong>
                                        </div>

                                        <div className="dashboard-progress">
                                            <span
                                                style={{
                                                    width: `${Math.max(
                                                        8,
                                                        (count /
                                                            maxCategoryCount) *
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                </section>
            </div>

            {/* ==================================================
                USERS
            ================================================== */}

            <section className="dashboard-panel dashboard-users-panel">

                <div className="dashboard-panel-header">
                    <div>
                        <div className="dashboard-eyebrow">
                            USERS
                        </div>

                        <h3>
                            Recent Users
                        </h3>
                    </div>

                    <Link
                        to="/admin/users"
                        className="dashboard-view-all"
                    >
                        View All →
                    </Link>
                </div>

                <div className="dashboard-users-list">

                    {users.length ===
                        0 ? (
                        <div className="dashboard-empty">
                            No users found.
                        </div>
                    ) : (
                        [...users]
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    new Date(
                                        b.createdAt ||
                                        0
                                    ).getTime() -
                                    new Date(
                                        a.createdAt ||
                                        0
                                    ).getTime()
                            )
                            .slice(0, 5)
                            .map(
                                (
                                    user
                                ) => (
                                    <div
                                        className="dashboard-user-row"
                                        key={
                                            user.id
                                        }
                                    >
                                        <div className="dashboard-user-avatar">
                                            {(
                                                user.displayName ||
                                                user.email ||
                                                "U"
                                            )
                                                .charAt(
                                                    0
                                                )
                                                .toUpperCase()}
                                        </div>

                                        <div className="dashboard-user-info">
                                            <strong>
                                                {
                                                    user.displayName ||
                                                    "Unnamed User"
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    user.email
                                                }
                                            </span>
                                        </div>

                                        <div className="dashboard-user-role">
                                            {user.roles?.includes(
                                                "Admin"
                                            ) ? (
                                                <span className="role-admin">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="role-user">
                                                    User
                                                </span>
                                            )}
                                        </div>

                                        <div className="dashboard-user-date">
                                            {formatDate(
                                                user.createdAt
                                            )}
                                        </div>

                                        <div
                                            className={
                                                user.isActive ===
                                                    false
                                                    ? "dashboard-user-status inactive"
                                                    : "dashboard-user-status"
                                            }
                                        >
                                            <i />
                                            {user.isActive ===
                                                false
                                                ? "Inactive"
                                                : "Active"}
                                        </div>
                                    </div>
                                )
                            )
                    )}
                </div>
            </section>

            {/* ==================================================
                PLATFORM STATUS
            ================================================== */}

            <div className="dashboard-status-footer">

                <div className="dashboard-status-icon">
                    ⚡
                </div>

                <div>
                    <div className="dashboard-eyebrow">
                        PLATFORM STATUS
                    </div>

                    <strong>
                        Your admin panel is
                        running normally
                    </strong>

                    <p>
                        Keep your content
                        organized, monitor users
                        and continue publishing
                        new coloring pages.
                    </p>
                </div>

                <div className="dashboard-operational">
                    <span />
                    Operational
                </div>
            </div>

        </div>
    );
}