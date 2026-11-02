const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5100";

export function getApiUrl(path: string): string {
    if (!path) {
        return "";
    }

    // Already a complete URL
    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    // Remove leading slash
    const cleanPath = path.replace(/^\/+/, "");

    return `${API_BASE_URL}/${cleanPath}`;
}

export { API_BASE_URL };