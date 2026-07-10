export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(error, _request, response, _next) {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'account';
    return response.status(409).json({
      success: false,
      message: `An account with this ${field} already exists`,
    });
  }

  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred' : error.message;

  if (statusCode === 500) console.error(error);

  return response.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { errors: error.details } : {}),
  });
}
