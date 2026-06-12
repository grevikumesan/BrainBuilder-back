import { GradeQuizRequest } from "./types.ts"

export function validateGradeQuizRequest(body: unknown): GradeQuizRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { quizId, answers } = body as Record<string, unknown>

	if (!quizId || typeof quizId !== "string") {
		throw new Error("quizId is required")
	}
	if (
		!answers ||
		typeof answers !== "object" ||
		Array.isArray(answers)
	) {
		throw new Error("answers must be a non-empty object")
	}
	if (Object.keys(answers).length === 0) {
		throw new Error("answers must not be empty")
	}

	for (const [questionId, answer] of Object.entries(answers)) {
		if (typeof questionId !== "string" || questionId.trim() === "") {
			throw new Error("each answer key must be a non-empty string questionId")
		}
		if (typeof answer !== "string") {
			throw new Error(`answer for question ${questionId} must be a string`)
		}
	}

	return body as GradeQuizRequest
}