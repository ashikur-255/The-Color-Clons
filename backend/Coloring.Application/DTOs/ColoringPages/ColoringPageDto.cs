namespace Coloring.Application.DTOs.ColoringPages;

public class ColoringPageDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? SeoTitle { get; set; }

    public string? SeoDescription { get; set; }

    public string SvgUrl { get; set; } = string.Empty;

    public string? OriginalImageUrl { get; set; }

    public string? ThumbnailUrl { get; set; }

    public int CategoryId { get; set; }

    public int Views { get; set; }

    public int Downloads { get; set; }

    public int Likes { get; set; }

    public decimal Rating { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAt { get; set; }
}