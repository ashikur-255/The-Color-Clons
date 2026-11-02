import apiClient from "./client";

export interface ColoringPage {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    svgUrl: string;
    originalImageUrl: string | null;
    thumbnailUrl: string | null;
    categoryId: number;
    views: number;
    downloads: number;
    likes: number;
    rating: number;
    isPublished: boolean;
    publishedAt: string | null;
}

export async function getColoringPages(): Promise<ColoringPage[]> {
    const response = await apiClient.get<ColoringPage[]>(
        "/coloringpages"
    );

    return response.data;
}

export async function getColoringPageById(
    id: number
): Promise<ColoringPage> {
    const response = await apiClient.get<ColoringPage>(
        `/coloringpages/${id}`
    );

    return response.data;
}