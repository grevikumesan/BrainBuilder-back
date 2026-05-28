export function successResponse(data: unknown, status = 200): Response {
	return new Response(
		JSON.stringify({ success: true, data }),
		{
			status,
			headers: { "Content-Type": "application/json" },
		}
	)
}

export function errorResponse(message: string, status = 400): Response {
	return new Response(
		JSON.stringify({ success: false, error: message }),
		{
			status,
			headers: { "Content-Type": "application/json" },
		}
	)
}