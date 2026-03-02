namespace Usuarios.Application.DTOs;

public class ServiceResult<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ServiceResult<T> Ok(T data) => new() { Success = true, Data = data };
    public static ServiceResult<T> Fail(string error) => new() { Success = false, ErrorMessage = error, Errors = new List<string> { error } };
    public static ServiceResult<T> Fail(List<string> errors) => new() { Success = false, ErrorMessage = errors.FirstOrDefault(), Errors = errors };
}

public class ServiceResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ServiceResult Ok() => new() { Success = true };
    public static ServiceResult Fail(string error) => new() { Success = false, ErrorMessage = error, Errors = new List<string> { error } };
    public static ServiceResult Fail(List<string> errors) => new() { Success = false, ErrorMessage = errors.FirstOrDefault(), Errors = errors };
}
