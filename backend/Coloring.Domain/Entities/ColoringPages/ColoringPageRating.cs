namespace Coloring.Domain.Entities;

public class ColoringPageRating : BaseEntity
{
    public int ColoringPageId { get; private set; }
    public int Rating { get; private set; }

    private ColoringPageRating()
    {
    }

    public ColoringPageRating(
        int coloringPageId,
        int rating)
    {
        if (rating < 1 || rating > 5)
        {
            throw new ArgumentOutOfRangeException(
                nameof(rating),
                "Rating must be between 1 and 5.");
        }

        ColoringPageId = coloringPageId;
        Rating = rating;
    }

    public void UpdateRating(int rating)
    {
        if (rating < 1 || rating > 5)
        {
            throw new ArgumentOutOfRangeException(
                nameof(rating),
                "Rating must be between 1 and 5.");
        }

        Rating = rating;
        UpdatedAt = DateTime.UtcNow;
    }
}