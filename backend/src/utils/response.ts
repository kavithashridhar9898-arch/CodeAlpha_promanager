/**
 * Creates a standardized API success response object.
 */
export function successResponse<T>(data: T, message = 'Success') {
  return { success: true, message, data };
}

/**
 * Creates a standardized API error response object.
 */
export function errorResponse(message: string, statusCode = 500) {
  return { success: false, message, statusCode };
}
