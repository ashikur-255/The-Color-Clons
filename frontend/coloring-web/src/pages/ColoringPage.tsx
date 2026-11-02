import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5100";

/* =========================================================
   TYPES
========================================================= */

interface ColoringPageData {
    id: number;
    title: string;
    slug: string;
    description?: string | null;

    svgUrl: string;
    thumbnailUrl?: string | null;
    originalImageUrl?: string | null;

    categoryId?: number | null;

    views: number;
    downloads: number;
    likes: number;
    rating: number;

    isPublished: boolean;
}

interface CategoryData {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    isActive: boolean;
}

/* =========================================================
   COLORS
========================================================= */

const COLORS = [
    "#000000", "#FFFFFF", "#EF4444", "#F97316", "#F59E0B",
    "#EAB308", "#84CC16", "#22C55E", "#10B981", "#06B6D4",
    "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
    "#EC4899", "#F43F5E", "#78350F", "#6B7280", "#D1D5DB",
];

const DRAWABLE_SELECTOR = "path, circle, ellipse, rect, polygon, polyline";

/* =========================================================
   URL HELPER
========================================================= */

function getFullUrl(url?: string | null): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        notation: value >= 1000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    }).format(value || 0);
}

/* =========================================================
   META TAG
========================================================= */

function ensureMetaTag(name: string, content: string) {
    let element = document.querySelector(
        `meta[name="${name}"]`,
    ) as HTMLMetaElement | null;

    if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.appendChild(element);
    }

    element.content = content;
}

/* =========================================================
   SVG NORMALIZER
========================================================= */

function normalizeSvg(svgText: string): string {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(svgText, "image/svg+xml");

    const parserError = documentNode.querySelector("parsererror");
    if (parserError) {
        throw new Error("Invalid SVG file.");
    }

    const svg = documentNode.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== "svg") {
        throw new Error("Invalid SVG root element.");
    }

    // Remove dangerous elements
    documentNode
        .querySelectorAll("script, iframe, object, embed, foreignObject")
        .forEach((element) => element.remove());

    // Remove event attributes
    documentNode.querySelectorAll("*").forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
            if (attribute.name.toLowerCase().startsWith("on")) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    // Get existing dimensions
    const existingViewBox = svg.getAttribute("viewBox");
    const widthAttribute = svg.getAttribute("width");
    const heightAttribute = svg.getAttribute("height");

    // Create viewBox when missing
    if (!existingViewBox) {
        const width = parseFloat(widthAttribute || "");
        const height = parseFloat(heightAttribute || "");

        if (
            Number.isFinite(width) && width > 0 &&
            Number.isFinite(height) && height > 0
        ) {
            svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        } else {
            svg.setAttribute("viewBox", "0 0 1000 1000");
        }
    }

    // Force responsive SVG
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    svg.style.display = "block";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "100%";
    svg.style.visibility = "visible";
    svg.style.opacity = "1";

    // Make artwork visible
    documentNode.querySelectorAll(DRAWABLE_SELECTOR).forEach((element) => {
        const svgElement = element as SVGElement;
        svgElement.style.visibility = "visible";
        svgElement.style.opacity = "1";
        svgElement.style.cursor = "pointer";
        svgElement.style.transition = "fill 120ms ease";
    });

    return new XMLSerializer().serializeToString(svg);
}

/* =========================================================
   RELATED SVG PREVIEW
========================================================= */

