import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ColoringCard from "../components/coloring/ColoringCard";

import apiClient from "../api/client";
import type { ColoringPage } from "../api/coloringPagesApi";

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
}

function Home() {
    const [popularPages, setPopularPages] = useState<ColoringPage[]>([]);
    const [latestPages, setLatestPages] = useState<ColoringPage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchParams] = useSearchParams();
    const searchQuery =
        searchParams.get("search")?.trim() || "";

    useEffect(() => {
        loadHomepageData();
    }, []);

    const loadHomepageData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                popularResponse,
                latestResponse,
                categoriesResponse,
            ] = await Promise.all([
                apiClient.get<ColoringPage[]>(
                    "/coloringpages/popular?limit=8"
                ),

                apiClient.get<ColoringPage[]>(
                    "/coloringpages/latest?limit=8"
                ),

                apiClient.get<Category[]>(
                    "/categories"
                ),
            ]);

            setPopularPages(
                popularResponse.data || []
            );

            setLatestPages(
                latestResponse.data || []
            );

            setCategories(
                categoriesResponse.data || []
            );
        } catch (err) {
            console.error(
                "Homepage loading error:",
                err
            );

            setError(
                "Unable to load homepage data. Please make sure the API is running."
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredPopular = searchQuery
        ? popularPages.filter((page) =>
            page.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        )
        : popularPages;

    const filteredLatest = searchQuery
        ? latestPages.filter((page) =>
            page.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        )
        : latestPages;

    return (
        <div className="public-site">

            <Header />

            <main>

                {/* =========================
                    HERO
                ========================== */}

                <section className="hero-section">

                    <div className="hero-container">

                        <div className="hero-content">

                            <span className="hero-badge">
                                ✨ Free Coloring Pages
                            </span>

                            <h1>
                                Bring Your Imagination
                                <span> to Life With Color</span>
                            </h1>

                            <p>
                                Discover beautiful coloring pages
                                for kids and adults. Pick your favorite
                                design, choose your colors and start
                                creating.
                            </p>

                            <a
                                href="#popular"
                                className="hero-button"
                            >
                                Explore Coloring Pages
                                <span>→</span>
                            </a>

                        </div>

                        <div className="hero-visual">

                            <div className="hero-art-card">

                                <div className="hero-art-circle">
                                    🎨
                                </div>

                                <div className="hero-art-title">
                                    Color. Create. Enjoy.
                                </div>

                                <div className="hero-color-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =========================
                    SEARCH RESULT MESSAGE
                ========================== */}

                {searchQuery && (
                    <section className="search-result-banner">

                        <div>
                            Search results for:
                            <strong>
                                {" "}
                                "{searchQuery}"
                            </strong>
                        </div>

                        <Link to="/">
                            Clear Search
                        </Link>

                    </section>
                )}


                {/* =========================
                    ERROR
                ========================== */}

                {error && (
                    <section className="homepage-error">
                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <p>
                                {error}
                            </p>

                            <button
                                onClick={loadHomepageData}
                            >
                                Try Again
                            </button>
                        </div>
                    </section>
                )}


                {/* =========================
                    POPULAR
                ========================== */}

                <section
                    id="popular"
                    className="content-section"
                >

                    <div className="section-heading">

                        <div>
                            <span className="section-label">
                                MOST LOVED
                            </span>

                            <h2>
                                Popular Coloring Pages
                            </h2>

                            <p>
                                Explore the coloring pages
                                visitors love the most.
                            </p>
                        </div>

                    </div>

                    {loading ? (
                        <div className="loading-grid">
                            {Array.from({
                                length: 8,
                            }).map((_, index) => (
                                <div
                                    className="skeleton-card"
                                    key={index}
                                />
                            ))}
                        </div>
                    ) : filteredPopular.length > 0 ? (
                        <div className="coloring-grid">
                            {filteredPopular.map(
                                (page) => (
                                    <ColoringCard
                                        key={page.id}
                                        page={page}
                                    />
                                )
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            No coloring pages found.
                        </div>
                    )}

                </section>


                {/* =========================
                    CATEGORIES
                ========================== */}

                <section
                    id="categories"
                    className="categories-section"
                >

                    <div className="section-heading">

                        <div>
                            <span className="section-label">
                                EXPLORE
                            </span>

                            <h2>
                                Browse Categories
                            </h2>

                            <p>
                                Find the perfect coloring page
                                by category.
                            </p>
                        </div>

                    </div>

                    {loading ? (
                        <div className="category-grid">
                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <div
                                    className="category-skeleton"
                                    key={index}
                                />
                            ))}
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="category-grid">

                            {categories
                                .filter(
                                    (category) =>
                                        category.isActive !== false
                                )
                                .map((category) => (
                                    <Link
                                        key={category.id}
                                        to={`/category/${category.slug}`}
                                        className="category-card"
                                    >

                                        <div className="category-icon">
                                            {category.imageUrl ? (
                                                <img
                                                    src={
                                                        category.imageUrl
                                                    }
                                                    alt={
                                                        category.name
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : (
                                                "🎨"
                                            )}
                                        </div>

                                        <div>
                                            <h3>
                                                {category.name}
                                            </h3>

                                            {category.description && (
                                                <p>
                                                    {
                                                        category.description
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <span className="category-arrow">
                                            →
                                        </span>

                                    </Link>
                                ))}

                        </div>
                    ) : (
                        <div className="empty-state">
                            No categories available yet.
                        </div>
                    )}

                </section>


                {/* =========================
                    LATEST
                ========================== */}

                <section
                    id="latest"
                    className="content-section"
                >

                    <div className="section-heading">

                        <div>
                            <span className="section-label">
                                JUST ADDED
                            </span>

                            <h2>
                                Latest Coloring Pages
                            </h2>

                            <p>
                                Check out the newest coloring
                                pages added to our collection.
                            </p>
                        </div>

                    </div>

                    {loading ? (
                        <div className="loading-grid">
                            {Array.from({
                                length: 8,
                            }).map((_, index) => (
                                <div
                                    className="skeleton-card"
                                    key={index}
                                />
                            ))}
                        </div>
                    ) : filteredLatest.length > 0 ? (
                        <div className="coloring-grid">
                            {filteredLatest.map(
                                (page) => (
                                    <ColoringCard
                                        key={page.id}
                                        page={page}
                                    />
                                )
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            No latest coloring pages found.
                        </div>
                    )}

                </section>


                {/* =========================
                    CTA
                ========================== */}

                <section className="cta-section">

                    <div className="cta-content">

                        <span>
                            🎨 Ready to create?
                        </span>

                        <h2>
                            Start Coloring Something
                            Amazing Today
                        </h2>

                        <p>
                            Choose a coloring page and let
                            your creativity take over.
                        </p>

                        <a
                            href="#popular"
                            className="cta-button"
                        >
                            Start Coloring →
                        </a>

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
}

export default Home;