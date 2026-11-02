using Coloring.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Coloring.Infrastructure.Data.Configurations;

public class ColoringPageRatingConfiguration
    : IEntityTypeConfiguration<ColoringPageRating>
{
    public void Configure(
        EntityTypeBuilder<ColoringPageRating> builder)
    {
        builder.ToTable("ColoringPageRatings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Rating)
            .IsRequired();

        builder.Property(x => x.ColoringPageId)
            .IsRequired();

        builder.HasIndex(x => x.ColoringPageId);

        builder.HasOne<ColoringPage>()
            .WithMany()
            .HasForeignKey(x => x.ColoringPageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}