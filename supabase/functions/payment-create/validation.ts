import { CreatePaymentRequest } from "./types.ts"

export function validateCreatePaymentRequest(body: unknown): CreatePaymentRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { planId } = body as Record<string, unknown>

	// userId is taken from the JWT claim, never from the client body (NFR-01)
	if (!planId || typeof planId !== "string") {
		throw new Error("planId is required")
	}

	return { planId }
}
