using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace web_server.Middlewares
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

        public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Format the request
            var requestLog = await FormatRequest(context.Request);
            var sw = Stopwatch.StartNew();

            // Copy a pointer to the original response body stream
            var originalBodyStream = context.Response.Body;

            // Create a new memory stream to hold the response
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            // Continue down the Middleware pipeline
            await _next(context);

            sw.Stop();
            
            // Format the response from the server
            var responseLog = await FormatResponse(context.Response);
            
            // Write the logs
            _logger.LogInformation($"\n========== HTTP REQUEST ==========\n{requestLog}\n========== HTTP RESPONSE ({sw.ElapsedMilliseconds}ms) ==========\n{responseLog}\n==================================\n");

            // Copy the contents of the new memory stream (which contains the response) to the original stream
            await responseBody.CopyToAsync(originalBodyStream);
        }

        private async Task<string> FormatRequest(HttpRequest request)
        {
            request.EnableBuffering(); // Allows us to rewind the stream

            var bodyAsText = string.Empty;
            if (request.ContentLength != null && request.ContentLength > 0)
            {
                var buffer = new byte[Convert.ToInt32(request.ContentLength)];
                await request.Body.ReadAsync(buffer, 0, buffer.Length).ConfigureAwait(false);
                bodyAsText = Encoding.UTF8.GetString(buffer);
                request.Body.Position = 0;
            }

            return $"{request.Method} {request.Scheme}://{request.Host}{request.Path}{request.QueryString}\nPayload: {bodyAsText}";
        }

        private async Task<string> FormatResponse(HttpResponse response)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            string text = await new StreamReader(response.Body).ReadToEndAsync(); 
            response.Body.Seek(0, SeekOrigin.Begin);

            return $"Status: {response.StatusCode}\nResult: {text}";
        }
    }
}