function RelatedSvgPreview({ svgUrl, title }: { svgUrl: string; title: string }) {
    const [svg, setSvg] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadPreview() {
            try {
                setLoading(true);
                setError(false);

                const fullUrl = getFullUrl(svgUrl);
                if (!fullUrl) throw new Error("SVG URL missing");

                const response = await fetch(fullUrl, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`SVG request failed: ${response.status}`);
                }

                const text = await response.text();
                if (!text.trim()) throw new Error("Empty SVG");

                const normalized = normalizeSvg(text);
                if (!cancelled) setSvg(normalized);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadPreview();

        return () => {
            cancelled = true;
        };
    }, [svgUrl]);

    if (loading) {
        return (
            <div className="related-preview-loader">
                <div className="mini-spinner" />
            </div>
        );
    }

    if (error || !svg) {
        return (
            <div className="related-placeholder">
                <span>🎨</span>
            </div>
        );
    }

    return (
        <div
            className="related-svg-preview"
            aria-label={title}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ColoringPage() {
    const { slug } = useParams<{ slug: string }>();

    const [page, setPage] = useState<ColoringPageData | null>(null);
    const [category, setCategory] = useState<CategoryData | null>(null);
    const [relatedPages, setRelatedPages] = useState<ColoringPageData[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [svgContent, setSvgContent] = useState("");
    const [svgLoading, setSvgLoading] = useState(true);
    const [svgError, setSvgError] = useState("");

    const [selectedColor, setSelectedColor] = useState("#EF4444");

    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [liked, setLiked] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [notice, setNotice] = useState("");

    const svgContainerRef = useRef<HTMLDivElement>(null);
    const originalSvgRef = useRef("");

    // Keeps the color-click handler stable across renders so the SVG
    // injection effect doesn't re-run (and re-inject innerHTML) on every click.
    const selectedColorRef = useRef(selectedColor);
    useEffect(() => {
        selectedColorRef.current = selectedColor;
    }, [selectedColor]);

    // Mirrors of history/historyIndex so undo/redo/click handlers always read
    // the latest value synchronously, without needing to be re-created when
    // the state changes (avoids stale-closure bugs).
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);

    // Monotonically increasing id for the "current" page load. Any async
    // work (page fetch, SVG fetch, view tracking, etc.) checks this before
    // applying its result, so a slow request for a page the user has since
    // navigated away from can never clobber the page they're now viewing.
    const activeRequestRef = useRef(0);

    /* =====================================================
       TOAST
    ===================================================== */

    const showNotice = useCallback((message: string) => {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 3500);
    }, []);

    /* =====================================================
       HISTORY HELPERS
    ===================================================== */

    const resetHistory = useCallback((svgMarkup: string) => {
        historyRef.current = [svgMarkup];
        historyIndexRef.current = 0;
        setHistory(historyRef.current);
        setHistoryIndex(0);
    }, []);

    const pushHistoryEntry = useCallback((svgMarkup: string) => {
        const baseHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        const nextHistory = [...baseHistory, svgMarkup];

        historyRef.current = nextHistory;
        historyIndexRef.current = nextHistory.length - 1;

        setHistory(nextHistory);
        setHistoryIndex(historyIndexRef.current);
    }, []);

    /* =====================================================
       LOAD SVG (race-safe: requestId must still be current)
    ===================================================== */

    const loadSvg = useCallback(async (svgUrl: string, requestId: number) => {
        if (requestId !== activeRequestRef.current) return;

        if (!svgUrl) {
            setSvgError("This coloring page does not have an SVG file.");
            setSvgLoading(false);
            return;
        }

        let timeoutId: number | undefined;

        try {
            setSvgLoading(true);
            setSvgError("");

            const fullUrl = getFullUrl(svgUrl);
            const controller = new AbortController();

            timeoutId = window.setTimeout(() => controller.abort(), 15000);

            const response = await fetch(fullUrl, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal,
            });

            if (requestId !== activeRequestRef.current) return;

            if (!response.ok) {
                throw new Error(`SVG request failed (${response.status}).`);
            }

            const text = await response.text();
            if (requestId !== activeRequestRef.current) return;

            if (!text.trim()) {
                throw new Error("SVG file is empty.");
            }

            if (!text.toLowerCase().includes("<svg")) {
                throw new Error("The requested file is not a valid SVG.");
            }

            const normalizedSvg = normalizeSvg(text);
            if (requestId !== activeRequestRef.current) return;

            originalSvgRef.current = normalizedSvg;
            setSvgContent(normalizedSvg);
            resetHistory(normalizedSvg);
        } catch (err) {
            if (requestId !== activeRequestRef.current) return;

            if (err instanceof DOMException && err.name === "AbortError") {
                setSvgError("The SVG file took too long to load.");
            } else if (err instanceof TypeError) {
                setSvgError(
                    "Unable to connect to the SVG file. Please make sure the backend is running.",
                );
            } else {
                setSvgError(
                    err instanceof Error ? err.message : "Failed to load coloring image.",
                );
            }
        } finally {
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
            if (requestId === activeRequestRef.current) setSvgLoading(false);
        }
    }, [resetHistory]);

    /* =====================================================
       LOAD PAGE (runs whenever the route slug changes)
    ===================================================== */

    useEffect(() => {
        if (!slug) {
            setError("Invalid coloring page URL.");
            setLoading(false);
            return;
        }

        // Invalidate any in-flight request from a previous slug and claim
        // this load as the current one.
        const requestId = ++activeRequestRef.current;

        // Synchronously clear everything from the previous page so the UI
        // never shows stale or mismatched content while the new page loads.
        setLoading(true);
        setError("");
        setSvgLoading(true);
        setSvgError("");
        setSvgContent("");
        setCategory(null);
        setRelatedPages([]);
        setLiked(false);
        setNotice("");
        originalSvgRef.current = "";
        historyRef.current = [];
        historyIndexRef.current = -1;
        setHistory([]);
        setHistoryIndex(-1);

        async function loadPage() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/coloringpages/slug/${encodeURIComponent(slug as string)}`,
                    { method: "GET", cache: "no-store" },
                );

                if (requestId !== activeRequestRef.current) return;

                if (!response.ok) {
                    throw new Error(`Coloring page not found (${response.status}).`);
                }

                const data: ColoringPageData = await response.json();
                if (requestId !== activeRequestRef.current) return;

                setPage(data);
                setRating(Math.round(Number(data.rating || 0)));
                setLoading(false);

                await loadSvg(data.svgUrl, requestId);
                if (requestId !== activeRequestRef.current) return;

                /* ---------------- View tracking ---------------- */
                try {
                    const viewResponse = await fetch(
                        `${API_BASE_URL}/api/coloringpages/${data.id}/view`,
                        { method: "POST" },
                    );

                    if (viewResponse.ok && requestId === activeRequestRef.current) {
                        setPage((current) =>
                            current ? { ...current, views: current.views + 1 } : current,
                        );
                    }
                } catch {
                    /* Do not break page */
                }

                /* ---------------- Category ---------------- */
                if (data.categoryId) {
                    try {
                        const categoryResponse = await fetch(`${API_BASE_URL}/api/categories`);

                        if (categoryResponse.ok) {
                            const categories: CategoryData[] = await categoryResponse.json();
                            const matched = categories.find((item) => item.id === data.categoryId);

                            if (matched && requestId === activeRequestRef.current) {
                                setCategory(matched);
                            }
                        }
                    } catch {
                        /* Optional */
                    }
                }

                /* ---------------- Related pages ---------------- */
                try {
                    const relatedResponse = await fetch(`${API_BASE_URL}/api/coloringpages`, {
                        method: "GET",
                        cache: "no-store",
                    });

                    if (relatedResponse.ok) {
                        const result = await relatedResponse.json();

                        const pages: ColoringPageData[] = Array.isArray(result)
                            ? result
                            : Array.isArray(result?.items)
                                ? result.items
                                : [];

                        const related = pages
                            .filter(
                                (item) =>
                                    item.id !== data.id &&
                                    item.isPublished !== false &&
                                    (!data.categoryId || item.categoryId === data.categoryId),
                            )
                            .slice(0, 4);

                        if (requestId === activeRequestRef.current) {
                            setRelatedPages(related);
                        }
                    }
                } catch {
                    /* Optional */
                }
            } catch (err) {
                if (requestId !== activeRequestRef.current) return;

                setError(err instanceof Error ? err.message : "Failed to load coloring page.");
                setLoading(false);
                setSvgLoading(false);
            }
        }

        loadPage();
    }, [slug, loadSvg]);

    /* =====================================================
       SEO
    ===================================================== */

    useEffect(() => {
        if (!page) return;

        document.title = `${page.title} Coloring Page | Free Printable Coloring Page`;

        const description =
            page.description?.trim() ||
            `Color ${page.title} online for free. Enjoy this printable coloring page with our easy-to-use digital coloring tool.`;

        ensureMetaTag("description", description.slice(0, 160));
        ensureMetaTag("robots", page.isPublished ? "index,follow" : "noindex,nofollow");

        return () => {
            document.title = "TheColorClone";
        };
    }, [page]);

    /* =====================================================
       SVG CLICK / COLOR
       Stable across renders — reads the live color via a ref instead of
       depending on `selectedColor`/`historyIndex` state, so it never forces
       the injection effect below to re-run and re-paint the whole SVG.
    ===================================================== */

    const handleSvgElementClick = useCallback(
        (event: Event) => {
            event.preventDefault();
            event.stopPropagation();

            const element = event.currentTarget as SVGElement | null;
            if (!element) return;

            const container = svgContainerRef.current;
            if (!container) return;

            const previousSvg = container.innerHTML;

            element.setAttribute("fill", selectedColorRef.current);
            element.style.fill = selectedColorRef.current;

            const newSvg = container.innerHTML;
            if (previousSvg === newSvg) return;

            pushHistoryEntry(newSvg);
            setSvgContent(newSvg);
        },
        [pushHistoryEntry],
    );

    /* =====================================================
       ATTACH SVG EVENTS
       Only runs when svgContent actually changes (initial load, undo,
       redo, reset) — not on every click.
    ===================================================== */

    useEffect(() => {
        if (!svgContent || !svgContainerRef.current) return;

        const container = svgContainerRef.current;
        container.innerHTML = svgContent;

        const svg = container.querySelector("svg");
        if (!svg) {
            setSvgError("Invalid SVG file.");
            return;
        }

        svg.style.display = "block";
        svg.style.visibility = "visible";
        svg.style.opacity = "1";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.maxWidth = "100%";
        svg.style.maxHeight = "100%";
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        const elements = svg.querySelectorAll(DRAWABLE_SELECTOR);

        elements.forEach((element) => {
            const svgElement = element as SVGElement;
            svgElement.style.cursor = "pointer";
            svgElement.style.visibility = "visible";
            svgElement.style.opacity = "1";
            svgElement.addEventListener("click", handleSvgElementClick);
        });

        return () => {
            elements.forEach((element) => {
                element.removeEventListener("click", handleSvgElementClick);
            });
        };
    }, [svgContent, handleSvgElementClick]);

    /* =====================================================
       UNDO / REDO / RESET
    ===================================================== */

    function undo() {
        if (historyIndexRef.current <= 0) return;

        const newIndex = historyIndexRef.current - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setSvgContent(historyRef.current[newIndex]);
    }

    function redo() {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;

        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setSvgContent(historyRef.current[newIndex]);
    }

    function resetArtwork() {
        if (!originalSvgRef.current) return;

        resetHistory(originalSvgRef.current);
        setSvgContent(originalSvgRef.current);
    }

    /* =====================================================
       LIKE
    ===================================================== */

    async function handleLike() {
        if (!page || liked) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/coloringpages/${page.id}/like`, {
                method: "POST",
            });

            if (!response.ok) {
                showNotice("Unable to like this page right now.");
                return;
            }

            setLiked(true);
            setPage((current) =>
                current ? { ...current, likes: current.likes + 1 } : current,
            );

            showNotice("Thanks! Your like has been added.");
        } catch {
            showNotice("Unable to like this page right now.");
        }
    }

    /* =====================================================
       DOWNLOAD
    ===================================================== */

    async function downloadArtwork() {
        if (!page || !svgContainerRef.current) return;

        try {
            setDownloadLoading(true);

            const svg = svgContainerRef.current.querySelector("svg");
            if (!svg) {
                throw new Error("Artwork is not ready.");
            }

            const clonedSvg = svg.cloneNode(true) as SVGElement;
            clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(clonedSvg);

            const blob = new Blob([svgString], {
                type: "image/svg+xml;charset=utf-8",
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${page.slug || "coloring-page"}.svg`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/coloringpages/${page.id}/download`,
                    { method: "POST" },
                );

                if (response.ok) {
                    setPage((current) =>
                        current ? { ...current, downloads: current.downloads + 1 } : current,
                    );
                }
            } catch {
                /* Tracking failure */
            }

            showNotice("Your colored artwork has been downloaded.");
        } catch {
            showNotice("Could not download the artwork. Please try again.");
        } finally {
            setDownloadLoading(false);
        }
    }

    /* =====================================================
       RATING
    ===================================================== */

    async function submitRating(value: number) {
        if (!page || ratingSubmitting) return;

        try {
            setRatingSubmitting(true);

            const response = await fetch(`${API_BASE_URL}/api/coloringpages/${page.id}/rating`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating: value }),
            });

            if (!response.ok) {
                showNotice("Unable to submit your rating.");
                return;
            }

            const data = await response.json();
            setRating(value);

            if (typeof data === "number") {
                setPage((current) => (current ? { ...current, rating: data } : current));
            }

            showNotice("Thanks for rating this coloring page!");
        } catch {
            showNotice("Unable to submit your rating.");
        } finally {
            setRatingSubmitting(false);
        }
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <>
                <Header />
                <main className="coloring-page-shell">
                    <div className="loading-card">
                        <div className="loading-spinner" />
                        <h2>Loading coloring page...</h2>
                        <p>Please wait a moment.</p>
                    </div>
                </main>
                <Footer />
                <PageStyles />
            </>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error || !page) {
        return (
            <>
                <Header />
                <main className="coloring-page-shell">
                    <div className="error-card">
                        <div className="error-icon">!</div>
                        <h2>Something went wrong</h2>
                        <p>{error || "Coloring page could not be loaded."}</p>
                        <Link to="/" className="primary-button">
                            ← Back to Coloring Pages
                        </Link>
                    </div>
                </main>
                <Footer />
                <PageStyles />
            </>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <>
            <Header />

            <main className="coloring-page-shell">
                <div className="detail-container">
                    {/* BREADCRUMB */}
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <span>/</span>

                        {category && (
                            <>
                                <Link to={`/category/${category.slug}`}>{category.name}</Link>
                                <span>/</span>
                            </>
                        )}

                        <span className="current">{page.title}</span>
                    </nav>

                    {/* HEADER */}
                    <header className="detail-header">
                        <div className="detail-header-content">
                            <div className="eyebrow">FREE COLORING PAGE</div>
                            <h1>{page.title}</h1>

                            {page.description && <p>{page.description}</p>}

                            <div className="page-meta">
                                {category && (
                                    <Link to={`/category/${category.slug}`} className="category-pill">
                                        {category.name}
                                    </Link>
                                )}
                                <span>Free to color</span>
                                <span>•</span>
                                <span>Printable SVG</span>
                            </div>
                        </div>

                        {page.isPublished && (
                            <div className="published-badge published">
                                <span />
                                Published
                            </div>
                        )}
                    </header>

                    {/* WORKSPACE */}
                    <section className="coloring-workspace">
                        {/* ARTWORK */}
                        <div className="artwork-panel">
                            <div className="artwork-header">
                                <div>
                                    <strong>Coloring Canvas</strong>
                                    <span>Choose a color and click an area of the artwork</span>
                                </div>
                                <span className="canvas-status">SVG</span>
                            </div>

                            <div className="artwork-stage">
                                {svgLoading && (
                                    <div className="svg-loader">
                                        <div className="loading-spinner" />
                                        <strong>Loading artwork...</strong>
                                        <span>Preparing your coloring canvas</span>
                                    </div>
                                )}

                                {!svgLoading && svgError && (
                                    <div className="svg-error">
                                        <div className="error-icon">!</div>
                                        <h3>Artwork could not be loaded</h3>
                                        <p>{svgError}</p>
                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={() => loadSvg(page.svgUrl, activeRequestRef.current)}
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                {!svgLoading && !svgError && (
                                    <div ref={svgContainerRef} className="svg-container" />
                                )}
                            </div>
                        </div>

                        {/* TOOLS */}
                        <aside className="tools-panel">
                            <div className="tools-heading">
                                <div className="tools-icon">🎨</div>
                                <div>
                                    <h2>Coloring Tools</h2>
                                    <p>Pick a color and click any area of the artwork.</p>
                                </div>
                            </div>

                            {/* COLORS */}
                            <div className="tool-group">
                                <div className="tool-title">Color Palette</div>

                                <div className="color-grid">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`color-button ${selectedColor === color ? "selected" : ""}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                            aria-label={`Select ${color}`}
                                        />
                                    ))}
                                </div>

                                <div className="selected-color">
                                    <span>Selected color</span>
                                    <div className="selected-color-value">
                                        <span
                                            className="selected-color-preview"
                                            style={{ backgroundColor: selectedColor }}
                                        />
                                        <code>{selectedColor}</code>
                                    </div>
                                </div>
                            </div>

                            {/* EDIT */}
                            <div className="tool-group">
                                <div className="tool-title">Edit</div>

                                <div className="action-grid">
                                    <button
                                        type="button"
                                        className="tool-button"
                                        onClick={undo}
                                        disabled={historyIndex <= 0}
                                    >
                                        ↶ Undo
                                    </button>

                                    <button
                                        type="button"
                                        className="tool-button"
                                        onClick={redo}
                                        disabled={historyIndex >= history.length - 1}
                                    >
                                        ↷ Redo
                                    </button>

                                    <button
                                        type="button"
                                        className="tool-button danger"
                                        onClick={resetArtwork}
                                        disabled={!originalSvgRef.current}
                                    >
                                        ⟳ Reset
                                    </button>
                                </div>
                            </div>

                            {/* DOWNLOAD */}
                            <div className="download-group">
                                <button
                                    type="button"
                                    className="download-button"
                                    onClick={downloadArtwork}
                                    disabled={svgLoading || !!svgError || downloadLoading}
                                >
                                    ↓ {downloadLoading ? "Preparing..." : "Download Artwork"}
                                </button>

                                <small>Download your colored artwork as an SVG file.</small>
                            </div>
                        </aside>
                    </section>

                    {/* STATS */}
                    <section className="stats-bar">
                        <div className="stat-item">
                            <span>👁</span>
                            <div>
                                <strong>{formatNumber(page.views)}</strong>
                                <small>Views</small>
                            </div>
                        </div>

                        <div className="stat-item">
                            <span>❤️</span>
                            <div>
                                <strong>{formatNumber(page.likes)}</strong>
                                <small>Likes</small>
                            </div>
                        </div>

                        <div className="stat-item">
                            <span>↓</span>
                            <div>
                                <strong>{formatNumber(page.downloads)}</strong>
                                <small>Downloads</small>
                            </div>
                        </div>

                        <div className="stat-item">
                            <span>⭐</span>
                            <div>
                                <strong>{Number(page.rating || 0).toFixed(1)}</strong>
                                <small>Rating</small>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={liked ? "like-button liked" : "like-button"}
                            onClick={handleLike}
                            disabled={liked}
                        >
                            {liked ? "❤️ Liked" : "♡ Like"}
                        </button>
                    </section>

                    {/* RATING */}
                    <section className="rating-card">
                        <div>
                            <span className="rating-eyebrow">SHARE YOUR FEEDBACK</span>
                            <h2>Rate this coloring page</h2>
                            <p>How would you rate this artwork?</p>
                        </div>

                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={value <= rating ? "active" : ""}
                                    onClick={() => submitRating(value)}
                                    disabled={ratingSubmitting}
                                    aria-label={`Rate ${value} stars`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* RELATED */}
                    {relatedPages.length > 0 && (
                        <section className="related-section">
                            <div className="section-heading">
                                <div>
                                    <span>KEEP EXPLORING</span>
                                    <h2>Related Coloring Pages</h2>
                                </div>

                                {category && (
                                    <Link to={`/category/${category.slug}`} className="view-all-link">
                                        View all →
                                    </Link>
                                )}
                            </div>

                            <div className="related-grid">
                                {relatedPages.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/coloring/${item.slug}`}
                                        className="related-card"
                                    >
                                        <div className="related-image">
                                            <RelatedSvgPreview svgUrl={item.svgUrl} title={item.title} />
                                        </div>

                                        <div className="related-content">
                                            <h3>{item.title}</h3>
                                            <span>Color online →</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <Footer />

            {notice && (
                <div className="toast-notice" role="status" aria-live="polite">
                    <span>✓</span>
                    {notice}
                </div>
            )}

            <PageStyles />
        </>
    );
}

/* =========================================================
   STYLES
========================================================= */

function PageStyles() {
    return (
        <style>
            {`
                .coloring-page-shell {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #f8fafc 0%, #eef3f8 100%);
                    padding: 28px 20px 70px;
                    color: #0f172a;
                    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .detail-container {
                    width: 100%;
                    max-width: 1240px;
                    margin: 0 auto;
                }

                .breadcrumb {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 22px;
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .breadcrumb a {
                    color: #64748b;
                    text-decoration: none;
                    font-weight: 700;
                }

                .breadcrumb a:hover {
                    color: #2563eb;
                }

                .breadcrumb .current {
                    max-width: 320px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #94a3b8;
                }

                .detail-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 25px;
                    margin-bottom: 24px;
                }

                .detail-header-content {
                    min-width: 0;
                }

                .eyebrow {
                    margin-bottom: 8px;
                    color: #2563eb;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: .16em;
                }

                .detail-header h1 {
                    margin: 0;
                    color: #0f172a;
                    font-size: clamp(32px, 5vw, 48px);
                    line-height: 1.05;
                    letter-spacing: -.045em;
                    font-weight: 850;
                }

                .detail-header p {
                    max-width: 760px;
                    margin: 12px 0 0;
                    color: #64748b;
                    font-size: 15px;
                    line-height: 1.7;
                }

                .page-meta {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 9px;
                    margin-top: 14px;
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 600;
                }

                .category-pill {
                    display: inline-flex;
                    align-items: center;
                    min-height: 27px;
                    padding: 0 10px;
                    border-radius: 999px;
                    background: #eff6ff;
                    color: #2563eb;
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 800;
                }

                .category-pill:hover {
                    background: #dbeafe;
                }

                .published-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                    padding: 8px 13px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                    border: 1px solid;
                }

                .published-badge span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .published {
                    color: #16a34a;
                    background: #f0fdf4;
                    border-color: #bbf7d0;
                }

                .coloring-workspace {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 300px;
                    gap: 18px;
                    align-items: stretch;
                }

                .artwork-panel,
                .tools-panel,
                .stats-bar,
                .rating-card {
                    background: #ffffff;
                    border: 1px solid #dbe3ef;
                    box-shadow: 0 8px 35px rgba(15, 23, 42, .055);
                }

                .artwork-panel {
                    min-width: 0;
                    border-radius: 18px;
                    overflow: hidden;
                }

                .artwork-header {
                    min-height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 13px 16px;
                    border-bottom: 1px solid #e8edf3;
                }

                .artwork-header strong {
                    display: block;
                    font-size: 13px;
                    font-weight: 800;
                }

                .artwork-header > div > span {
                    display: block;
                    margin-top: 3px;
                    color: #94a3b8;
                    font-size: 10px;
                }

                .artwork-header .canvas-status {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 34px;
                    height: 24px;
                    margin: 0;
                    padding: 0 8px;
                    border-radius: 999px;
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 9px;
                    font-weight: 800;
                }

                .artwork-stage {
                    position: relative;
                    min-height: 600px;
                    height: min(68vh, 720px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 22px;
                    background: radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%);
                    overflow: hidden;
                }

                .svg-container {
                    width: 100%;
                    height: 100%;
                    min-width: 0;
                    min-height: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .svg-container svg {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    object-fit: contain;
                }

                .svg-container svg path,
                .svg-container svg circle,
                .svg-container svg ellipse,
                .svg-container svg rect,
                .svg-container svg polygon,
                .svg-container svg polyline {
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .svg-loader,
                .svg-error {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .svg-loader strong {
                    margin-top: 16px;
                    font-size: 16px;
                }

                .svg-loader span {
                    margin-top: 5px;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .svg-error h3 {
                    margin: 15px 0 5px;
                    font-size: 16px;
                }

                .svg-error p {
                    max-width: 420px;
                    margin: 0 0 16px;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .tools-panel {
                    border-radius: 18px;
                    overflow: hidden;
                }

                .tools-heading {
                    display: flex;
                    gap: 12px;
                    padding: 17px;
                    border-bottom: 1px solid #e8edf3;
                }

                .tools-icon {
                    width: 34px;
                    height: 34px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #eff6ff;
                    font-size: 18px;
                }

                .tools-heading h2 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 850;
                }

                .tools-heading p {
                    margin: 4px 0 0;
                    color: #64748b;
                    font-size: 10px;
                    line-height: 1.5;
                }

                .tool-group {
                    padding: 17px;
                    border-bottom: 1px solid #e8edf3;
                }

                .tool-title {
                    margin-bottom: 11px;
                    font-size: 10px;
                    font-weight: 850;
                    color: #334155;
                }

                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 8px;
                }

                .color-button {
                    width: 100%;
                    aspect-ratio: 1;
                    padding: 0;
                    border-radius: 8px;
                    border: 2px solid rgba(15, 23, 42, .08);
                    cursor: pointer;
                    transition: transform .15s ease, box-shadow .15s ease;
                }

                .color-button:hover {
                    transform: translateY(-2px);
                }

                .color-button.selected {
                    box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2563eb;
                }

                .selected-color {
                    margin-top: 12px;
                    padding: 9px 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    border: 1px solid #dbe3ef;
                    border-radius: 9px;
                    background: #f8fafc;
                }

                .selected-color > span {
                    color: #64748b;
                    font-size: 9px;
                }

                .selected-color-value {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .selected-color-preview {
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    border: 1px solid rgba(15, 23, 42, .15);
                }

                .selected-color code {
                    font-size: 9px;
                    font-weight: 700;
                }

                .action-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .tool-button {
                    min-height: 35px;
                    border: 1px solid #dbe3ef;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #475569;
                    font-size: 10px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .tool-button:hover:not(:disabled) {
                    background: #f8fafc;
                }

                .tool-button:disabled {
                    opacity: .45;
                    cursor: not-allowed;
                }

                .tool-button.danger {
                    grid-column: 1 / -1;
                    color: #ef4444;
                }

                .download-group {
                    padding: 15px;
                }

                .download-button {
                    width: 100%;
                    min-height: 38px;
                    border: 0;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #2563eb, #6366f1);
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 850;
                    cursor: pointer;
                }

                .download-button:hover:not(:disabled) {
                    transform: translateY(-1px);
                }

                .download-button:disabled {
                    opacity: .5;
                    cursor: not-allowed;
                }

                .download-group small {
                    display: block;
                    margin-top: 8px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 9px;
                    line-height: 1.5;
                }

                .stats-bar {
                    display: flex;
                    align-items: center;
                    gap: 25px;
                    margin-top: 18px;
                    padding: 14px 16px;
                    border-radius: 15px;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 85px;
                }

                .stat-item > span {
                    font-size: 15px;
                }

                .stat-item strong {
                    display: block;
                    font-size: 14px;
                    line-height: 1;
                }

                .stat-item small {
                    display: block;
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 9px;
                }

                .like-button {
                    margin-left: auto;
                    min-height: 36px;
                    padding: 0 16px;
                    border: 1px solid #fecaca;
                    border-radius: 9px;
                    background: #fff;
                    color: #ef4444;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .like-button:hover:not(:disabled) {
                    background: #fff7f7;
                }

                .like-button.liked {
                    background: #fef2f2;
                }

                .like-button:disabled {
                    cursor: default;
                }

                .rating-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 25px;
                    margin-top: 18px;
                    padding: 20px;
                    border-radius: 15px;
                }

                .rating-eyebrow {
                    color: #2563eb;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: .13em;
                }

                .rating-card h2 {
                    margin: 7px 0 4px;
                    font-size: 16px;
                }

                .rating-card p {
                    margin: 0;
                    color: #64748b;
                    font-size: 11px;
                }

                .rating-stars {
                    display: flex;
                    gap: 6px;
                }

                .rating-stars button {
                    width: 34px;
                    height: 34px;
                    padding: 0;
                    border: 0;
                    border-radius: 8px;
                    background: #f1f5f9;
                    color: #cbd5e1;
                    font-size: 20px;
                    cursor: pointer;
                    transition: transform .15s ease, background .15s ease;
                }

                .rating-stars button:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                .rating-stars button:hover,
                .rating-stars button.active {
                    background: #fef3c7;
                    color: #f59e0b;
                }

                .related-section {
                    margin-top: 48px;
                }

                .section-heading {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 18px;
                }

                .section-heading > div > span {
                    color: #2563eb;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: .14em;
                }

                .section-heading h2 {
                    margin: 5px 0 0;
                    font-size: 25px;
                    letter-spacing: -.025em;
                }

                .view-all-link {
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 800;
                    text-decoration: none;
                }

                .view-all-link:hover {
                    text-decoration: underline;
                }

                .related-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
                }

                .related-card {
                    display: block;
                    overflow: hidden;
                    border: 1px solid #dbe3ef;
                    border-radius: 15px;
                    background: #ffffff;
                    color: inherit;
                    text-decoration: none;
                    box-shadow: 0 6px 24px rgba(15, 23, 42, .045);
                    transition: transform .18s ease, box-shadow .18s ease;
                }

                .related-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 14px 32px rgba(15, 23, 42, .09);
                }

                .related-image {
                    position: relative;
                    aspect-ratio: 1 / 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: #ffffff;
                    padding: 18px;
                }

                .related-svg-preview {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    pointer-events: none;
                }

                .related-svg-preview svg {
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .related-svg-preview svg * {
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .related-preview-loader {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mini-spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: coloringSpinner .8s linear infinite;
                }

                .related-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 35px;
                }

                .related-content {
                    padding: 13px;
                    border-top: 1px solid #eef2f7;
                }

                .related-content h3 {
                    margin: 0;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    color: #0f172a;
                    font-size: 13px;
                    line-height: 1.4;
                }

                .related-content span {
                    display: block;
                    margin-top: 8px;
                    color: #2563eb;
                    font-size: 10px;
                    font-weight: 800;
                }

                .loading-card,
                .error-card {
                    width: min(520px, 100%);
                    margin: 100px auto;
                    padding: 45px 25px;
                    text-align: center;
                    background: #fff;
                    border: 1px solid #dbe3ef;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(15, 23, 42, .06);
                }

                .error-card {
                    border-color: #fecaca;
                }

                .loading-card h2,
                .error-card h2 {
                    margin: 20px 0 6px;
                    font-size: 20px;
                }

                .error-card h2 {
                    margin-top: 15px;
                }

                .loading-card p,
                .error-card p {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .error-card p {
                    margin-bottom: 20px;
                }

                .error-icon {
                    width: 45px;
                    height: 45px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #fef2f2;
                    color: #ef4444;
                    font-size: 22px;
                    font-weight: 900;
                }

                .primary-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 38px;
                    padding: 0 17px;
                    border: 0;
                    border-radius: 9px;
                    background: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .primary-button:hover {
                    background: #1d4ed8;
                }

                .loading-spinner {
                    width: 42px;
                    height: 42px;
                    margin: 0 auto;
                    border: 4px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: coloringSpinner .8s linear infinite;
                }

                .toast-notice {
                    position: fixed;
                    right: 22px;
                    bottom: 22px;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    max-width: min(380px, calc(100vw - 30px));
                    padding: 12px 15px;
                    border: 1px solid #bbf7d0;
                    border-radius: 11px;
                    background: #f0fdf4;
                    color: #166534;
                    box-shadow: 0 15px 40px rgba(15, 23, 42, .14);
                    font-size: 12px;
                    font-weight: 700;
                }

                .toast-notice > span {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 21px;
                    height: 21px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: #22c55e;
                    color: #ffffff;
                    font-size: 11px;
                }

                @keyframes coloringSpinner {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1100px) {
                    .related-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 900px) {
                    .coloring-workspace {
                        grid-template-columns: 1fr;
                    }

                    .tools-panel {
                        order: 2;
                    }

                    .artwork-stage {
                        height: 65vw;
                        min-height: 450px;
                        max-height: 700px;
                    }
                }

                @media (max-width: 650px) {
                    .coloring-page-shell {
                        padding: 20px 12px 45px;
                    }

                    .breadcrumb {
                        margin-bottom: 18px;
                        font-size: 11px;
                    }

                    .detail-header {
                        flex-direction: column;
                    }

                    .published-badge {
                        align-self: flex-start;
                    }

                    .detail-header h1 {
                        font-size: 32px;
                    }

                    .detail-header p {
                        font-size: 14px;
                    }

                    .artwork-stage {
                        min-height: 330px;
                        height: 90vw;
                        padding: 12px;
                    }

                    .stats-bar {
                        flex-wrap: wrap;
                        gap: 15px;
                    }

                    .stat-item {
                        min-width: 70px;
                    }

                    .like-button {
                        width: 100%;
                        margin-left: 0;
                    }

                    .rating-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .rating-stars {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .rating-stars button {
                        flex: 1;
                    }

                    .section-heading {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .related-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }

                    .related-content {
                        padding: 10px;
                    }

                    .related-content h3 {
                        font-size: 11px;
                    }

                    .toast-notice {
                        right: 15px;
                        bottom: 15px;
                    }
                }

                @media (max-width: 420px) {
                    .related-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}
        </style>
    );
}