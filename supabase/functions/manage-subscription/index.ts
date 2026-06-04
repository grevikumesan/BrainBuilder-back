/**
 * Manage Subscription Edge Function
 * Endpoint: GET /manage-subscription
 * Handles UC-06 (Manage Subscription) — fetches available plans and the
 * student's current subscription status for display on the Subscription page.
 * Initiating a purchase delegates to UC-07 (payment-create).
 * Owner: Dharma
 */

import { getSubscriptionPage } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError } from "../_shared/errors.ts"
 
Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)
		const supabase = getServiceClient()
 
		const result = await getSubscriptionPage(supabase, claims.sub)
		return successResponse(result, 200)
	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 500)
	}
})
 