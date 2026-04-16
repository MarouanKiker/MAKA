using CrmService.DTOs.Tasks;
using CrmService.Models;

namespace CrmService.Mappers;

public static class TaskMapper
{
    public static TaskItem ToEntity(CreateTaskDto dto)
    {
        return new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            DueDate = dto.DueDate,
            IsCompleted = false,
            LeadId = dto.LeadId,
            OpportuniteId = dto.OpportuniteId
        };
    }

    public static TaskResponseDto ToResponseDto(TaskItem task)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            DueDate = task.DueDate,
            IsCompleted = task.IsCompleted,
            LeadId = task.LeadId,
            OpportuniteId = task.OpportuniteId
        };
    }
}
