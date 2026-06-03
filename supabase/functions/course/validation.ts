import { CreateCourseRequest } from "./types.ts"

export function validateCreateCourseRequest(body: unknown): CreateCourseRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { title, subject, grade, lessons } = body as Record<string, unknown>

	if (!title || typeof title !== "string") {
		throw new Error("title is required")
	}
	if (!["MATHEMATICS", "PHYSICS", "CHEMISTRY"].includes(subject as string)) {
		throw new Error("subject must be MATHEMATICS, PHYSICS, or CHEMISTRY")
	}
	if (!["X", "XI", "XII"].includes(grade as string)) {
		throw new Error("grade must be X, XI, or XII")
	}
	if (!Array.isArray(lessons) || lessons.length === 0) {
		throw new Error("at least one lesson is required")
	}

	for (const lesson of lessons) {
		if (!lesson.title || typeof lesson.title !== "string") {
			throw new Error("lesson title is required")
		}
		if (typeof lesson.isPremium !== "boolean") {
			throw new Error("lesson isPremium is required")
		}
		if (typeof lesson.order !== "number") {
			throw new Error("lesson order is required")
		}
	}

	return body as CreateCourseRequest
}