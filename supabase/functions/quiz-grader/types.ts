export interface GradeQuizRequest {
	quizId: string
	answers: Record<string, string>
}

export interface QuestionResult {
	questionId: string
	isCorrect: boolean
}

export interface GradeQuizResponse {
	submissionId: string
	score: number
	perQuestionCorrectness: QuestionResult[]
	anyIncorrect: boolean
}