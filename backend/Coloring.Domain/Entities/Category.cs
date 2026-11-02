namespace Coloring.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public string? SeoTitle { get; private set; }

    public string? SeoDescription { get; private set; }

    public string? ImageUrl { get; private set; }

    public int? ParentId { get; private set; }

    public int SortOrder { get; private set; }

    public bool IsActive { get; private set; }

    private Category()
    {
    }

    public Category(
        string name,
        string slug,
        string? description = null)
    {
        Name = name;
        Slug = slug;
        Description = description;
        SortOrder = 0;
        IsActive = true;
    }

    public void Update(
        string name,
        string slug,
        string? description = null)
    {
        Name = name;
        Slug = slug;
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

    public void SetImage(string? imageUrl)
    {
        ImageUrl = imageUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetParent(int? parentId)
    {
        ParentId = parentId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}