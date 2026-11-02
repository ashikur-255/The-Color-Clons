import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface ColoringPage {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    svgUrl: string;
    originalImageUrl?: string | null;
    thumbnailUrl?: string | null;
    categoryId: number;
    views: number;
    downloads: number;
    likes: number;
    rating: number;
    isPublished: boolean;
    publishedAt?: string | null;
}

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5100";

function getFullUrl(url?: string | null) {
    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ColoringPages() {
    const [pages, setPages] = useState<ColoringPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadPages();
    }, []);

    async function loadPages() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/coloringpages`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load coloring pages (${response.status}).`
                );
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setPages(data);
            } else {
                setPages([]);
            }
        } catch (err) {
            console.error("Coloring pages loading error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load coloring pages."
            );
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <main style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loadingCard}>
                        <div style={styles.spinner} />

                        <h2 style={styles.loadingTitle}>
                            Loading coloring pages...
                        </h2>

                        <p style={styles.loadingText}>
                            Please wait a moment.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.errorCard}>
                        <div style={styles.errorIcon}>
                            !
                        </div>

                        <h2 style={styles.errorTitle}>
                            Something went wrong
                        </h2>

                        <p style={styles.errorText}>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadPages}
                            style={styles.primaryButton}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={styles.page}>
            <div style={styles.container}>

                {/* HEADER */}

                <header style={styles.header}>
                    <div>
                        <div style={styles.eyebrow}>
                            THE COLOR CLONE
                        </div>

                        <h1 style={styles.title}>
                            Free Coloring Pages
                        </h1>

                        <p style={styles.subtitle}>
                            Discover fun printable coloring pages
                            for kids and families.
                        </p>
                    </div>
                </header>

                {/* PAGE COUNT */}

                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.sectionTitle}>
                            Coloring Pages
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            Choose a coloring page and start
                            coloring.
                        </p>
                    </div>

                    <div style={styles.countBadge}>
                        {pages.length} Pages
                    </div>
                </div>

                {/* EMPTY */}

                {pages.length === 0 && (
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>
                            🎨
                        </div>

                        <h3 style={styles.emptyTitle}>
                            No coloring pages yet
                        </h3>

                        <p style={styles.emptyText}>
                            New coloring pages will appear here.
                        </p>
                    </div>
                )}

                {/* GRID */}

                {pages.length > 0 && (
                    <div style={styles.grid}>
                        {pages.map((page) => (
                            <Link
                                key={page.id}
                                to={`/coloring/${page.slug}`}
                                style={styles.cardLink}
                            >
                                <article style={styles.card}>

                                    {/* IMAGE */}

                                    <div style={styles.imageBox}>
                                        {page.thumbnailUrl ||
                                            page.originalImageUrl ||
                                            page.svgUrl ? (
                                            <img
                                                src={getFullUrl(
                                                    page.thumbnailUrl ||
                                                    page.originalImageUrl ||
                                                    page.svgUrl
                                                )}
                                                alt={page.title}
                                                style={styles.image}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div style={styles.noImage}>
                                                🎨
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                ...styles.statusBadge,
                                                ...(page.isPublished
                                                    ? styles.publishedBadge
                                                    : styles.draftBadge),
                                            }}
                                        >
                                            <span
                                                style={
                                                    styles.statusDot
                                                }
                                            />

                                            {page.isPublished
                                                ? "Published"
                                                : "Draft"}
                                        </div>
                                    </div>

                                    {/* CONTENT */}

                                    <div style={styles.cardContent}>
                                        <h3 style={styles.cardTitle}>
                                            {page.title}
                                        </h3>

                                        {page.description && (
                                            <p
                                                style={
                                                    styles.cardDescription
                                                }
                                            >
                                                {page.description}
                                            </p>
                                        )}

                                        <div style={styles.stats}>
                                            <span>
                                                👁 {page.views}
                                            </span>

                                            <span>
                                                ❤️ {page.likes}
                                            </span>

                                            <span>
                                                ⬇ {page.downloads}
                                            </span>

                                            <span>
                                                ⭐{" "}
                                                {Number(
                                                    page.rating || 0
                                                ).toFixed(1)}
                                            </span>
                                        </div>

                                        <div
                                            style={
                                                styles.cardFooter
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.openButton
                                                }
                                            >
                                                Open Coloring Page
                                                →
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes coloringSpinner {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @media (max-width: 700px) {
                        .coloring-page-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (min-width: 701px) and (max-width: 1050px) {
                        .coloring-page-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        }
                    }
                `}
            </style>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background:
            "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "40px 20px 70px",
        fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        color: "#0f172a",
        boxSizing: "border-box",
    },

    container: {
        width: "100%",
        maxWidth: "1240px",
        margin: "0 auto",
    },

    header: {
        marginBottom: "45px",
    },

    eyebrow: {
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.14em",
        color: "#2563eb",
        marginBottom: "10px",
    },

    title: {
        margin: 0,
        fontSize: "clamp(34px, 5vw, 58px)",
        lineHeight: 1.05,
        fontWeight: 850,
        letterSpacing: "-0.04em",
        color: "#0f172a",
    },

    subtitle: {
        margin: "16px 0 0",
        maxWidth: "650px",
        fontSize: "17px",
        lineHeight: 1.7,
        color: "#64748b",
    },

    sectionHeader: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "22px",
    },

    sectionTitle: {
        margin: 0,
        fontSize: "30px",
        fontWeight: 800,
        letterSpacing: "-0.025em",
    },

    sectionSubtitle: {
        margin: "7px 0 0",
        color: "#64748b",
        fontSize: "14px",
    },

    countBadge: {
        flexShrink: 0,
        background: "#ffffff",
        border: "1px solid #dbe3ef",
        borderRadius: "999px",
        padding: "9px 15px",
        color: "#334155",
        fontSize: "13px",
        fontWeight: 700,
        boxShadow: "0 4px 15px rgba(15, 23, 42, 0.05)",
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "24px",
    },

    cardLink: {
        color: "inherit",
        textDecoration: "none",
        display: "block",
    },

    card: {
        background: "#ffffff",
        border: "1px solid #dbe3ef",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow:
            "0 8px 30px rgba(15, 23, 42, 0.06)",
        transition:
            "transform 180ms ease, box-shadow 180ms ease",
    },

    imageBox: {
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background:
            "linear-gradient(145deg, #f8fafc, #eef2f7)",
        overflow: "hidden",
    },

    image: {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        padding: "14px",
        boxSizing: "border-box",
    },

    noImage: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "50px",
        color: "#94a3b8",
    },

    statusBadge: {
        position: "absolute",
        top: "14px",
        right: "14px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        borderRadius: "999px",
        padding: "7px 11px",
        fontSize: "11px",
        fontWeight: 800,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,.7)",
    },

    publishedBadge: {
        background: "rgba(240, 253, 244, .94)",
        color: "#15803d",
    },

    draftBadge: {
        background: "rgba(254, 242, 242, .94)",
        color: "#dc2626",
    },

    statusDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "currentColor",
    },

    cardContent: {
        padding: "20px",
    },

    cardTitle: {
        margin: 0,
        fontSize: "20px",
        lineHeight: 1.25,
        fontWeight: 800,
        color: "#0f172a",
    },

    cardDescription: {
        margin: "10px 0 0",
        color: "#64748b",
        fontSize: "14px",
        lineHeight: 1.6,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },

    stats: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "17px",
        paddingTop: "15px",
        borderTop: "1px solid #edf1f6",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: 600,
    },

    cardFooter: {
        marginTop: "17px",
    },

    openButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 14px",
        borderRadius: "11px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: 800,
    },

    loadingCard: {
        minHeight: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        border: "1px solid #dbe3ef",
        borderRadius: "20px",
        boxShadow:
            "0 10px 40px rgba(15, 23, 42, 0.06)",
    },

    spinner: {
        width: "42px",
        height: "42px",
        border: "4px solid #dbeafe",
        borderTopColor: "#2563eb",
        borderRadius: "50%",
        animation:
            "coloringSpinner .8s linear infinite",
    },

    loadingTitle: {
        margin: "22px 0 5px",
        fontSize: "20px",
    },

    loadingText: {
        margin: 0,
        color: "#64748b",
    },

    errorCard: {
        maxWidth: "520px",
        margin: "80px auto",
        padding: "45px 30px",
        textAlign: "center",
        background: "#ffffff",
        border: "1px solid #fecaca",
        borderRadius: "20px",
        boxShadow:
            "0 10px 40px rgba(15, 23, 42, 0.06)",
    },

    errorIcon: {
        width: "50px",
        height: "50px",
        margin: "0 auto 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#fef2f2",
        color: "#dc2626",
        fontSize: "24px",
        fontWeight: 800,
    },

    errorTitle: {
        margin: 0,
        fontSize: "24px",
    },

    errorText: {
        color: "#64748b",
        lineHeight: 1.6,
    },

    primaryButton: {
        border: 0,
        borderRadius: "10px",
        background: "#2563eb",
        color: "#ffffff",
        padding: "11px 18px",
        fontWeight: 700,
        cursor: "pointer",
    },

    emptyCard: {
        padding: "70px 30px",
        textAlign: "center",
        background: "#ffffff",
        border: "1px solid #dbe3ef",
        borderRadius: "20px",
    },

    emptyIcon: {
        fontSize: "48px",
    },

    emptyTitle: {
        margin: "15px 0 8px",
        fontSize: "22px",
    },

    emptyText: {
        margin: 0,
        color: "#64748b",
    },
};