export const API_BASE_URL = "http://localhost:5100";

export function getApiUrl(path: string): string {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (path.startsWith("/")) {
        return `${API_BASE_URL}${path}`;
    }

    return `${API_BASE_URL}/${path}`;
}

export async function apiFetch(
    path: string,
    options?: RequestInit
): Promise<Response> {
    const url = getApiUrl(path);

    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
        },
    });
}