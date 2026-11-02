import { useEffect, useState } from "react";
import {
    Link,
    useSearchParams,
} from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ColoringCard from "../components/coloring/ColoringCard";

import apiClient from "../api/client";
import type { ColoringPage } from "../api/coloringPagesApi";

function SearchPage() {
    const [searchParams] = useSearchParams();

    const query =
        searchParams.get("q")?.trim() || "";

    const [pages, setPages] =
        useState<ColoringPage[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        searchPages();
    }, [query]);

    const searchPages = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await apiClient.get<ColoringPage[]>(
                    "/coloringpages"
                );

            const allPages =
                response.data || [];

            if (!query) {
                setPages([]);
                return;
            }

            const normalizedQuery =
                query.toLowerCase();

            const results =
                allPages.filter((page) => {

                    const title =
                        page.title?.toLowerCase() || "";

                    const slug =
                        page.slug?.toLowerCase() || "";

                    const description =
                        page.description?.toLowerCase() || "";

                    return (
                        title.includes(
                            normalizedQuery
                        ) ||
                        slug.includes(
                            normalizedQuery
                        ) ||
                        description.includes(
                            normalizedQuery
                        )
                    );
                });

            setPages(results);

        } catch (err) {
            console.error(
                "Search error:",
                err
            );

            setError(
                "Unable to complete the search. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="public-site">

            <Header />

            <main className="search-page">

                {/* =========================
                    SEARCH HERO
                ========================== */}

                <section className="search-hero">

                    <div className="search-hero-container">

                        <div className="search-breadcrumb">

                            <Link to="/">
                                Home
                            </Link>

                            <span>
                                /
                            </span>

                            <strong>
                                Search
                            </strong>

                        </div>

                        <span className="section-label">
                            FIND YOUR FAVORITE
                        </span>

                        <h1>
                            Search Coloring Pages
                        </h1>

                        <p>
                            Find the perfect coloring page
                            from our collection.
                        </p>

                    </div>

                </section>


                {/* =========================
                    RESULTS
                ========================== */}

                <section className="search-results">

                    {!query ? (

                        <div className="search-empty">

                            <div className="search-empty-icon">
                                🔍
                            </div>

                            <h2>
                                What would you like to color?
                            </h2>

                            <p>
                                Use the search box above to
                                find coloring pages.
                            </p>

                            <Link
                                to="/"
                                className="search-back-button"
                            >
                                ← Browse Coloring Pages
                            </Link>

                        </div>

                    ) : (

                        <>
                            <div className="search-results-header">

                                <div>

                                    <span className="section-label">
                                        SEARCH RESULTS
                                    </span>

                                    <h2>
                                        Results for
                                        <span>
                                            {" "}
                                            "{query}"
                                        </span>
                                    </h2>

                                    {!loading &&
                                        !error && (
                                            <p>
                                                {pages.length}{" "}
                                                {pages.length === 1
                                                    ? "coloring page"
                                                    : "coloring pages"}{" "}
                                                found
                                            </p>
                                        )}

                                </div>

                            </div>


                            {loading && (
                                <div className="loading-grid">

                                    {Array.from({
                                        length: 8,
                                    }).map(
                                        (_, index) => (
                                            <div
                                                className="skeleton-card"
                                                key={index}
                                            />
                                        )
                                    )}

                                </div>
                            )}


                            {!loading && error && (
                                <div className="search-error">

                                    <div>
                                        ⚠️
                                    </div>

                                    <h3>
                                        Search failed
                                    </h3>

                                    <p>
                                        {error}
                                    </p>

                                    <button
                                        onClick={
                                            searchPages
                                        }
                                    >
                                        Try Again
                                    </button>

                                </div>
                            )}


                            {!loading &&
                                !error &&
                                pages.length > 0 && (

                                    <div className="coloring-grid">

                                        {pages.map(
                                            (page) => (
                                                <ColoringCard
                                                    key={
                                                        page.id
                                                    }
                                                    page={
                                                        page
                                                    }
                                                />
                                            )
                                        )}

                                    </div>
                                )}


                            {!loading &&
                                !error &&
                                pages.length === 0 && (

                                    <div className="search-empty">

                                        <div className="search-empty-icon">
                                            🎨
                                        </div>

                                        <h2>
                                            No coloring pages found
                                        </h2>

                                        <p>
                                            We could not find
                                            any coloring pages
                                            matching
                                            <strong>
                                                {" "}
                                                "{query}"
                                            </strong>
                                            .
                                        </p>

                                        <Link
                                            to="/"
                                            className="search-back-button"
                                        >
                                            Explore All Coloring Pages
                                        </Link>

                                    </div>
                                )}

                        </>
                    )}

                </section>

            </main>

            <Footer />

        </div>
    );
}

export default SearchPage;