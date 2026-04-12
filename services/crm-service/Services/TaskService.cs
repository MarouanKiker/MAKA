using CrmService.DTOs.Tasks;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _repo;

    public TaskService(ITaskRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<TaskResponseDto>> GetAllAsync()
    {
        var tasks = await _repo.GetAllAsync();
        return tasks.Select(TaskMapper.ToResponseDto).ToList();
    }

    public async Task<TaskResponseDto?> GetByIdAsync(int id)
    {
        var task = await _repo.GetByIdAsync(id);
        return task == null ? null : TaskMapper.ToResponseDto(task);
    }

    public async Task<TaskResponseDto> CreateAsync(CreateTaskDto dto)
    {
        var task = TaskMapper.ToEntity(dto);
        var created = await _repo.CreateAsync(task);
        var result = await _repo.GetByIdAsync(created.Id);
        return TaskMapper.ToResponseDto(result!);
    }

    public async Task<TaskResponseDto?> UpdateAsync(int id, UpdateTaskDto dto)
    {
        var task = await _repo.GetByIdAsync(id);
        if (task == null) return null;

        if (dto.Title != null)
            task.Title = dto.Title;

        if (dto.Description != null)
            task.Description = dto.Description;

        if (dto.DueDate.HasValue)
            task.DueDate = dto.DueDate.Value;

        if (dto.IsCompleted.HasValue)
            task.IsCompleted = dto.IsCompleted.Value;

        if (dto.LeadId.HasValue)
            task.LeadId = dto.LeadId;

        if (dto.OpportuniteId.HasValue)
            task.OpportuniteId = dto.OpportuniteId;

        var updated = await _repo.UpdateAsync(task);
        return TaskMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repo.DeleteAsync(id);
    }
}
