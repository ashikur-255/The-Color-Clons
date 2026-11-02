import axios from "axios";

// ============================================================
// CONFIGURATION
// ============================================================

const TOKEN_KEY = "thecolor_auth_token";

const DEFAULT_API_BASE_URL = "http://localhost:5100";

const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_API_BASE_URL;

const API_BASE_URL =
    configuredApiBaseUrl.replace(/\/+$/, "") + "/api";


// ============================================================
// AXIOS CLIENT
// ============================================================

const apiClient = axios.create({
    baseURL: API_BASE_URL,

    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },

    timeout: 30000,
});


// ============================================================
// REQUEST INTERCEPTOR
// Attach JWT token automatically
// ============================================================

apiClient.interceptors.request.use(
    (config) => {
        try {
            const token =
                localStorage.getItem(TOKEN_KEY);

            if (token) {
                config.headers =
                    config.headers || {};

                config.headers.Authorization =
                    `Bearer ${token}`;
            }
        } catch (error) {
            console.error(
                "Unable to read authentication token.",
                error
            );
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


// ============================================================
// RESPONSE INTERCEPTOR
// Handle common API errors
// ============================================================

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        const status =
            error?.response?.status;

        if (status === 401) {
            console.error(
                "401 Unauthorized: Authentication token is missing, invalid, or expired."
            );
        }

        if (status === 403) {
            console.error(
                "403 Forbidden: You do not have permission to access this resource."
            );
        }

        if (status === 404) {
            console.error(
                "404 Not Found: The requested API resource was not found."
            );
        }

        if (status >= 500) {
            console.error(
                "Server error: The API server returned an internal error."
            );
        }

        return Promise.reject(error);
    }
);


// ============================================================
// EXPORT
// ============================================================

export default apiClient;