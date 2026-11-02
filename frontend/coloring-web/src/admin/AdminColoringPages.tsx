import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
    FormEvent,
} from "react";

import { Link } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5100";

interface ColoringPage {
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
    publishedAt?: string | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
}

type StatusFilter =
    | "all"
    | "published"
    | "draft";

interface FormState {
    title: string;
    slug: string;
    description: string;
    categoryId: string;
    svgUrl: string;
    isPublished: boolean;
}

const EMPTY_FORM: FormState = {
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    svgUrl: "",
    isPublished: true,
};

const MAX_SVG_SIZE_BYTES = 5 * 1024 * 1024;

/* =========================================================
   URL
========================================================= */

function getFullUrl(url?: string | null) {
    if (!url) return "";

    const value = url.trim();
    if (!value) return "";

    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    return `${API_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

/* =========================================================
   NUMBER
========================================================= */

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        notation: value >= 1000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    }).format(value || 0);
}

function formatRating(value: number) {
    return Number(value || 0).toFixed(1);
}

/* =========================================================
   SLUG
========================================================= */

function createSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}

/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    const keys = [
        "thecolor_auth_token",
        "token",
        "accessToken",
        "access_token",
        "authToken",
        "jwt",
        "jwtToken",
    ];

    for (const key of keys) {
        try {
            const value = localStorage.getItem(key);
            if (value) {
                return value.replace(/^Bearer\s+/i, "");
            }
        } catch {
            // Ignore — localStorage may be unavailable (private mode, SSR).
        }
    }

    return null;
}

/* =========================================================
   API
========================================================= */

async function apiFetch(url: string, options: RequestInit = {}) {
    const token = getToken();
    const headers = new Headers(options.headers);

    if (options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
}

async function getApiErrorMessage(response: Response, fallback: string) {
    const text = await response.text();

    if (response.status === 401) {
        return "Your admin session is not authorized. Please log in again.";
    }

    if (response.status === 403) {
        return "You do not have permission to perform this action.";
    }

    if (!text) {
        return `${fallback} (${response.status})`;
    }

    try {
        const data = JSON.parse(text);
        return data?.message || data?.title || data?.error || fallback;
    } catch {
        return text;
    }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminColoringPages() {
    const [pages, setPages] = useState<ColoringPage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [actionId, setActionId] = useState<number | null>(null);

    // Add / Edit modal
    const [editingPage, setEditingPage] = useState<ColoringPage | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [slugEditedManually, setSlugEditedManually] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [svgPreview, setSvgPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState<ColoringPage | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Broken thumbnail tracking (so we fall back to a placeholder icon)
    const [brokenThumbIds, setBrokenThumbIds] = useState<Set<number>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const objectUrlRef = useRef<string | null>(null);

    const isBusy = saving || uploading;

    /* =====================================================
       LOAD
    ===================================================== */

    const loadData = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [pagesResponse, categoriesResponse] = await Promise.all([
                apiFetch(`${API_BASE_URL}/api/coloringpages/admin/all`),
                apiFetch(`${API_BASE_URL}/api/categories`),
            ]);

            if (!pagesResponse.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        pagesResponse,
                        "Failed to load coloring pages."
                    )
                );
            }

            const pagesData = await pagesResponse.json();
            const categoryData = categoriesResponse.ok
                ? await categoriesResponse.json()
                : [];

            const normalizedPages = Array.isArray(pagesData)
                ? pagesData
                : Array.isArray(pagesData?.items)
                    ? pagesData.items
                    : [];

            const normalizedCategories = Array.isArray(categoryData)
                ? categoryData
                : Array.isArray(categoryData?.items)
                    ? categoryData.items
                    : [];

            setPages(normalizedPages);
            setCategories(normalizedCategories);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load coloring pages."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-dismiss the success banner so it doesn't linger forever.
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => setSuccess(""), 5000);
        return () => clearTimeout(timer);
    }, [success]);

    // Clean up any object URL created for a local SVG preview.
    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    /* =====================================================
       CATEGORY MAP
    ===================================================== */

    const categoryMap = useMemo(() => {
        const map = new Map<number, string>();
        categories.forEach((category) => map.set(category.id, category.name));
        return map;
    }, [categories]);

    const activeCategories = useMemo(
        () => categories.filter((category) => category.isActive !== false),
        [categories]
    );

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredPages = useMemo(() => {
        const query = search.trim().toLowerCase();

        return pages.filter((page) => {
            const matchesSearch =
                !query ||
                page.title.toLowerCase().includes(query) ||
                page.slug.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "all"
                    ? true
                    : statusFilter === "published"
                        ? page.isPublished
                        : !page.isPublished;

            return matchesSearch && matchesStatus;
        });
    }, [pages, search, statusFilter]);

    /* =====================================================
       STATS
    ===================================================== */

    const totalPages = pages.length;
    const publishedPages = pages.filter((page) => page.isPublished).length;
    const draftPages = pages.filter((page) => !page.isPublished).length;
    const totalViews = pages.reduce(
        (sum, page) => sum + Number(page.views || 0),
        0
    );

    /* =====================================================
       FORM HELPERS
    ===================================================== */

    const clearLocalPreview = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    };

    const resetForm = () => {
        clearLocalPreview();

        setForm(EMPTY_FORM);
        setEditingPage(null);
        setSelectedFile(null);
        setSvgPreview("");
        setFieldErrors({});
        setSlugEditedManually(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openAddModal = () => {
        resetForm();
        setError("");
        setSuccess("");
        setIsFormOpen(true);
    };

    const openEditModal = (page: ColoringPage) => {
        setError("");
        setSuccess("");
        setEditingPage(page);
        setFieldErrors({});
        setSlugEditedManually(true); // never auto-overwrite an existing slug

        setForm({
            title: page.title || "",
            slug: page.slug || "",
            description: page.description || "",
            categoryId: page.categoryId ? String(page.categoryId) : "",
            svgUrl: page.svgUrl || "",
            isPublished: page.isPublished,
        });

        setSelectedFile(null);
        clearLocalPreview();
        setSvgPreview(page.svgUrl ? getFullUrl(page.svgUrl) : "");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setIsFormOpen(true);
    };

    const closeForm = () => {
        if (isBusy) return;
        setIsFormOpen(false);
        resetForm();
    };

    // Autofocus the title field whenever the modal opens.
    useEffect(() => {
        if (isFormOpen) {
            const id = window.setTimeout(() => titleInputRef.current?.focus(), 10);
            return () => window.clearTimeout(id);
        }
    }, [isFormOpen]);

    // Escape closes whichever modal is open (unless an action is in flight).
    useEffect(() => {
        if (!isFormOpen && !deleteTarget) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            if (deleteTarget) {
                if (!deletingId) setDeleteTarget(null);
                return;
            }

            if (isFormOpen && !isBusy) {
                closeForm();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFormOpen, deleteTarget, isBusy, deletingId]);

    // Lock page scroll while any modal is open.
    useEffect(() => {
        const anyModalOpen = isFormOpen || Boolean(deleteTarget);
        document.body.style.overflow = anyModalOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isFormOpen, deleteTarget]);

    /* =====================================================
       FORM INPUT
    ===================================================== */

    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const title = event.target.value;

        setForm((current) => ({
            ...current,
            title,
            slug: slugEditedManually ? current.slug : createSlug(title),
        }));

        setFieldErrors((current) => ({ ...current, title: "" }));
    };

    const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSlugEditedManually(true);
        setForm((current) => ({
            ...current,
            slug: createSlug(event.target.value),
        }));
        setFieldErrors((current) => ({ ...current, slug: "" }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isSvg =
            file.name.toLowerCase().endsWith(".svg") ||
            file.type === "image/svg+xml";

        if (!isSvg) {
            setError("Only SVG files are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_SVG_SIZE_BYTES) {
            setError("SVG file must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setError("");
        setFieldErrors((current) => ({ ...current, svg: "" }));
        setSelectedFile(file);

        clearLocalPreview();
        const localUrl = URL.createObjectURL(file);
        objectUrlRef.current = localUrl;
        setSvgPreview(localUrl);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        clearLocalPreview();

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setSvgPreview(
            editingPage?.svgUrl ? getFullUrl(editingPage.svgUrl) : ""
        );
    };

    /* =====================================================
       UPLOAD SVG
    ===================================================== */

    const uploadSvg = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiFetch(
            `${API_BASE_URL}/api/coloringpages/upload-svg`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(response, "SVG upload failed.")
            );
        }

        const data = await response.json();

        if (!data?.url) {
            throw new Error(
                "SVG upload succeeded but no file URL was returned."
            );
        }

        return data.url as string;
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!form.title.trim()) {
            errors.title = "Title is required.";
        }

        if (!form.slug.trim()) {
            errors.slug = "Slug is required.";
        }

        if (!form.categoryId) {
            errors.category = "Please select a category.";
        }

        if (!editingPage && !selectedFile && !form.svgUrl) {
            errors.svg = "Please upload an SVG artwork.";
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setError(Object.values(errors)[0]);
            return false;
        }

        return true;
    };

    /* =====================================================
       CREATE / UPDATE
    ===================================================== */

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!validateForm()) return;

        try {
            setSaving(true);

            let svgUrl = form.svgUrl;

            if (selectedFile) {
                setUploading(true);
                svgUrl = await uploadSvg(selectedFile);
                setUploading(false);
            }

            if (!svgUrl) {
                throw new Error("SVG artwork is required.");
            }

            const payload = {
                title: form.title.trim(),
                slug: createSlug(form.slug),
                description: form.description.trim() || null,
                categoryId: Number(form.categoryId),
                svgUrl,
            };

            const isEditing = Boolean(editingPage);

            const endpoint = isEditing
                ? `${API_BASE_URL}/api/coloringpages/${editingPage!.id}`
                : `${API_BASE_URL}/api/coloringpages`;

            const response = await apiFetch(endpoint, {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        isEditing
                            ? "Unable to update the coloring page."
                            : "Unable to create the coloring page."
                    )
                );
            }

            const savedPage = await response.json();

            // Publish immediately when requested and not already published.
            if (form.isPublished && !savedPage.isPublished) {
                const publishResponse = await apiFetch(
                    `${API_BASE_URL}/api/coloringpages/${savedPage.id}/publish`,
                    { method: "POST" }
                );

                if (!publishResponse.ok) {
                    throw new Error(
                        await getApiErrorMessage(
                            publishResponse,
                            "Page was saved, but publishing failed."
                        )
                    );
                }

                savedPage.isPublished = true;
            }

            // Switch an already-published page back to draft, if requested.
            if (isEditing && !form.isPublished && savedPage.isPublished) {
                const unpublishResponse = await apiFetch(
                    `${API_BASE_URL}/api/coloringpages/${savedPage.id}/unpublish`,
                    { method: "POST" }
                );

                if (!unpublishResponse.ok) {
                    throw new Error(
                        await getApiErrorMessage(
                            unpublishResponse,
                            "Page was updated, but unpublishing failed."
                        )
                    );
                }

                savedPage.isPublished = false;
            }

            setPages((current) => {
                if (isEditing) {
                    return current.map((item) =>
                        item.id === savedPage.id ? savedPage : item
                    );
                }
                return [savedPage, ...current];
            });

            setSuccess(
                isEditing
                    ? `"${savedPage.title}" has been updated successfully.`
                    : `"${savedPage.title}" has been created successfully.`
            );

            setIsFormOpen(false);
            resetForm();

            // Refresh in the background to pick up any server-computed fields.
            loadData(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save the coloring page."
            );
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    /* =====================================================
       PUBLISH / UNPUBLISH
    ===================================================== */

    const handlePublishToggle = async (page: ColoringPage) => {
        try {
            setActionId(page.id);
            setError("");
            setSuccess("");

            const endpoint = page.isPublished
                ? `${API_BASE_URL}/api/coloringpages/${page.id}/unpublish`
                : `${API_BASE_URL}/api/coloringpages/${page.id}/publish`;

            const response = await apiFetch(endpoint, { method: "POST" });

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        "Unable to update publication status."
                    )
                );
            }

            setPages((current) =>
                current.map((item) =>
                    item.id === page.id
                        ? { ...item, isPublished: !item.isPublished }
                        : item
                )
            );

            setSuccess(
                page.isPublished
                    ? `"${page.title}" has been unpublished successfully.`
                    : `"${page.title}" has been published successfully.`
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Publication action failed."
            );
        } finally {
            setActionId(null);
        }
    };

    /* =====================================================
       DELETE (styled confirmation modal, not window.confirm)
    ===================================================== */

    const requestDelete = (page: ColoringPage) => {
        setError("");
        setSuccess("");
        setDeleteTarget(page);
    };

    const cancelDelete = () => {
        if (deletingId) return;
        setDeleteTarget(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const page = deleteTarget;

        try {
            setDeletingId(page.id);
            setError("");
            setSuccess("");

            const response = await apiFetch(
                `${API_BASE_URL}/api/coloringpages/${page.id}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        "Unable to delete the coloring page."
                    )
                );
            }

            setPages((current) => current.filter((item) => item.id !== page.id));
            setSuccess(`"${page.title}" has been deleted successfully.`);
            setDeleteTarget(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed.");
        } finally {
            setDeletingId(null);
        }
    };

    /* =====================================================
       THUMBNAIL FALLBACK
    ===================================================== */

    const handleThumbError = (id: number) => {
        setBrokenThumbIds((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <div className="admin-eyebrow">CONTENT MANAGEMENT</div>
                        <h2>Coloring Pages</h2>
                        <p>
                            Manage, publish and organize your coloring page
                            library.
                        </p>
                    </div>
                </div>

                <div className="admin-loading-card">
                    <div className="admin-spinner" />
                    <strong>Loading coloring pages...</strong>
                    <span>Please wait a moment.</span>
                </div>
            </div>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="admin-page">
            {/* HEADER */}
            <div className="admin-page-header">
                <div>
                    <div className="admin-eyebrow">CONTENT MANAGEMENT</div>
                    <h2>Coloring Pages</h2>
                    <p>
                        Manage, publish and organize your coloring page
                        library.
                    </p>
                </div>

                <div className="admin-header-actions">
                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={openAddModal}
                    >
                        <span>+</span>
                        Add Coloring Page
                    </button>

                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                    >
                        <span>{refreshing ? "↻" : "⟳"}</span>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className="admin-alert admin-alert-error" role="alert">
                    <span className="admin-alert-icon">!</span>
                    <div>
                        <strong>Something went wrong</strong>
                        <p>{error}</p>
                    </div>
                    <button type="button" onClick={() => setError("")}>
                        ×
                    </button>
                </div>
            )}

            {/* SUCCESS */}
            {success && (
                <div className="admin-alert admin-alert-success" role="status">
                    <span className="admin-alert-icon">✓</span>
                    <div>
                        <strong>Success</strong>
                        <p>{success}</p>
                    </div>
                    <button type="button" onClick={() => setSuccess("")}>
                        ×
                    </button>
                </div>
            )}

            {/* STATS */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon purple">🎨</div>
                    <div>
                        <span>Total Pages</span>
                        <strong>{formatNumber(totalPages)}</strong>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-icon green">✓</div>
                    <div>
                        <span>Published</span>
                        <strong>{formatNumber(publishedPages)}</strong>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-icon amber">◷</div>
                    <div>
                        <span>Drafts</span>
                        <strong>{formatNumber(draftPages)}</strong>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-icon blue">👁</div>
                    <div>
                        <span>Total Views</span>
                        <strong>{formatNumber(totalViews)}</strong>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="admin-content-card">
                <div className="admin-toolbar">
                    <div className="admin-search-box">
                        <span>⌕</span>
                        <input
                            type="search"
                            placeholder="Search by title or slug..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search coloring pages"
                        />
                        {search && (
                            <button
                                type="button"
                                className="admin-search-clear"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="admin-filter-group">
                        <button
                            type="button"
                            className={
                                statusFilter === "all"
                                    ? "admin-filter active"
                                    : "admin-filter"
                            }
                            onClick={() => setStatusFilter("all")}
                        >
                            All
                            <span>{totalPages}</span>
                        </button>

                        <button
                            type="button"
                            className={
                                statusFilter === "published"
                                    ? "admin-filter active"
                                    : "admin-filter"
                            }
                            onClick={() => setStatusFilter("published")}
                        >
                            Published
                            <span>{publishedPages}</span>
                        </button>

                        <button
                            type="button"
                            className={
                                statusFilter === "draft"
                                    ? "admin-filter active"
                                    : "admin-filter"
                            }
                            onClick={() => setStatusFilter("draft")}
                        >
                            Drafts
                            <span>{draftPages}</span>
                        </button>
                    </div>
                </div>

                {filteredPages.length > 0 ? (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <colgroup>
                                <col className="col-page" />
                                <col className="col-category" />
                                <col className="col-status" />
                                <col className="col-performance" />
                                <col className="col-rating" />
                                <col className="col-actions" />
                            </colgroup>

                            <thead>
                                <tr>
                                    <th>Coloring Page</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Performance</th>
                                    <th>Rating</th>
                                    <th className="admin-table-action-heading">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPages.map((page) => {
                                    const imageUrl = getFullUrl(
                                        page.thumbnailUrl || page.svgUrl
                                    );
                                    const thumbFailed = brokenThumbIds.has(page.id);
                                    const isActionLoading = actionId === page.id;

                                    return (
                                        <tr key={page.id}>
                                            <td>
                                                <div className="admin-page-item">
                                                    <div
                                                        className={
                                                            thumbFailed
                                                                ? "admin-page-thumb image-failed"
                                                                : "admin-page-thumb"
                                                        }
                                                    >
                                                        {imageUrl && !thumbFailed ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={page.title}
                                                                loading="lazy"
                                                                onError={() =>
                                                                    handleThumbError(
                                                                        page.id
                                                                    )
                                                                }
                                                            />
                                                        ) : !thumbFailed ? (
                                                            <div className="admin-page-thumb-placeholder">
                                                                <span>🎨</span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="admin-page-info">
                                                        <strong title={page.title}>
                                                            {page.title}
                                                        </strong>
                                                        <span>
                                                            /coloring/{page.slug}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="admin-category-badge">
                                                    {categoryMap.get(
                                                        page.categoryId || 0
                                                    ) || "Uncategorized"}
                                                </span>
                                            </td>

                                            <td>
                                                {page.isPublished ? (
                                                    <span className="admin-status published">
                                                        <i />
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="admin-status draft">
                                                        <i />
                                                        Draft
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="admin-performance">
                                                    <span title="Views">
                                                        👁 {formatNumber(page.views)}
                                                    </span>
                                                    <span title="Likes">
                                                        ♥ {formatNumber(page.likes)}
                                                    </span>
                                                    <span title="Downloads">
                                                        ↓{" "}
                                                        {formatNumber(page.downloads)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-rating">
                                                    <span>★</span>
                                                    {formatRating(page.rating)}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-row-actions">
                                                    <Link
                                                        to={`/coloring/${page.slug}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="admin-action-button view"
                                                    >
                                                        <span>↗</span>
                                                        View
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        onClick={() =>
                                                            openEditModal(page)
                                                        }
                                                    >
                                                        <span>✎</span>
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={
                                                            page.isPublished
                                                                ? "admin-action-button unpublish"
                                                                : "admin-action-button publish"
                                                        }
                                                        disabled={isActionLoading}
                                                        onClick={() =>
                                                            handlePublishToggle(page)
                                                        }
                                                    >
                                                        {isActionLoading
                                                            ? "Working..."
                                                            : page.isPublished
                                                                ? "Unpublish"
                                                                : "Publish"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        onClick={() =>
                                                            requestDelete(page)
                                                        }
                                                    >
                                                        <span>🗑</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="admin-empty-state">
                        <div className="admin-empty-icon">🎨</div>
                        <h3>No coloring pages found</h3>
                        <p>
                            {search
                                ? "Try a different search term."
                                : statusFilter === "published"
                                    ? "There are no published coloring pages yet."
                                    : statusFilter === "draft"
                                        ? "There are no draft coloring pages."
                                        : "Your coloring page library is empty."}
                        </p>

                        {!search && statusFilter === "all" && (
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={openAddModal}
                            >
                                + Add First Coloring Page
                            </button>
                        )}
                    </div>
                )}

                {filteredPages.length > 0 && (
                    <div className="admin-table-footer">
                        <span>
                            Showing <strong>{filteredPages.length}</strong> of{" "}
                            <strong>{totalPages}</strong> coloring pages
                        </span>

                        <span>
                            {publishedPages} published{" · "}
                            {draftPages} drafts
                        </span>
                    </div>
                )}
            </div>

            {/* =====================================================
                ADD / EDIT MODAL
            ===================================================== */}

            {isFormOpen && (
                <div
                    className="admin-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >
                    <div
                        className="admin-form-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-form-title"
                    >
                        <div className="admin-form-header">
                            <div>
                                <div className="admin-eyebrow">
                                    CONTENT MANAGEMENT
                                </div>
                                <h3 id="admin-form-title">
                                    {editingPage
                                        ? "Edit Coloring Page"
                                        : "Add Coloring Page"}
                                </h3>
                                <p>
                                    {editingPage
                                        ? "Update your coloring page information and artwork."
                                        : "Create a new coloring page for your website."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="admin-form-close"
                                onClick={closeForm}
                                disabled={isBusy}
                                aria-label="Close dialog"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="admin-form-shell"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="admin-form-body">
                                {/* TITLE */}
                                <div className="admin-form-field">
                                    <label htmlFor="page-title">
                                        Title
                                        <span>*</span>
                                    </label>

                                    <input
                                        id="page-title"
                                        ref={titleInputRef}
                                        type="text"
                                        value={form.title}
                                        onChange={handleTitleChange}
                                        placeholder="Cute Lion Coloring Page"
                                        maxLength={180}
                                        aria-invalid={Boolean(fieldErrors.title)}
                                        disabled={isBusy}
                                    />
                                </div>

                                {/* SLUG */}
                                <div className="admin-form-field">
                                    <label htmlFor="page-slug">
                                        Slug
                                        <span>*</span>
                                    </label>

                                    <div className="admin-slug-input">
                                        <span>/coloring/</span>
                                        <input
                                            id="page-slug"
                                            type="text"
                                            value={form.slug}
                                            onChange={handleSlugChange}
                                            placeholder="cute-lion-coloring-page"
                                            aria-invalid={Boolean(fieldErrors.slug)}
                                            disabled={isBusy}
                                        />
                                    </div>

                                    <small className="admin-form-help">
                                        Auto-generated from the title. Edit it
                                        directly if you need a custom URL.
                                    </small>
                                </div>

                                {/* CATEGORY */}
                                <div className="admin-form-field">
                                    <label htmlFor="page-category">
                                        Category
                                        <span>*</span>
                                    </label>

                                    <select
                                        id="page-category"
                                        value={form.categoryId}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                categoryId: event.target.value,
                                            }))
                                        }
                                        aria-invalid={Boolean(fieldErrors.category)}
                                        disabled={isBusy}
                                    >
                                        <option value="">Select a category</option>
                                        {activeCategories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* DESCRIPTION */}
                                <div className="admin-form-field">
                                    <label htmlFor="page-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="page-description"
                                        value={form.description}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                description: event.target.value,
                                            }))
                                        }
                                        placeholder="Describe this coloring page..."
                                        rows={4}
                                        maxLength={1000}
                                        disabled={isBusy}
                                    />

                                    <small className="admin-form-help">
                                        {form.description.length}/1000 characters
                                    </small>
                                </div>

                                {/* SVG */}
                                <div className="admin-form-field">
                                    <label htmlFor="page-svg">
                                        SVG Artwork
                                        <span>*</span>
                                    </label>

                                    <input
                                        id="page-svg"
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".svg,image/svg+xml"
                                        onChange={handleFileChange}
                                        className="admin-file-input"
                                    />

                                    <button
                                        type="button"
                                        className="admin-upload-box"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={isBusy}
                                    >
                                        <div className="admin-upload-icon">↑</div>
                                        <strong>
                                            {selectedFile
                                                ? selectedFile.name
                                                : "Upload SVG artwork"}
                                        </strong>
                                        <span>
                                            Click to browse • SVG only • Max 5 MB
                                        </span>
                                    </button>

                                    {selectedFile && (
                                        <small className="admin-form-help">
                                            <button
                                                type="button"
                                                onClick={clearSelectedFile}
                                                disabled={isBusy}
                                                style={{
                                                    border: "none",
                                                    background: "none",
                                                    color: "#dc2626",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    font: "inherit",
                                                }}
                                            >
                                                Remove selected file
                                            </button>
                                        </small>
                                    )}

                                    {editingPage && !selectedFile && (
                                        <small className="admin-form-help">
                                            Leave the file empty to keep the
                                            current SVG artwork.
                                        </small>
                                    )}
                                </div>

                                {/* PREVIEW */}
                                <div className="admin-svg-preview-section">
                                    <div className="admin-form-preview-title">
                                        SVG Preview
                                    </div>

                                    <div className="admin-svg-preview">
                                        {svgPreview ? (
                                            <img
                                                src={svgPreview}
                                                alt="SVG preview"
                                            />
                                        ) : (
                                            <div className="admin-svg-preview-empty">
                                                <span>🖼</span>
                                                <p>No artwork uploaded yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PUBLISH */}
                                <label className="admin-publish-toggle">
                                    <input
                                        type="checkbox"
                                        checked={form.isPublished}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                isPublished: event.target.checked,
                                            }))
                                        }
                                        disabled={isBusy}
                                    />

                                    <span className="admin-toggle-track">
                                        <span />
                                    </span>

                                    <span className="admin-publish-copy">
                                        <strong>Publish immediately</strong>
                                        <small>
                                            Published pages can appear on the
                                            public website.
                                        </small>
                                    </span>
                                </label>
                            </div>

                            {/* FOOTER */}
                            <div className="admin-form-footer">
                                <button
                                    type="button"
                                    className="admin-modal-cancel"
                                    onClick={closeForm}
                                    disabled={isBusy}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-button"
                                    disabled={isBusy}
                                >
                                    {uploading
                                        ? "Uploading SVG..."
                                        : saving
                                            ? editingPage
                                                ? "Updating..."
                                                : "Creating..."
                                            : editingPage
                                                ? "Update Coloring Page"
                                                : "Create Coloring Page"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                DELETE CONFIRMATION MODAL
            ===================================================== */}

            {deleteTarget && (
                <div
                    className="admin-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            cancelDelete();
                        }
                    }}
                >
                    <div
                        className="admin-delete-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                    >
                        <div className="admin-delete-modal-icon">!</div>

                        <div className="admin-delete-modal-content">
                            <h3 id="delete-modal-title">
                                Delete this coloring page?
                            </h3>
                            <p>
                                <strong>"{deleteTarget.title}"</strong> will be
                                permanently removed, along with its stats and
                                public link.
                            </p>
                            <span>This action cannot be undone.</span>
                        </div>

                        <div className="admin-delete-modal-actions">
                            <button
                                type="button"
                                className="admin-modal-cancel"
                                onClick={cancelDelete}
                                disabled={Boolean(deletingId)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="admin-modal-delete"
                                onClick={confirmDelete}
                                disabled={Boolean(deletingId)}
                            >
                                {deletingId ? "Deleting..." : "Delete Page"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}