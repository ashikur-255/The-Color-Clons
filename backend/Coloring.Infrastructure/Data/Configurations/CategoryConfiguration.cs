using Coloring.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Coloring.Infrastructure.Data.Configurations;

public class CategoryConfiguration
    : IEntityTypeConfiguration<Category>
{
    public void Configure(
        EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Description)
            .HasMaxLength(2000);

        builder.Property(x => x.SeoTitle)
            .HasMaxLength(300);

        builder.Property(x => x.SeoDescription)
            .HasMaxLength(500);

        builder.Property(x => x.ImageUrl)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.HasIndex(x => x.ParentId);

        builder.HasIndex(x => x.IsActive);
    }
}