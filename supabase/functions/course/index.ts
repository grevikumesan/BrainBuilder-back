/**
 * Course Edge Function
 * Endpoint: POST /course
 * Handles UC-08 (Create Course Content)
 * Owner: Grevi
 */

import { validateCreateCourseRequest } from "./validation.ts"
import { createCourse } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError, ForbiddenError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)
		if (claims.role !== "TEACHER") {
			throw new ForbiddenError()
		}

		const body = await req.json()
		const validated = validateCreateCourseRequest(body)

		const supabase = getServiceClient()

		const result = await createCourse(supabase, validated, claims.sub)

		return successResponse(result, 201)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})