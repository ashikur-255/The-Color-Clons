using Coloring.Domain.Entities;

namespace Coloring.Application.Interfaces.Repositories;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);

    Task<IReadOnlyList<T>> GetAllAsync();

    Task<T> AddAsync(T entity);

    Task UpdateAsync(T entity);

    Task DeleteAsync(T entity);
}