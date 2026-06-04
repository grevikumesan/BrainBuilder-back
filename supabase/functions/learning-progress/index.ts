/**
 * Track Learning Progress Edge Function
 * Endpoint: GET /track-progress
 * Handles UC-05 (Track Learning Progress)
 * Owner: Dharma
 */

import { getProgress } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError } from "../_shared/errors.ts"
 
Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)
		const supabase = getServiceClient()
 
		const result = await getProgress(supabase, claims.sub)
		return successResponse(result, 200)
	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 500)
	}
})