import { useEffect, useState } from "react";
import {
    Link,
    useParams,
} from "react-router-dom";

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
    seoTitle?: string | null;
    seoDescription?: string | null;
    imageUrl?: string | null;
    parentId?: number | null;
    sortOrder?: number;
    isActive?: boolean;
}

function CategoryPage() {
    const { slug } = useParams<{
        slug: string;
    }>();

    const [category, setCategory] =
        useState<Category | null>(null);

    const [pages, setPages] =
        useState<ColoringPage[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!slug) {
            setError("Category not found.");
            setLoading(false);
            return;
        }

        loadCategory();
    }, [slug]);

    const loadCategory = async () => {
        try {
            setLoading(true);
            setError("");

            /*
             * First get all categories.
             * We already know this endpoint works
             * because the homepage uses it.
             */
            const categoryResponse =
                await apiClient.get<Category[]>(
                    "/categories"
                );

            const categories =
                categoryResponse.data || [];

            const foundCategory =
                categories.find(
                    (item) =>
                        item.slug.toLowerCase() ===
                        slug!.toLowerCase()
                );

            if (!foundCategory) {
                setCategory(null);
                setPages([]);
                setError(
                    "The requested category could not be found."
                );
                return;
            }

            setCategory(foundCategory);

            /*
             * Now load coloring pages
             * belonging to this category.
             */
            const pagesResponse =
                await apiClient.get<ColoringPage[]>(
                    `/coloringpages/category/${foundCategory.id}`
                );

            setPages(
                pagesResponse.data || []
            );

        } catch (err) {
            console.error(
                "Category page error:",
                err
            );

            setError(
                "Unable to load this category. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="public-site">
                <Header />

                <main className="category-page">

                    <div className="category-page-container">

                        <div className="category-loading-header">
                            <div className="category-loading-title"></div>
                            <div className="category-loading-text"></div>
                        </div>

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

                    </div>

                </main>

                <Footer />
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="public-site">
                <Header />

                <main className="category-page">

                    <div className="category-error">

                        <div className="category-error-icon">
                            🎨
                        </div>

                        <h1>
                            Category Not Found
                        </h1>

                        <p>
                            {error ||
                                "This category does not exist."}
                        </p>

                        <Link
                            to="/"
                            className="category-back-button"
                        >
                            ← Back to Homepage
                        </Link>

                    </div>

                </main>

                <Footer />
            </div>
        );
    }

    return (
        <div className="public-site">

            <Header />

            <main className="category-page">

                {/* =========================
                    CATEGORY HERO
                ========================== */}

                <section className="category-hero">

                    <div className="category-hero-container">

                        <div className="category-breadcrumb">

                            <Link to="/">
                                Home
                            </Link>

                            <span>
                                /
                            </span>

                            <span>
                                Categories
                            </span>

                            <span>
                                /
                            </span>

                            <strong>
                                {category.name}
                            </strong>

                        </div>

                        <div className="category-hero-content">

                            <div>

                                <span className="section-label">
                                    COLORING CATEGORY
                                </span>

                                <h1>
                                    {category.name}
                                </h1>

                                <p>
                                    {category.description ||
                                        `Explore our collection of ${category.name.toLowerCase()} coloring pages and find something fun to color.`}
                                </p>

                            </div>

                            {category.imageUrl && (
                                <div className="category-hero-image">

                                    <img
                                        src={
                                            category.imageUrl
                                        }
                                        alt={
                                            category.name
                                        }
                                    />

                                </div>
                            )}

                        </div>

                    </div>

                </section>


                {/* =========================
                    COLORING PAGES
                ========================== */}

                <section className="category-results">

                    <div className="category-results-header">

                        <div>

                            <span className="section-label">
                                COLLECTION
                            </span>

                            <h2>
                                {category.name} Coloring Pages
                            </h2>

                            <p>
                                {pages.length}{" "}
                                {pages.length === 1
                                    ? "coloring page"
                                    : "coloring pages"}{" "}
                                available
                            </p>

                        </div>

                    </div>


                    {pages.length > 0 ? (
                        <div className="coloring-grid">

                            {pages.map((page) => (
                                <ColoringCard
                                    key={page.id}
                                    page={page}
                                />
                            ))}

                        </div>
                    ) : (
                        <div className="category-empty">

                            <div className="category-empty-icon">
                                🎨
                            </div>

                            <h3>
                                No Coloring Pages Yet
                            </h3>

                            <p>
                                We are adding more coloring
                                pages to this category.
                            </p>

                            <Link
                                to="/"
                                className="category-back-button"
                            >
                                Explore All Coloring Pages
                            </Link>

                        </div>
                    )}

                </section>

            </main>

            <Footer />

        </div>
    );
}

export default CategoryPage;