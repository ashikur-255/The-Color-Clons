import {
    useEffect,
    useMemo,
    useState,
} from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5100";

/* =========================================================
   TYPES
========================================================= */

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    imageUrl?: string | null;
    parentId?: number | null;
    sortOrder: number;
    isActive: boolean;
}

interface CategoryForm {
    name: string;
    slug: string;
    description: string;
}

const emptyForm: CategoryForm = {
    name: "",
    slug: "",
    description: "",
};

/* =========================================================
   JWT HELPERS
========================================================= */

function looksLikeJwt(value: string) {
    const cleaned = value
        .trim()
        .replace(/^Bearer\s+/i, "");

    const parts = cleaned.split(".");

    return (
        parts.length === 3 &&
        parts.every(
            (part) => part.trim().length > 0
        )
    );
}

function findJwtInValue(
    value: unknown,
    depth = 0
): string | null {
    if (
        depth > 4 ||
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (typeof value === "string") {
        const cleaned = value
            .trim()
            .replace(/^Bearer\s+/i, "");

        if (looksLikeJwt(cleaned)) {
            return cleaned;
        }

        try {
            const parsed = JSON.parse(cleaned);

            return findJwtInValue(
                parsed,
                depth + 1
            );
        } catch {
            return null;
        }
    }

    if (typeof value === "object") {
        const object =
            value as Record<string, unknown>;

        const priorityKeys = [
            "token",
            "accessToken",
            "access_token",
            "authToken",
            "jwt",
            "access",
            "jwtToken",
        ];

        for (const key of priorityKeys) {
            if (key in object) {
                const token =
                    findJwtInValue(
                        object[key],
                        depth + 1
                    );

                if (token) {
                    return token;
                }
            }
        }

        for (const key of Object.keys(object)) {
            const token =
                findJwtInValue(
                    object[key],
                    depth + 1
                );

            if (token) {
                return token;
            }
        }
    }

    return null;
}

function getToken() {
    const storages: Storage[] = [];

    try {
        storages.push(
            window.localStorage
        );
    } catch {
        // Ignore.
    }

    try {
        storages.push(
            window.sessionStorage
        );
    } catch {
        // Ignore.
    }

    const priorityKeys = [
        "token",
        "accessToken",
        "access_token",
        "authToken",
        "jwt",
        "jwtToken",
        "auth",
        "authentication",
        "user",
        "currentUser",
    ];

    for (const storage of storages) {
        for (const key of priorityKeys) {
            try {
                const value =
                    storage.getItem(key);

                if (!value) continue;

                const token =
                    findJwtInValue(value);

                if (token) return token;
            } catch {
                // Continue.
            }
        }

        try {
            for (
                let index = 0;
                index < storage.length;
                index++
            ) {
                const key =
                    storage.key(index);

                if (!key) continue;

                const value =
                    storage.getItem(key);

                if (!value) continue;

                const token =
                    findJwtInValue(value);

                if (token) return token;
            }
        } catch {
            // Continue.
        }
    }

    return null;
}

/* =========================================================
   API
========================================================= */

async function apiFetch(
    url: string,
    options: RequestInit = {}
) {
    const token = getToken();

    const headers = new Headers(
        options.headers
    );

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

async function getApiErrorMessage(
    response: Response,
    fallback: string
) {
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

        return (
            data?.message ||
            data?.title ||
            data?.error ||
            fallback
        );
    } catch {
        return text;
    }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminCategories() {
    const [categories, setCategories] =
        useState<Category[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingCategory, setEditingCategory] =
        useState<Category | null>(null);

    const [form, setForm] =
        useState<CategoryForm>(emptyForm);

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    const [deleteTarget, setDeleteTarget] =
        useState<Category | null>(null);

    /* =====================================================
       LOAD
    ===================================================== */

    const loadCategories = async (
        showRefresh = false
    ) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setSuccess("");

            const response = await apiFetch(
                `${API_BASE_URL}/api/categories`
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        "Failed to load categories."
                    )
                );
            }

            const data =
                await response.json();

            const normalized =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.items)
                        ? data.items
                        : [];

            setCategories(normalized);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load categories."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredCategories =
        useMemo(() => {
            const query =
                search.trim().toLowerCase();

            if (!query) {
                return categories;
            }

            return categories.filter(
                (category) =>
                    category.name
                        .toLowerCase()
                        .includes(query) ||
                    category.slug
                        .toLowerCase()
                        .includes(query) ||
                    (
                        category.description ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)
            );
        },
            [categories, search]);

    const activeCount =
        categories.filter(
            (category) =>
                category.isActive
        ).length;

    const inactiveCount =
        categories.length -
        activeCount;

    /* =====================================================
       MODALS
    ===================================================== */

    const openCreateModal = () => {
        setEditingCategory(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const openEditModal = (
        category: Category
    ) => {
        setEditingCategory(category);

        setForm({
            name: category.name || "",
            slug: category.slug || "",
            description:
                category.description || "",
        });

        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingCategory(null);
        setForm(emptyForm);
    };

    /* =====================================================
       FORM
    ===================================================== */

    const handleFormChange = (
        field: keyof CategoryForm,
        value: string
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    /* =====================================================
       CREATE / UPDATE
    ===================================================== */

    const handleSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        const name = form.name.trim();
        const slug = form.slug.trim();
        const description =
            form.description.trim();

        if (!name) {
            setError(
                "Category name is required."
            );
            return;
        }

        if (!slug) {
            setError(
                "Category slug is required."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const isEditing =
                editingCategory !== null;

            const endpoint = isEditing
                ? `${API_BASE_URL}/api/categories/${editingCategory.id}`
                : `${API_BASE_URL}/api/categories`;

            const response = await apiFetch(
                endpoint,
                {
                    method: isEditing
                        ? "PUT"
                        : "POST",
                    body: JSON.stringify({
                        name,
                        slug,
                        description:
                            description || null,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        isEditing
                            ? "Unable to update category."
                            : "Unable to create category."
                    )
                );
            }

            const savedCategory =
                await response.json();

            if (isEditing) {
                setCategories(
                    (current) =>
                        current.map(
                            (category) =>
                                category.id ===
                                    savedCategory.id
                                    ? savedCategory
                                    : category
                        )
                );

                setSuccess(
                    "Category updated successfully."
                );
            } else {
                setCategories(
                    (current) => [
                        ...current,
                        savedCategory,
                    ]
                );

                setSuccess(
                    "Category created successfully."
                );
            }

            setModalOpen(false);
            setEditingCategory(null);
            setForm(emptyForm);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save category."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (
        category: Category
    ) => {
        try {
            setDeletingId(category.id);
            setError("");
            setSuccess("");

            const response =
                await apiFetch(
                    `${API_BASE_URL}/api/categories/${category.id}`,
                    {
                        method: "DELETE",
                    }
                );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        "Unable to delete category."
                    )
                );
            }

            setCategories(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !==
                            category.id
                    )
            );

            setSuccess(
                `"${category.name}" deleted successfully.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Delete failed."
            );
        } finally {
            setDeletingId(null);
            setDeleteTarget(null);
        }
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="admin-page premium-admin-page">
                <div className="admin-premium-loading">
                    <div className="admin-loading-orb">
                        <span>🎨</span>
                    </div>

                    <h3>
                        Loading categories
                    </h3>

                    <p>
                        Preparing your category
                        workspace...
                    </p>

                    <div className="admin-loading-line">
                        <span />
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="admin-page premium-admin-page">

            {/* HERO */}

            <section className="categories-hero">
                <div className="categories-hero-left">

                    <div className="categories-breadcrumb">
                        <span>
                            Admin
                        </span>

                        <b>/</b>

                        <span className="current">
                            Categories
                        </span>
                    </div>

                    <div className="categories-eyebrow">
                        <span className="eyebrow-dot" />
                        CONTENT MANAGEMENT
                    </div>

                    <h2>
                        Category
                        <span> Workspace</span>
                    </h2>

                    <p>
                        Organize your coloring
                        library with clean,
                        structured categories.
                    </p>
                </div>

                <div className="categories-hero-actions">
                    <button
                        type="button"
                        className="categories-refresh-btn"
                        onClick={() =>
                            loadCategories(true)
                        }
                        disabled={refreshing}
                    >
                        <span
                            className={
                                refreshing
                                    ? "refresh-icon spinning"
                                    : "refresh-icon"
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Refreshing"
                            : "Refresh"}
                    </button>

                    <button
                        type="button"
                        className="categories-add-btn"
                        onClick={
                            openCreateModal
                        }
                    >
                        <span className="add-icon">
                            +
                        </span>

                        Add Category
                    </button>
                </div>
            </section>

            {/* STATS */}

            <section className="categories-stats">

                <div className="category-stat-card">
                    <div className="category-stat-icon purple">
                        <span>▦</span>
                    </div>

                    <div className="category-stat-content">
                        <span>
                            Total Categories
                        </span>

                        <strong>
                            {categories.length}
                        </strong>
                    </div>

                    <div className="category-stat-mini">
                        Library
                    </div>
                </div>

                <div className="category-stat-card">
                    <div className="category-stat-icon green">
                        <span>✓</span>
                    </div>

                    <div className="category-stat-content">
                        <span>
                            Active
                        </span>

                        <strong>
                            {activeCount}
                        </strong>
                    </div>

                    <div className="category-stat-mini green-text">
                        Live
                    </div>
                </div>

                <div className="category-stat-card">
                    <div className="category-stat-icon gray">
                        <span>○</span>
                    </div>

                    <div className="category-stat-content">
                        <span>
                            Inactive
                        </span>

                        <strong>
                            {inactiveCount}
                        </strong>
                    </div>

                    <div className="category-stat-mini">
                        Hidden
                    </div>
                </div>

            </section>

            {/* ALERTS */}

            {error && (
                <div className="premium-alert error">
                    <div className="premium-alert-icon">
                        !
                    </div>

                    <div>
                        <strong>
                            Something went wrong
                        </strong>

                        <p>{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="premium-alert success">
                    <div className="premium-alert-icon">
                        ✓
                    </div>

                    <div>
                        <strong>
                            Success
                        </strong>

                        <p>{success}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {/* MAIN CARD */}

            <section className="categories-content-card">

                <div className="categories-toolbar">

                    <div>
                        <h3>
                            All Categories
                        </h3>

                        <p>
                            Manage your available
                            content categories.
                        </p>
                    </div>

                    <div className="categories-toolbar-right">

                        <div className="categories-search">
                            <span className="search-symbol">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch(
                                            ""
                                        )
                                    }
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="category-result-count">
                            <strong>
                                {
                                    filteredCategories.length
                                }
                            </strong>

                            <span>
                                {search
                                    ? "results"
                                    : "categories"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TABLE */}

                {filteredCategories.length >
                    0 ? (
                    <div className="categories-table-scroll">
                        <table className="premium-category-table">
                            <thead>
                                <tr>
                                    <th>
                                        CATEGORY
                                    </th>

                                    <th>
                                        SLUG
                                    </th>

                                    <th>
                                        DESCRIPTION
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th className="actions-header">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredCategories.map(
                                    (
                                        category,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                category.id
                                            }
                                        >
                                            <td>
                                                <div className="premium-category-identity">

                                                    <div className="premium-category-number">
                                                        {String(
                                                            index +
                                                            1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </div>

                                                    <div className="premium-category-avatar">
                                                        {category.imageUrl ? (
                                                            <img
                                                                src={
                                                                    category.imageUrl
                                                                }
                                                                alt={
                                                                    category.name
                                                                }
                                                            />
                                                        ) : (
                                                            <span>
                                                                🎨
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="premium-category-info">
                                                        <strong>
                                                            {
                                                                category.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            Category
                                                            #
                                                            {
                                                                category.id
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="premium-slug">
                                                    /
                                                    {
                                                        category.slug
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <p className="premium-description">
                                                    {category.description ||
                                                        "No description has been added yet."}
                                                </p>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        category.isActive
                                                            ? "premium-status active"
                                                            : "premium-status inactive"
                                                    }
                                                >
                                                    <span className="status-dot" />

                                                    {category.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="premium-row-actions">

                                                    <button
                                                        type="button"
                                                        className="premium-edit-btn"
                                                        onClick={() =>
                                                            openEditModal(
                                                                category
                                                            )
                                                        }
                                                    >
                                                        <span>
                                                            ✎
                                                        </span>

                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="premium-delete-btn"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                category
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            category.id
                                                        }
                                                    >
                                                        <span>
                                                            ♢
                                                        </span>

                                                        Delete
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="premium-empty-state">
                        <div className="empty-illustration">
                            🎨
                        </div>

                        <h3>
                            No categories found
                        </h3>

                        <p>
                            {search
                                ? "No category matches your search."
                                : "Start building your category library by adding your first category."}
                        </p>

                        {search ? (
                            <button
                                type="button"
                                className="categories-refresh-btn"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                Clear Search
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="categories-add-btn"
                                onClick={
                                    openCreateModal
                                }
                            >
                                <span>
                                    +
                                </span>

                                Add First Category
                            </button>
                        )}
                    </div>
                )}

                {/* FOOTER */}

                {filteredCategories.length >
                    0 && (
                        <div className="premium-table-footer">
                            <span>
                                Showing{" "}
                                <strong>
                                    {
                                        filteredCategories.length
                                    }
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        categories.length
                                    }
                                </strong>{" "}
                                categories
                            </span>

                            <span>
                                {activeCount} active
                            </span>
                        </div>
                    )}
            </section>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {modalOpen && (
                <div
                    className="premium-modal-backdrop"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="premium-category-modal">

                        <div className="premium-modal-top">
                            <div className="modal-title-icon">
                                {editingCategory
                                    ? "✎"
                                    : "+"}
                            </div>

                            <div>
                                <span>
                                    CATEGORY
                                    MANAGEMENT
                                </span>

                                <h3>
                                    {editingCategory
                                        ? "Edit Category"
                                        : "Create Category"}
                                </h3>

                                <p>
                                    {editingCategory
                                        ? "Update the category details below."
                                        : "Create a new category for your coloring library."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="premium-modal-close"
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="premium-category-form"
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <div className="premium-form-grid">

                                <div className="premium-form-field full">
                                    <label htmlFor="category-name">
                                        Category Name
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="category-name"
                                        type="text"
                                        value={
                                            form.name
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleFormChange(
                                                "name",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="e.g. Animals"
                                        maxLength={
                                            150
                                        }
                                        autoFocus
                                        disabled={
                                            saving
                                        }
                                    />
                                </div>

                                <div className="premium-form-field full">
                                    <label htmlFor="category-slug">
                                        URL Slug
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="slug-input-wrapper">
                                        <span>
                                            /
                                        </span>

                                        <input
                                            id="category-slug"
                                            type="text"
                                            value={
                                                form.slug
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                handleFormChange(
                                                    "slug",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="animals"
                                            maxLength={
                                                150
                                            }
                                            disabled={
                                                saving
                                            }
                                        />
                                    </div>

                                    <small>
                                        This slug will
                                        be used for the
                                        public category
                                        URL.
                                    </small>
                                </div>

                                <div className="premium-form-field full">
                                    <label htmlFor="category-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="category-description"
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleFormChange(
                                                "description",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Write a short description for this category..."
                                        rows={5}
                                        maxLength={
                                            1000
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                    <div className="character-counter">
                                        {
                                            form
                                                .description
                                                .length
                                        }{" "}
                                        / 1000
                                    </div>
                                </div>
                            </div>

                            <div className="premium-form-actions">
                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <span className="button-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                ✓
                                            </span>

                                            {editingCategory
                                                ? "Update Category"
                                                : "Create Category"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                DELETE MODAL
            ================================================= */}

            {deleteTarget && (
                <div
                    className="premium-modal-backdrop"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            !deletingId
                        ) {
                            setDeleteTarget(
                                null
                            );
                        }
                    }}
                >
                    <div className="premium-delete-modal">

                        <div className="delete-warning-icon">
                            !
                        </div>

                        <div className="delete-modal-label">
                            DANGER ZONE
                        </div>

                        <h3>
                            Delete this category?
                        </h3>

                        <p>
                            You are about to
                            permanently delete{" "}
                            <strong>
                                "{deleteTarget.name}"
                            </strong>
                            .
                        </p>

                        <div className="delete-warning-box">
                            <span>
                                ⚠
                            </span>

                            <p>
                                This action cannot
                                be undone. If this
                                category is connected
                                to coloring pages,
                                the server may reject
                                the deletion.
                            </p>
                        </div>

                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                className="modal-cancel-btn"
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                                disabled={
                                    deletingId !==
                                    null
                                }
                            >
                                Keep Category
                            </button>

                            <button
                                type="button"
                                className="modal-confirm-delete"
                                onClick={() =>
                                    handleDelete(
                                        deleteTarget
                                    )
                                }
                                disabled={
                                    deletingId ===
                                    deleteTarget.id
                                }
                            >
                                {deletingId ===
                                    deleteTarget.id
                                    ? "Deleting..."
                                    : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}