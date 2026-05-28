import { RegisterRequest, LoginRequest } from "./types.ts"

export function validateRegisterRequest(body: unknown): RegisterRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { name, email, password, role } = body as Record<string, unknown>

	if (!name || typeof name !== "string") {
		throw new Error("name is required")
	}
	if (!email || typeof email !== "string") {
		throw new Error("email is required")
	}
	if (!password || typeof password !== "string") {
		throw new Error("password is required")
	}
	if (role !== "STUDENT" && role !== "TEACHER") {
		throw new Error("role must be STUDENT or TEACHER")
	}

	return { name, email, password, role }
}

export function validateLoginRequest(body: unknown): LoginRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { email, password } = body as Record<string, unknown>

	if (!email || typeof email !== "string") {
		throw new Error("email is required")
	}
	if (!password || typeof password !== "string") {
		throw new Error("password is required")
	}

	return { email, password }
}