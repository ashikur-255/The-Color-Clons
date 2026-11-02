using Coloring.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Coloring.Infrastructure.Data.Configurations;

public class ColoringPageConfiguration
    : IEntityTypeConfiguration<ColoringPage>
{
    public void Configure(
        EntityTypeBuilder<ColoringPage> builder)
    {
        builder.ToTable("ColoringPages");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.Description)
            .HasMaxLength(5000);

        builder.Property(x => x.SeoTitle)
            .HasMaxLength(300);

        builder.Property(x => x.SeoDescription)
            .HasMaxLength(500);

        builder.Property(x => x.SvgUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.OriginalImageUrl)
            .HasMaxLength(1000);

        builder.Property(x => x.ThumbnailUrl)
            .HasMaxLength(1000);

        builder.Property(x => x.Rating)
            .HasPrecision(3, 2);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.HasIndex(x => x.CategoryId);

        builder.HasIndex(x => x.IsPublished);

        builder.HasIndex(x => x.PublishedAt);

        builder.HasIndex(x => x.Views);

        builder.HasIndex(x => x.Downloads);
    }
}