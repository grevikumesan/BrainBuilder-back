/**
 * Admin Edge Function
 * Endpoint: GET /admin/items, POST /admin/action
 * Handles UC-09 (Manage User)
 * Owner: Hans
 */

import { validateApplyActionRequest } from "./validation.ts"
import { listPendingItems, applyAction } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError, ForbiddenError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)
		if (claims.role !== "ADMIN") {
			throw new ForbiddenError()
		}

		const url = new URL(req.url)
		const path = url.pathname
		const supabase = getServiceClient()

		if (path.endsWith("/items") && req.method === "GET") {
			const result = await listPendingItems(supabase)
			return successResponse(result, 200)
		}

		if (path.endsWith("/action") && req.method === "POST") {
			const body = await req.json()
			const validated = validateApplyActionRequest(body)
			await applyAction(supabase, claims.sub, validated)
			return successResponse({ message: "Action applied successfully" }, 200)
		}

		return errorResponse("Not found", 404)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})