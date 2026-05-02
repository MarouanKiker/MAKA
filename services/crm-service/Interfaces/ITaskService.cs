using CrmService.DTOs.Tasks;

namespace CrmService.Interfaces;

public interface ITaskService
{
    Task<List<TaskResponseDto>> GetAllAsync();
    Task<TaskResponseDto?> GetByIdAsync(int id);
    Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, int? authUserId);
    Task<TaskResponseDto?> UpdateAsync(int id, UpdateTaskDto dto);
    Task<bool> DeleteAsync(int id);
}
