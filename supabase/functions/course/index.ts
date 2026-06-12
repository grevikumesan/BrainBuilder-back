/**
 * Course Edge Function
 * Endpoint: GET /course (own courses), POST /course (create), PUT /course (edit + resubmit)
 * Handles UC-08 (Create Course Content) and FR-11 (manage courses)
 * Owner: Grevi
 */

import { validateCreateCourseRequest, validateUpdateCourseRequest } from "./validation.ts"
import { createCourse, updateCourse, listTeacherCourses } from "./service.ts"
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

		const supabase = getServiceClient()

		// GET /course — list the teacher's own courses (status + rejection reason)
		if (req.method === "GET") {
			const result = await listTeacherCourses(supabase, claims.sub)
			return successResponse(result, 200)
		}

		// PUT /course — edit an existing course and resubmit for approval
		if (req.method === "PUT") {
			const body = await req.json()
			const validated = validateUpdateCourseRequest(body)
			const result = await updateCourse(supabase, validated, claims.sub)
			return successResponse(result, 200)
		}

		// POST /course — create a new course
		if (req.method === "POST") {
			const body = await req.json()
			const validated = validateCreateCourseRequest(body)
			const result = await createCourse(supabase, validated, claims.sub)
			return successResponse(result, 201)
		}

		return errorResponse("Method not allowed", 405)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})