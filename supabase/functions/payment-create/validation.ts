import { CreatePaymentRequest } from "./types.ts"

export function validateCreatePaymentRequest(body: unknown): CreatePaymentRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { planId, userId } = body as Record<string, unknown>

	if (!planId || typeof planId !== "string") {
		throw new Error("planId is required")
	}

	if (!userId || typeof userId !== "string") {
		throw new Error("userId is required")
	}

	return { planId, userId }
}