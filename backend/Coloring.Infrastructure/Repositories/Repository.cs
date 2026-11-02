using Coloring.Application.Interfaces.Repositories;
using Coloring.Domain.Entities;
using Coloring.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Coloring.Infrastructure.Repositories;

public class Repository<T> : IRepository<T>
    where T : BaseEntity
{
    protected readonly ApplicationDbContext Context;

    protected readonly DbSet<T> DbSet;

    public Repository(ApplicationDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await DbSet.FindAsync(id);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync()
    {
        return await DbSet
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await DbSet.AddAsync(entity);

        await Context.SaveChangesAsync();

        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        DbSet.Update(entity);

        await Context.SaveChangesAsync();
    }

    public async Task DeleteAsync(T entity)
    {
        DbSet.Remove(entity);

        await Context.SaveChangesAsync();
    }
}