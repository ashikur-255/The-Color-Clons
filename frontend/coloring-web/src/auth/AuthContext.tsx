import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5100";

const TOKEN_KEY = "thecolor_auth_token";

export interface AuthUser {
    userId: string;
    displayName: string;
    email: string;
    roles: string[];          // ✅ added
}

interface LoginResponse {
    token?: string;
    accessToken?: string;
    jwtToken?: string;
    user?: Partial<AuthUser>;
    data?: {
        token?: string;
        accessToken?: string;
        jwtToken?: string;
        user?: Partial<AuthUser>;
    };
    userId?: string;
    displayName?: string;
    email?: string;
    roles?: string[];         // ✅ added
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (
        email: string,
        password: string
    ) => Promise<void>;
    register: (
        displayName: string,
        email: string,
        password: string
    ) => Promise<void>;
    logout: () => void;
}

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

function getStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function getErrorMessage(
    response: Response,
    fallback: string
) {
    try {
        const data = await response.json();

        if (data?.message) {
            return data.message;
        }

        if (data?.title) {
            return data.title;
        }

        if (data?.errors) {
            const errors = Object.values(
                data.errors
            )
                .flat()
                .filter(Boolean);

            if (errors.length > 0) {
                return errors.join(" ");
            }
        }
    } catch {
        // Ignore JSON parsing errors.
    }

    return fallback;
}

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [token, setToken] =
        useState<string | null>(
            getStoredToken()
        );

    const [loading, setLoading] =
        useState(true);

    const fetchCurrentUser = async (
        authToken: string
    ) => {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                await getErrorMessage(
                    response,
                    "Authentication session expired."
                )
            );
        }

        const data = await response.json();

        const currentUser: AuthUser = {
            userId:
                data.userId ||
                data.id ||
                "",
            displayName:
                data.displayName ||
                data.name ||
                "User",
            email:
                data.email ||
                "",
            roles: Array.isArray(data.roles)   // ✅ added
                ? data.roles
                : [],
        };

        setUser(currentUser);

        return currentUser;
    };

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            const storedToken =
                getStoredToken();

            if (!storedToken) {
                if (!cancelled) {
                    setLoading(false);
                }

                return;
            }

            try {
                await fetchCurrentUser(
                    storedToken
                );

                if (!cancelled) {
                    setToken(storedToken);
                }
            } catch {
                removeToken();

                if (!cancelled) {
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = async (
        email: string,
        password: string
    ) => {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(
                await getErrorMessage(
                    response,
                    "Invalid email or password."
                )
            );
        }

        const data: LoginResponse =
            await response.json();

        const receivedToken =
            data.token ||
            data.accessToken ||
            data.jwtToken ||
            data.data?.token ||
            data.data?.accessToken ||
            data.data?.jwtToken;

        if (!receivedToken) {
            throw new Error(
                "Login succeeded but the server did not return an authentication token."
            );
        }

        saveToken(receivedToken);
        setToken(receivedToken);

        try {
            await fetchCurrentUser(
                receivedToken
            );
        } catch {
            const fallbackUser =
                data.user ||
                data.data?.user ||
                data;

            const currentUser: AuthUser = {
                userId:
                    fallbackUser.userId ||
                    "",
                displayName:
                    fallbackUser.displayName ||
                    "User",
                email:
                    fallbackUser.email ||
                    email,
                roles: Array.isArray(            // ✅ added
                    (fallbackUser as any).roles
                )
                    ? (fallbackUser as any).roles
                    : [],
            };

            setUser(currentUser);
        }
    };

    const register = async (
        displayName: string,
        email: string,
        password: string
    ) => {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    displayName,
                    email,
                    password,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(
                await getErrorMessage(
                    response,
                    "Registration failed."
                )
            );
        }

        const data: LoginResponse =
            await response.json();

        const receivedToken =
            data?.token ||
            data?.accessToken ||
            data?.jwtToken ||
            data?.data?.token ||
            data?.data?.accessToken ||
            data?.data?.jwtToken;

        if (receivedToken) {
            saveToken(receivedToken);
            setToken(receivedToken);

            try {
                await fetchCurrentUser(
                    receivedToken
                );
            } catch {
                const fallbackUser =
                    data.user ||
                    data.data?.user ||
                    data;

                setUser({
                    userId:
                        fallbackUser.userId ||
                        "",
                    displayName:
                        fallbackUser.displayName ||
                        displayName,
                    email:
                        fallbackUser.email ||
                        email,
                    roles: Array.isArray(          // ✅ added
                        (fallbackUser as any).roles
                    )
                        ? (fallbackUser as any).roles
                        : [],
                });
            }
        }
    };

    const logout = () => {
        removeToken();
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        loading,
        isAuthenticated:
            !!token && !!user,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}