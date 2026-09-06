using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Oracle.ManagedDataAccess.Client;
using web_server.Models;

namespace web_server.Filters;

public class OracleExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is OracleException ex)
        {
            if (ex.Number == 1) // Unique constraint
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error("A record with this information already exists. (ORA-00001)"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number == 2290) // Check constraint
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error($"Invalid data provided: a check constraint was violated. (ORA-02290) - {ex.Message}"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number == 1400) // Not null constraint
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error($"Required fields are missing. (ORA-01400) - {ex.Message}"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number == 2292) // Integrity constraint violated - child record found
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error("Cannot delete this record because it is referenced elsewhere. (ORA-02292)"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number == 2291) // Integrity constraint violated - parent key not found
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error("Referenced record does not exist. (ORA-02291)"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number == 1403) // No data found
            {
                context.Result = new NotFoundObjectResult(ApiResponse<object>.Error("The requested record was not found or you do not have permission to access it. (ORA-01403)"));
                context.ExceptionHandled = true;
            }
            else if (ex.Number >= 20000 && ex.Number <= 20999) // Custom application errors
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Error(ex.Message));
                context.ExceptionHandled = true;
            }
        }
    }
}
