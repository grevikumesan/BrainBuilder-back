/**
 * Quiz Grader Edge Function
 * Endpoint: POST /grade
 * Handles UC-03 (Grading and Explanation)
 * Owner: Jason
 */

import { validateGradeQuizRequest } from "./validation.ts"
import { gradeQuiz } from "./service.ts"
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
		const validated = validateGradeQuizRequest(body)

		const supabase = getServiceClient()

		const result = await gradeQuiz(supabase, validated, claims.sub)

		return successResponse(result, 200)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})