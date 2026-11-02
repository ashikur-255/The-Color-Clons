namespace Coloring.Domain.Entities;

public class ColoringPage : BaseEntity
{
    public string Title { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public string? SeoTitle { get; private set; }

    public string? SeoDescription { get; private set; }

    public string SvgUrl { get; private set; } = string.Empty;

    public string? OriginalImageUrl { get; private set; }

    public string? ThumbnailUrl { get; private set; }

    public int CategoryId { get; private set; }

    public int Views { get; private set; }

    public int Downloads { get; private set; }

    public int Likes { get; private set; }

    public decimal Rating { get; private set; }

    public bool IsPublished { get; private set; }

    public DateTime? PublishedAt { get; private set; }

    private ColoringPage()
    {
    }

    public ColoringPage(
        string title,
        string slug,
        int categoryId,
        string svgUrl)
    {
        Title = title;
        Slug = slug;
        CategoryId = categoryId;
        SvgUrl = svgUrl;

        Views = 0;
        Downloads = 0;
        Likes = 0;
        Rating = 0;
        IsPublished = false;
    }

    public void Update(
        string title,
        string slug,
        int categoryId,
        string svgUrl,
        string? description)
    {
        Title = title;
        Slug = slug;
        CategoryId = categoryId;
        SvgUrl = svgUrl;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetSeo(
        string? seoTitle,
        string? seoDescription)
    {
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetImages(
        string? originalImageUrl,
        string? thumbnailUrl)
    {
        OriginalImageUrl = originalImageUrl;
        ThumbnailUrl = thumbnailUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish()
    {
        IsPublished = true;
        PublishedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Unpublish()
    {
        IsPublished = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViews()
    {
        Views++;
    }

    public void IncrementDownloads()
    {
        Downloads++;
    }

    public void IncrementLikes()
    {
        Likes++;
    }

    public void UpdateRating(decimal rating)
    {
        Rating = rating;
        UpdatedAt = DateTime.UtcNow;
    }
}