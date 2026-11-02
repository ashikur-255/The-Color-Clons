import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

import "./Account.css";

const PROFILE_PHOTO_PREFIX =
    "thecolor_profile_photo_";

const MAX_PHOTO_SIZE =
    2 * 1024 * 1024; // 2MB

export default function Account() {
    const {
        user,
        logout,
    } = useAuth();

    const navigate =
        useNavigate();

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const [profilePhoto, setProfilePhoto] =
        useState<string>("");

    const [photoError, setPhotoError] =
        useState("");

    /*
     * ---------------------------------------------------------
     * Restore saved profile photo
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!user) {
            setProfilePhoto("");
            return;
        }

        try {
            const savedPhoto =
                localStorage.getItem(
                    `${PROFILE_PHOTO_PREFIX}${user.userId}`
                );

            setProfilePhoto(
                savedPhoto || ""
            );
        } catch {
            setProfilePhoto("");
        }
    }, [user]);

    /*
     * ---------------------------------------------------------
     * Auth
     * ---------------------------------------------------------
     */

    if (!user) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="account-empty">
                        <div className="account-empty-icon">
                            🔐
                        </div>

                        <h1>
                            Login Required
                        </h1>

                        <p>
                            Please sign in to access
                            your account.
                        </p>

                        <Link
                            to="/login"
                            className="account-primary-button"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * Role
     * ---------------------------------------------------------
     */

    const roles = user.roles ?? [];

    const isAdmin =
        roles.some(
            (role: unknown) =>
                String(role).toLowerCase() ===
                "admin"
        );

    /*
     * ---------------------------------------------------------
     * User information
     * ---------------------------------------------------------
     */

    const firstLetter =
        user.displayName
            ?.charAt(0)
            ?.toUpperCase() || "U";

    const accountType =
        isAdmin
            ? "Admin"
            : "Member";

    /*
     * ---------------------------------------------------------
     * Logout
     * ---------------------------------------------------------
     */

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    /*
     * ---------------------------------------------------------
     * Open file picker
     * ---------------------------------------------------------
     */

    const handleChangePhotoClick =
        () => {
            setPhotoError("");

            fileInputRef.current?.click();
        };

    /*
     * ---------------------------------------------------------
     * Upload profile photo
     *
     * Current implementation stores the image
     * in browser localStorage.
     *
     * This keeps the feature functional without
     * changing the current backend architecture.
     * ---------------------------------------------------------
     */

    const handlePhotoChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setPhotoError("");

        /*
         * Validate image type
         */

        if (!file.type.startsWith("image/")) {
            setPhotoError(
                "Please select a valid image file."
            );

            event.target.value = "";
            return;
        }

        /*
         * Validate size
         */

        if (file.size > MAX_PHOTO_SIZE) {
            setPhotoError(
                "Image size must be 2MB or smaller."
            );

            event.target.value = "";
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {
            const result =
                reader.result;

            if (
                typeof result !==
                "string"
            ) {
                return;
            }

            try {
                localStorage.setItem(
                    `${PROFILE_PHOTO_PREFIX}${user.userId}`,
                    result
                );

                setProfilePhoto(result);
            } catch {
                setPhotoError(
                    "Unable to save this image in your browser."
                );
            }
        };

        reader.onerror = () => {
            setPhotoError(
                "Unable to read the selected image."
            );
        };

        reader.readAsDataURL(file);

        event.target.value = "";
    };

    /*
     * ---------------------------------------------------------
     * Remove photo
     * ---------------------------------------------------------
     */

    const handleRemovePhoto = () => {
        try {
            localStorage.removeItem(
                `${PROFILE_PHOTO_PREFIX}${user.userId}`
            );
        } catch {
            // Ignore localStorage errors.
        }

        setProfilePhoto("");
        setPhotoError("");
    };

    return (
        <div className="account-page">

            <div className="account-container">

                {/* =====================================================
                    BREADCRUMB
                ====================================================== */}

                <div className="account-breadcrumb">

                    <Link to="/">
                        Home
                    </Link>

                    <span>/</span>

                    <span>
                        My Account
                    </span>

                </div>


                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}

                <section className="account-page-header">

                    <div>

                        <span className="account-eyebrow">
                            MY ACCOUNT
                        </span>

                        <h1>
                            Welcome back,{" "}
                            <strong>
                                {user.displayName}
                            </strong>
                        </h1>

                        <p>
                            Manage your profile,
                            explore coloring pages
                            and access your account
                            tools.
                        </p>

                    </div>


                    <div className="account-status-pill">

                        <span className="account-status-dot" />

                        Account Active

                    </div>

                </section>


                {/* =====================================================
                    MAIN GRID
                ====================================================== */}

                <div className="account-layout">


                    {/* =================================================
                        SIDEBAR
                    ================================================== */}

                    <aside className="account-sidebar">

                        <div className="account-profile-card">


                            {/* PROFILE */}
                            <div className="account-profile-top">

                                <div className="account-avatar-wrapper">

                                    <div
                                        className={
                                            profilePhoto
                                                ? "account-avatar account-avatar-image"
                                                : "account-avatar"
                                        }
                                    >

                                        {profilePhoto ? (
                                            <img
                                                src={
                                                    profilePhoto
                                                }
                                                alt={
                                                    user.displayName
                                                }
                                            />
                                        ) : (
                                            firstLetter
                                        )}

                                    </div>


                                    {/* Camera button */}

                                    <button
                                        type="button"
                                        className="account-avatar-edit"
                                        onClick={
                                            handleChangePhotoClick
                                        }
                                        aria-label="Change profile photo"
                                        title="Change profile photo"
                                    >
                                        ✎
                                    </button>

                                </div>


                                <div className="account-profile-name">

                                    <strong>
                                        {user.displayName}
                                    </strong>

                                    <span>
                                        {user.email}
                                    </span>

                                </div>

                            </div>


                            {/* PHOTO CONTROLS */}

                            <div className="account-photo-controls">

                                <button
                                    type="button"
                                    className="account-change-photo"
                                    onClick={
                                        handleChangePhotoClick
                                    }
                                >
                                    <span>
                                        📷
                                    </span>

                                    Change Photo
                                </button>


                                {profilePhoto && (
                                    <button
                                        type="button"
                                        className="account-remove-photo"
                                        onClick={
                                            handleRemovePhoto
                                        }
                                    >
                                        Remove
                                    </button>
                                )}

                            </div>


                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="account-photo-input"
                                onChange={
                                    handlePhotoChange
                                }
                            />


                            {photoError && (
                                <div className="account-photo-error">
                                    {photoError}
                                </div>
                            )}


                            <div className="account-profile-divider" />


                            {/* =================================================
                                NAVIGATION
                            ================================================== */}

                            <nav className="account-navigation">


                                {/* Profile */}

                                <Link
                                    to="/account"
                                    className="account-nav-link active"
                                >

                                    <span className="account-nav-icon">
                                        👤
                                    </span>

                                    <span>
                                        Profile
                                    </span>

                                    <span className="account-nav-arrow">
                                        →
                                    </span>

                                </Link>


                                {/* Admin */}

                                {isAdmin && (
                                    <>
                                        <div className="account-nav-section">
                                            ADMINISTRATION
                                        </div>

                                        <Link
                                            to="/admin"
                                            className="account-nav-link account-admin-link"
                                        >

                                            <span className="account-nav-icon">
                                                ⚡
                                            </span>

                                            <span>
                                                Admin Dashboard
                                            </span>

                                            <span className="account-nav-arrow">
                                                →
                                            </span>

                                        </Link>
                                    </>
                                )}


                                {/* Explore */}

                                <Link
                                    to="/"
                                    className="account-nav-link"
                                >

                                    <span className="account-nav-icon">
                                        🎨
                                    </span>

                                    <span>
                                        Explore Coloring Pages
                                    </span>

                                    <span className="account-nav-arrow">
                                        →
                                    </span>

                                </Link>


                                {/* Search */}

                                <Link
                                    to="/search"
                                    className="account-nav-link"
                                >

                                    <span className="account-nav-icon">
                                        🔍
                                    </span>

                                    <span>
                                        Search Pages
                                    </span>

                                    <span className="account-nav-arrow">
                                        →
                                    </span>

                                </Link>

                            </nav>


                            {/* LOGOUT */}

                            <button
                                type="button"
                                className="account-logout-button"
                                onClick={
                                    handleLogout
                                }
                            >

                                <span>
                                    ↪
                                </span>

                                <span>
                                    Logout
                                </span>

                            </button>

                        </div>

                    </aside>


                    {/* =================================================
                        CONTENT
                    ================================================== */}

                    <main className="account-content">


                        {/* =================================================
                            PROFILE
                        ================================================== */}

                        <section className="account-panel">

                            <div className="account-panel-header">

                                <div>

                                    <span className="account-panel-eyebrow">
                                        PERSONAL INFORMATION
                                    </span>

                                    <h2>
                                        Profile
                                    </h2>

                                    <p>
                                        Your account information
                                        and membership details.
                                    </p>

                                </div>


                                <div className="account-panel-icon">
                                    👤
                                </div>

                            </div>


                            <div className="account-info-grid">


                                {/* Display Name */}

                                <div className="account-info-item">

                                    <span className="account-info-label">
                                        DISPLAY NAME
                                    </span>

                                    <strong>
                                        {user.displayName}
                                    </strong>

                                </div>


                                {/* Email */}

                                <div className="account-info-item">

                                    <span className="account-info-label">
                                        EMAIL ADDRESS
                                    </span>

                                    <strong>
                                        {user.email}
                                    </strong>

                                </div>


                                {/* Status */}

                                <div className="account-info-item">

                                    <span className="account-info-label">
                                        ACCOUNT STATUS
                                    </span>

                                    <strong className="account-active-text">

                                        <span />

                                        Active

                                    </strong>

                                </div>


                                {/* Account Type */}

                                <div className="account-info-item">

                                    <span className="account-info-label">
                                        ACCOUNT TYPE
                                    </span>

                                    <strong
                                        className={
                                            isAdmin
                                                ? "account-type-admin"
                                                : "account-type-member"
                                        }
                                    >

                                        <span className="account-type-icon">
                                            {isAdmin
                                                ? "⚡"
                                                : "●"}
                                        </span>

                                        {accountType}

                                    </strong>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            QUICK ACCESS
                        ================================================== */}

                        <section className="account-panel account-quick-panel">

                            <div className="account-panel-header">

                                <div>

                                    <span className="account-panel-eyebrow">
                                        QUICK ACCESS
                                    </span>

                                    <h2>
                                        Continue Exploring
                                    </h2>

                                    <p>
                                        Jump back into
                                        TheColorClone.
                                    </p>

                                </div>

                            </div>


                            <div className="account-quick-grid">


                                {/* Browse */}

                                <Link
                                    to="/"
                                    className="account-quick-card"
                                >

                                    <div className="account-quick-icon">
                                        🎨
                                    </div>

                                    <div>

                                        <strong>
                                            Browse Coloring Pages
                                        </strong>

                                        <span>
                                            Discover new coloring
                                            pages.
                                        </span>

                                    </div>

                                    <span className="account-quick-arrow">
                                        →
                                    </span>

                                </Link>


                                {/* Search */}

                                <Link
                                    to="/search"
                                    className="account-quick-card"
                                >

                                    <div className="account-quick-icon search">
                                        🔍
                                    </div>

                                    <div>

                                        <strong>
                                            Search Pages
                                        </strong>

                                        <span>
                                            Find your favorite
                                            artwork.
                                        </span>

                                    </div>

                                    <span className="account-quick-arrow">
                                        →
                                    </span>

                                </Link>


                                {/* Admin */}

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="account-quick-card account-quick-admin"
                                    >

                                        <div className="account-quick-icon admin">
                                            ⚡
                                        </div>

                                        <div>

                                            <strong>
                                                Admin Dashboard
                                            </strong>

                                            <span>
                                                Manage users,
                                                categories and
                                                content.
                                            </span>

                                        </div>

                                        <span className="account-quick-arrow">
                                            →
                                        </span>

                                    </Link>
                                )}

                            </div>

                        </section>

                    </main>

                </div>

            </div>

        </div>
    );
}