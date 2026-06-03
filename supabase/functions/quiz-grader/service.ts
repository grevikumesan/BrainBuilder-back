/**
 * Quiz Grader Edge Function
 * Endpoint: POST /grade
 * Handles UC-03 (Grading and Explanation)
 * Owner: Jason
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GradeQuizRequest, GradeQuizResponse, QuestionResult } from "./types.ts"
import { AppError } from "../_shared/errors.ts"

export async function gradeQuiz(
	supabase: SupabaseClient,
	request: GradeQuizRequest,
	userId: string
): Promise<GradeQuizResponse> {
	const { data: questions, error: questionsError } = await supabase
		.from("questions")
		.select("id, correct_answer")
		.eq("quiz_id", request.quizId)

	if (questionsError || !questions) {
		throw new AppError("Failed to fetch answer key")
	}

	const perQuestionCorrectness: QuestionResult[] = compareAnswers(
		questions,
		request.answers
	)

	const score = calculateScore(perQuestionCorrectness)

	const anyIncorrect = perQuestionCorrectness.some((q) => !q.isCorrect)

	const { data: submission, error: submissionError } = await supabase
		.from("submissions")
		.insert({
			user_id: userId,
			quiz_id: request.quizId,
			answers: request.answers,
			per_question_correctness: Object.fromEntries(
				perQuestionCorrectness.map((q) => [q.questionId, q.isCorrect])
			),
			score,
			submitted_at: new Date().toISOString(),
		})
		.select("id")
		.single()

	if (submissionError || !submission) {
		throw new AppError("Failed to save submission")
	}

	return {
		submissionId: submission.id,
		score,
		perQuestionCorrectness,
		anyIncorrect,
	}
}

function compareAnswers(
	questions: { id: string; correct_answer: string }[],
	answers: Record<string, string>
): QuestionResult[] {
	return questions.map((question) => {
		const submitted = answers[question.id]?.trim().toLowerCase() ?? ""
		const correct = question.correct_answer.trim().toLowerCase()
		return {
			questionId: question.id,
			isCorrect: submitted === correct,
		}
	})
}

function calculateScore(results: QuestionResult[]): number {
	if (results.length === 0) return 0
	const correctCount = results.filter((r) => r.isCorrect).length
	return Math.round((correctCount / results.length) * 100)
}