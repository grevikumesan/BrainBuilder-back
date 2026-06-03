/**
 * Course Detail Edge Function
 * Endpoint: GET /course-detail
 * Handles UC-04 (View Course Content)
 * Owner: Jason
 */

import { validateCourseDetailRequest } from "./validation.ts"
import { getCourseDetail } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { validateJWT } from "../_shared/jwt.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
    try {
        const claims = await validateJWT(req)
        const validated = validateCourseDetailRequest(req.url)
        const supabase = getServiceClient()
        
        const result = await getCourseDetail(
            supabase, 
            validated.courseId, 
            claims.sub, 
            claims.role ?? "STUDENT"
        )
        return successResponse(result, 200)
    } catch (error) {
        const err = error as AppError
        // Fallback for unexpected errors to ensure system runtime stability
        return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
    }
})