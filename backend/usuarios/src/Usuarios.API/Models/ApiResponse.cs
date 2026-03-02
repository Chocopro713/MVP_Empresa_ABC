namespace Usuarios.API.Models;

/// <summary>
/// Respuesta estándar para todas las APIs
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? TraceId { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Operación exitosa")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> Created(T data, string message = "Recurso creado exitosamente")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> NotFound(string message = "Recurso no encontrado")
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = new List<string> { message }
        };
    }

    public static ApiResponse<T> BadRequest(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }

    public static ApiResponse<T> Error(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }

    public static ApiResponse<T> Conflict(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }
}

/// <summary>
/// Respuesta para operaciones sin datos (delete, update)
/// </summary>
public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse OkNoContent(string message = "Operación exitosa")
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public new static ApiResponse NotFound(string message = "Recurso no encontrado")
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = new List<string> { message }
        };
    }

    public new static ApiResponse BadRequest(string message, List<string>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }

    public static ApiResponse Conflict(string message, List<string>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string> { message }
        };
    }
}

/// <summary>
/// Respuesta paginada
/// </summary>
public class PaginatedResponse<T> : ApiResponse<IEnumerable<T>>
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public static PaginatedResponse<T> Ok(IEnumerable<T> data, int page, int pageSize, int totalCount)
    {
        return new PaginatedResponse<T>
        {
            Success = true,
            Message = "Operación exitosa",
            Data = data,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
