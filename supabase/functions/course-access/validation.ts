import { Subject, Grade } from "./types.ts"

const VALID_SUBJECTS: Subject[] = ["MATH", "PHYSICS", "CHEMISTRY"]
const VALID_GRADES: Grade[] = ["X", "XI", "XII"]

export interface CourseListQuery {
	subject: Subject
	grade: Grade
}

export function validateCourseListQuery(params: URLSearchParams): CourseListQuery {
	const subject = params.get("subject")
	const grade = params.get("grade")

	if (!subject) {
		throw new Error("subject query param is required")
	}
	if (!VALID_SUBJECTS.includes(subject as Subject)) {
		throw new Error("subject must be one of: MATH, PHYSICS, CHEMISTRY")
	}
	if (!grade) {
		throw new Error("grade query param is required")
	}
	if (!VALID_GRADES.includes(grade as Grade)) {
		throw new Error("grade must be one of: X, XI, XII")
	}

	return {
		subject: subject as Subject,
		grade: grade as Grade,
	}
}

export function validateLessonId(id: string | null): string {
	if (!id || typeof id !== "string" || id.trim() === "") {
		throw new Error("lesson id is required")
	}
	return id.trim()
}