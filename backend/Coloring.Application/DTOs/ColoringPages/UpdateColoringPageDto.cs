namespace Coloring.Application.DTOs.ColoringPages;

public class UpdateColoringPageDto
{
    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int CategoryId { get; set; }

    public string SvgUrl { get; set; } = string.Empty;
}