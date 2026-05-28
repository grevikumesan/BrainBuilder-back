/**
 * Payment Create Edge Function
 * Endpoint: POST /payment/create
 * Handles UC-07 (Payment Process)
 * Owner: FJ
 */

import { validateCreatePaymentRequest } from "./validation.ts"
import { createPaymentTransaction } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError, ForbiddenError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)
		if (claims.role !== "STUDENT") {
			throw new ForbiddenError()
		}

		const body = await req.json()
		const validated = validateCreatePaymentRequest(body)

		const supabase = getServiceClient()

		const result = await createPaymentTransaction(supabase, {
			...validated,
			userId: claims.sub,
		})

		return successResponse(result, 200)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})