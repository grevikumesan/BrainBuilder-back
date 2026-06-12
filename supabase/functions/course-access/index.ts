/**
 * Course Access Edge Function
 * Endpoint: GET /courses?subject=&grade=, GET /lessons/:id
 * Handles UC-02 (Access Materials)
 * Owner: Jason
 */

import { validateCourseListQuery, validateLessonId } from "./validation.ts"
import { listApprovedCourses, getLessonDetail } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getUserClient } from "../_shared/db.ts"
import { AppError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const claims = await validateJWT(req)

		const url = new URL(req.url)
		const path = url.pathname

		const supabase = getUserClient(
			req.headers.get("Authorization")!.replace("Bearer ", "")
		)

		// GET /courses?subject=MATH&grade=X
		if (path.endsWith("/courses") && req.method === "GET") {
			const query = validateCourseListQuery(url.searchParams)
			const result = await listApprovedCourses(supabase, query)
			return successResponse(result, 200)
		}

		// GET /lessons/:id
		const lessonMatch = path.match(/\/lessons\/([^/]+)$/)
		if (lessonMatch && req.method === "GET") {
			const lessonId = validateLessonId(lessonMatch[1])
			const result = await getLessonDetail(supabase, lessonId, claims.sub)
			return successResponse(result, 200)
		}

		return errorResponse("Not found", 404)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})