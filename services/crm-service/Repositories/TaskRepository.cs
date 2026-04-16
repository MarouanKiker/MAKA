using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly CrmDbContext _context;

    public TaskRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskItem>> GetAllAsync()
    {
        return await _context.Tasks
            .Include(t => t.Lead)
            .Include(t => t.Opportunite)
            .OrderByDescending(t => t.DueDate)
            .ToListAsync();
    }

    public async Task<TaskItem?> GetByIdAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Lead)
            .Include(t => t.Opportunite)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<TaskItem> CreateAsync(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<TaskItem> UpdateAsync(TaskItem task)
    {
        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }
}