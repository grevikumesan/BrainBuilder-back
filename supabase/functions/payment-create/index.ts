/**
 * Payment Create Edge Function
 * Endpoint: POST /payment-create, GET /payment-create/plans, GET /payment-create/subscription
 * Handles UC-07 (Payment Process)
 * Owner: Grevi
 */

import { validateCreatePaymentRequest } from "./validation.ts"
import { createPaymentTransaction, getPlans, getSubscriptionStatus } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError, ForbiddenError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const url = new URL(req.url)
		const path = url.pathname
		const supabase = getServiceClient()

		// GET plans — tidak perlu login (FR-08)
		if (path.endsWith("/plans") && req.method === "GET") {
			const result = await getPlans(supabase)
			return successResponse(result, 200)
		}

		// Semua endpoint lain butuh JWT
		const claims = await validateJWT(req)
		if (claims.role !== "STUDENT") {
			throw new ForbiddenError()
		}

		// GET subscription status
		if (path.endsWith("/subscription") && req.method === "GET") {
			const result = await getSubscriptionStatus(supabase, claims.sub)
			return successResponse(result, 200)
		}

		// POST create payment
		if (req.method === "POST") {
			const body = await req.json()
			const validated = validateCreatePaymentRequest(body)
			const result = await createPaymentTransaction(supabase, {
				...validated,
				userId: claims.sub,
			})
			return successResponse(result, 200)
		}

		return errorResponse("Not found", 404)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})