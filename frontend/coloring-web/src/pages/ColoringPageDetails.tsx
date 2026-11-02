import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SvgColoringCanvas from "../components/coloring/SvgColoringCanvas";

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

const API_BASE_URL = "http://localhost:5100";

function ColoringPageDetails() {
    const { slug } = useParams<{ slug: string }>();

    const [page, setPage] =
        useState<ColoringPage | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        if (!slug) {
            return;
        }

        loadColoringPage(slug);
    }, [slug]);

    async function loadColoringPage(
        pageSlug: string
    ) {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/ColoringPages/slug/${encodeURIComponent(
                    pageSlug
                )}`
            );

            if (!response.ok) {
                throw new Error(
                    "Coloring page not found."
                );
            }

            const data: ColoringPage =
                await response.json();

            setPage(data);
        } catch (err) {
            console.error(
                "Failed to load coloring page:",
                err
            );

            setError(
                "Failed to load coloring page."
            );
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily:
                        "Arial, sans-serif",
                    color: "#6b7280",
                }}
            >
                Loading coloring page...
            </div>
        );
    }

    if (error || !page) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#f8fafc",
                    padding: "40px 20px",
                    fontFamily:
                        "Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                    }}
                >
                    <Link
                        to="/"
                        style={{
                            color: "#2563eb",
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        ← Back to Coloring Pages
                    </Link>

                    <h2
                        style={{
                            marginTop: "30px",
                            color: "#111827",
                        }}
                    >
                        {error ||
                            "Coloring page not found."}
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f8fafc",
                padding:
                    "30px 20px 60px",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >
                {/* =========================
                    BACK LINK
                ========================== */}
                <Link
                    to="/"
                    style={{
                        display: "inline-block",
                        marginBottom: "20px",
                        color: "#2563eb",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ← Back to Coloring Pages
                </Link>

                {/* =========================
                    MAIN CARD
                ========================== */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        border:
                            "1px solid #e5e7eb",
                        padding: "30px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.04)",
                    }}
                >
                    {/* =========================
                        TITLE
                    ========================== */}
                    <div
                        style={{
                            marginBottom: "25px",
                        }}
                    >
                        <h1
                            style={{
                                margin:
                                    "0 0 10px",
                                fontSize:
                                    "clamp(28px, 4vw, 40px)",
                                lineHeight: 1.2,
                                color: "#111827",
                            }}
                        >
                            {page.title}
                        </h1>

                        {page.description && (
                            <p
                                style={{
                                    margin: 0,
                                    color: "#6b7280",
                                    fontSize: "17px",
                                    lineHeight: 1.6,
                                }}
                            >
                                {
                                    page.description
                                }
                            </p>
                        )}
                    </div>

                    {/* =========================
                        COLORING AREA
                    ========================== */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "minmax(0, 1fr) 280px",
                            gap: "25px",
                            alignItems: "start",
                        }}
                    >
                        {/* SVG EDITOR */}
                        <div
                            style={{
                                minWidth: 0,
                            }}
                        >
                            <SvgColoringCanvas
                                svgUrl={
                                    page.svgUrl
                                }
                            />
                        </div>

                        {/* SIDEBAR */}
                        <aside
                            style={{
                                backgroundColor:
                                    "#f9fafb",
                                border:
                                    "1px solid #e5e7eb",
                                borderRadius:
                                    "14px",
                                padding: "20px",
                            }}
                        >
                            <h2
                                style={{
                                    margin:
                                        "0 0 12px",
                                    fontSize:
                                        "21px",
                                    color: "#111827",
                                }}
                            >
                                Coloring Tools
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0 0 18px",
                                    color: "#6b7280",
                                    lineHeight: 1.6,
                                    fontSize:
                                        "14px",
                                }}
                            >
                                Choose a color
                                and click any
                                part of the
                                image to color
                                it.
                            </p>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        borderRadius:
                                            "9px",
                                        backgroundColor:
                                            "#ffffff",
                                        border:
                                            "1px solid #e5e7eb",
                                        fontSize:
                                            "14px",
                                        color: "#4b5563",
                                    }}
                                >
                                    🎨 Select a
                                    color
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        borderRadius:
                                            "9px",
                                        backgroundColor:
                                            "#ffffff",
                                        border:
                                            "1px solid #e5e7eb",
                                        fontSize:
                                            "14px",
                                        color: "#4b5563",
                                    }}
                                >
                                    🖱️ Click an
                                    area
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        borderRadius:
                                            "9px",
                                        backgroundColor:
                                            "#ffffff",
                                        border:
                                            "1px solid #e5e7eb",
                                        fontSize:
                                            "14px",
                                        color: "#4b5563",
                                    }}
                                >
                                    ↶ Undo / ↷
                                    Redo
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        borderRadius:
                                            "9px",
                                        backgroundColor:
                                            "#ffffff",
                                        border:
                                            "1px solid #e5e7eb",
                                        fontSize:
                                            "14px",
                                        color: "#4b5563",
                                    }}
                                >
                                    📥 Download
                                    your artwork
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* =========================
                        STATS
                    ========================== */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "25px",
                            marginTop: "30px",
                            paddingTop: "20px",
                            borderTop:
                                "1px solid #e5e7eb",
                            color: "#6b7280",
                            fontSize: "14px",
                        }}
                    >
                        <span>
                            👁️ {page.views} views
                        </span>

                        <span>
                            ❤️ {page.likes} likes
                        </span>

                        <span>
                            ⬇️{" "}
                            {page.downloads}{" "}
                            downloads
                        </span>

                        <span>
                            ⭐{" "}
                            {page.rating || 0}
                        </span>

                        <span
                            style={{
                                color: page.isPublished
                                    ? "#16a34a"
                                    : "#dc2626",
                                fontWeight: 600,
                            }}
                        >
                            {page.isPublished
                                ? "Published"
                                : "Draft"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ColoringPageDetails;