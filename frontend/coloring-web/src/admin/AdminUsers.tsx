import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import "./admin-users.css";

interface AdminUser {
    id: number;
    displayName: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    roles: string[];
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [selectedUser, setSelectedUser] =
        useState<AdminUser | null>(null);

    const [deleteUser, setDeleteUser] =
        useState<AdminUser | null>(null);

    const [actionLoading, setActionLoading] =
        useState<number | null>(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] =
        useState<"success" | "error">("success");

    const showMessage = (
        text: string,
        type: "success" | "error" = "success"
    ) => {
        setMessage(text);
        setMessageType(type);

        window.setTimeout(() => {
            setMessage("");
        }, 3500);
    };

    const getErrorMessage = (
        err: unknown,
        fallback: string
    ) => {
        const apiError = err as ApiError;

        return (
            apiError.response?.data?.message ||
            fallback
        );
    };

    const loadUsers = async (
        showRefreshState = false
    ) => {
        try {
            setError("");

            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await apiClient.get(
                "/admin/users"          // ✅ fixed — "/api" সরানো হয়েছে
            );

            setUsers(response.data);
        } catch (err) {
            const errorMessage = getErrorMessage(
                err,
                "Unable to load users."
            );

            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return users;
        }

        return users.filter((user) => {
            const name = user.displayName.toLowerCase();
            const email = user.email.toLowerCase();
            const roles = user.roles.join(" ").toLowerCase();

            return (
                name.includes(query) ||
                email.includes(query) ||
                roles.includes(query)
            );
        });
    }, [users, search]);

    const activeUsers = users.filter(
        (user) => user.isActive
    ).length;

    const adminUsers = users.filter((user) =>
        user.roles.some(
            (role) =>
                role.toLowerCase() === "admin"
        )
    ).length;

    const handleStatusChange = async (
        user: AdminUser
    ) => {
        try {
            setActionLoading(user.id);

            await apiClient.put(
                `/admin/users/${user.id}/status`,   // ✅ fixed
                {
                    isActive: !user.isActive,
                }
            );

            setUsers((currentUsers) =>
                currentUsers.map((item) =>
                    item.id === user.id
                        ? {
                            ...item,
                            isActive:
                                !item.isActive,
                        }
                        : item
                )
            );

            showMessage(
                user.isActive
                    ? "User deactivated successfully."
                    : "User activated successfully."
            );
        } catch (err) {
            showMessage(
                getErrorMessage(
                    err,
                    "Unable to update user status."
                ),
                "error"
            );
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (
        user: AdminUser
    ) => {
        const isAdmin = user.roles.some(
            (role) =>
                role.toLowerCase() === "admin"
        );

        const newRole = isAdmin
            ? "User"
            : "Admin";

        try {
            setActionLoading(user.id);

            await apiClient.put(
                `/admin/users/${user.id}/role`,   // ✅ fixed
                {
                    role: newRole,
                }
            );

            setUsers((currentUsers) =>
                currentUsers.map((item) =>
                    item.id === user.id
                        ? {
                            ...item,
                            roles: [newRole],
                        }
                        : item
                )
            );

            if (selectedUser?.id === user.id) {
                setSelectedUser({
                    ...selectedUser,
                    roles: [newRole],
                });
            }

            showMessage(
                `User role changed to ${newRole}.`
            );
        } catch (err) {
            showMessage(
                getErrorMessage(
                    err,
                    "Unable to update user role."
                ),
                "error"
            );
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteUser) return;

        try {
            setActionLoading(deleteUser.id);

            await apiClient.delete(
                `/admin/users/${deleteUser.id}`   // ✅ fixed
            );

            setUsers((currentUsers) =>
                currentUsers.filter(
                    (user) =>
                        user.id !== deleteUser.id
                )
            );

            if (
                selectedUser?.id ===
                deleteUser.id
            ) {
                setSelectedUser(null);
            }

            showMessage(
                "User deleted successfully."
            );

            setDeleteUser(null);
        } catch (err) {
            showMessage(
                getErrorMessage(
                    err,
                    "Unable to delete user."
                ),
                "error"
            );
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date: string) => {
        const value = new Date(date);

        if (Number.isNaN(value.getTime())) {
            return "—";
        }

        return value.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
    };

    const getInitials = (name: string) => {
        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return "U";
        }

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    };

    const isAdmin = (user: AdminUser) =>
        user.roles.some(
            (role) =>
                role.toLowerCase() === "admin"
        );

    return (
        <div className="admin-users-page">
            <div className="admin-users-header">
                <div>
                    <div className="admin-page-eyebrow">
                        USER MANAGEMENT
                    </div>

                    <h2>Users</h2>

                    <p>
                        Manage registered users,
                        roles and account access.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-users-refresh"
                    onClick={() => loadUsers(true)}
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
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            <div className="admin-users-stats">
                <div className="admin-user-stat">
                    <div className="admin-user-stat-icon total">
                        <span>◎</span>
                    </div>

                    <div>
                        <span className="stat-label">
                            Total Users
                        </span>

                        <strong>
                            {users.length}
                        </strong>
                    </div>
                </div>

                <div className="admin-user-stat">
                    <div className="admin-user-stat-icon active">
                        <span>✓</span>
                    </div>

                    <div>
                        <span className="stat-label">
                            Active Users
                        </span>

                        <strong>
                            {activeUsers}
                        </strong>
                    </div>
                </div>

                <div className="admin-user-stat">
                    <div className="admin-user-stat-icon admins">
                        <span>★</span>
                    </div>

                    <div>
                        <span className="stat-label">
                            Administrators
                        </span>

                        <strong>
                            {adminUsers}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="admin-users-toolbar">
                <div className="admin-users-search">
                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Search by name, email or role..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            className="clear-search"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="admin-users-result-count">
                    {filteredUsers.length}{" "}
                    {filteredUsers.length === 1
                        ? "user"
                        : "users"}
                </div>
            </div>

            {message && (
                <div
                    className={`admin-users-toast ${messageType}`}
                >
                    <span>
                        {messageType === "success"
                            ? "✓"
                            : "!"}
                    </span>

                    {message}
                </div>
            )}

            {loading ? (
                <div className="admin-users-card">
                    <div className="users-loading">
                        {Array.from({
                            length: 6,
                        }).map((_, index) => (
                            <div
                                className="user-skeleton-row"
                                key={index}
                            >
                                <div className="skeleton-avatar" />

                                <div className="skeleton-lines">
                                    <span />
                                    <span />
                                </div>

                                <div className="skeleton-block" />
                                <div className="skeleton-block small" />
                                <div className="skeleton-block" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="admin-users-empty">
                    <div className="empty-icon error">
                        !
                    </div>

                    <h3>
                        Unable to load users
                    </h3>

                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() =>
                            loadUsers()
                        }
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="admin-users-empty">
                    <div className="empty-icon">
                        ◎
                    </div>

                    <h3>
                        {search
                            ? "No users found"
                            : "No users yet"}
                    </h3>

                    <p>
                        {search
                            ? "Try a different name, email or role."
                            : "Registered users will appear here."}
                    </p>

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            ) : (
                <div className="admin-users-card">
                    <div className="admin-users-table-wrap">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th className="actions-heading">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map(
                                    (user) => (
                                        <tr
                                            key={
                                                user.id
                                            }
                                        >
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-user-avatar">
                                                        {getInitials(
                                                            user.displayName
                                                        )}
                                                    </div>

                                                    <div className="admin-user-info">
                                                        <strong>
                                                            {
                                                                user.displayName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                user.email
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`role-badge ${isAdmin(
                                                        user
                                                    )
                                                            ? "admin"
                                                            : "user"
                                                        }`}
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            user
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        user.id
                                                    }
                                                    title="Change role"
                                                >
                                                    <span>
                                                        {isAdmin(
                                                            user
                                                        )
                                                            ? "★"
                                                            : "●"}
                                                    </span>

                                                    {isAdmin(
                                                        user
                                                    )
                                                        ? "Admin"
                                                        : "User"}
                                                </button>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`status-badge ${user.isActive
                                                            ? "active"
                                                            : "inactive"
                                                        }`}
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            user
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        user.id
                                                    }
                                                    title="Change status"
                                                >
                                                    <span />
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </button>
                                            </td>

                                            <td>
                                                <span className="joined-date">
                                                    {formatDate(
                                                        user.createdAt
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="user-row-actions">
                                                    <button
                                                        type="button"
                                                        className="user-action view"
                                                        onClick={() =>
                                                            setSelectedUser(
                                                                user
                                                            )
                                                        }
                                                        title="View details"
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="user-action delete"
                                                        onClick={() =>
                                                            setDeleteUser(
                                                                user
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading ===
                                                            user.id
                                                        }
                                                        title="Delete user"
                                                    >
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
                </div>
            )}

            {selectedUser && (
                <div
                    className="admin-modal-overlay"
                    onMouseDown={() =>
                        setSelectedUser(null)
                    }
                >
                    <div
                        className="admin-user-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span>
                                    USER DETAILS
                                </span>

                                <h3>
                                    User Profile
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedUser(
                                        null
                                    )
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="user-profile-hero">
                            <div className="large-user-avatar">
                                {getInitials(
                                    selectedUser.displayName
                                )}
                            </div>

                            <div>
                                <h4>
                                    {
                                        selectedUser.displayName
                                    }
                                </h4>

                                <p>
                                    {
                                        selectedUser.email
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="user-detail-grid">
                            <div className="user-detail-item">
                                <span>
                                    User ID
                                </span>
                                <strong>
                                    #
                                    {
                                        selectedUser.id
                                    }
                                </strong>
                            </div>

                            <div className="user-detail-item">
                                <span>
                                    Joined
                                </span>
                                <strong>
                                    {formatDate(
                                        selectedUser.createdAt
                                    )}
                                </strong>
                            </div>

                            <div className="user-detail-item">
                                <span>
                                    Role
                                </span>
                                <strong>
                                    {isAdmin(
                                        selectedUser
                                    )
                                        ? "Administrator"
                                        : "User"}
                                </strong>
                            </div>

                            <div className="user-detail-item">
                                <span>
                                    Account Status
                                </span>
                                <strong>
                                    {selectedUser.isActive
                                        ? "Active"
                                        : "Inactive"}
                                </strong>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                type="button"
                                className="modal-secondary"
                                onClick={() =>
                                    setSelectedUser(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="modal-primary"
                                onClick={() => {
                                    setSelectedUser(
                                        null
                                    );
                                    handleStatusChange(
                                        selectedUser
                                    );
                                }}
                                disabled={
                                    actionLoading ===
                                    selectedUser.id
                                }
                            >
                                {selectedUser.isActive
                                    ? "Deactivate User"
                                    : "Activate User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteUser && (
                <div
                    className="admin-modal-overlay"
                    onMouseDown={() =>
                        setDeleteUser(null)
                    }
                >
                    <div
                        className="delete-user-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="delete-icon">
                            !
                        </div>

                        <h3>
                            Delete User?
                        </h3>

                        <p>
                            You are about to permanently
                            delete{" "}
                            <strong>
                                {
                                    deleteUser.displayName
                                }
                            </strong>
                            . This action cannot be
                            undone.
                        </p>

                        <div className="delete-user-actions">
                            <button
                                type="button"
                                className="cancel-delete"
                                onClick={() =>
                                    setDeleteUser(
                                        null
                                    )
                                }
                                disabled={
                                    actionLoading ===
                                    deleteUser.id
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="confirm-delete"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    actionLoading ===
                                    deleteUser.id
                                }
                            >
                                {actionLoading ===
                                    deleteUser.id
                                    ? "Deleting..."
                                    : "Delete User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}