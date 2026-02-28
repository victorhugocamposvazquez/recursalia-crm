export function jsonResponse<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400, details?: string) {
  return Response.json(
    { error: message, ...(details && { details }) },
    { status }
  );
}
