import { CourseDetailRequest } from "./types.ts"

export function validateCourseDetailRequest(url: string): CourseDetailRequest {
    const parsedUrl = new URL(url)
    const courseId = parsedUrl.searchParams.get("courseId")
    
    if (!courseId || courseId.trim() === "") {
        throw new Error("courseId query parameter is required")
    }
    
    return { courseId }
}