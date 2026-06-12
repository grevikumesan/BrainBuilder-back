export interface CourseProgress {
	courseId: string
	courseTitle: string
	subject: string
	grade: string
	completionPct: number
	totalLessons: number
	completedLessons: number
	lastAccessedAt?: string
}

export interface QuizScoreHistory {
	quizId: string
	lessonTitle: string
	courseTitle: string
	score: number
	submittedAt: string
}

export interface RecommendedTopic {
	courseId: string
	courseTitle: string
	lessonId: string
	lessonTitle: string
	avgScore: number
}

export interface ProgressSummary {
	hasStarted: boolean
	courses: CourseProgress[]
	scoreHistory: QuizScoreHistory[]
	recommendedTopics: RecommendedTopic[]
}

export interface EnrollmentRow {
	course_id: string
	completed_lessons: number | null
	total_lessons: number | null
	last_accessed_at: string | null
}

export interface CourseMetaRow {
	id: string
	title: string
	subject: string
	grade: string
}

export interface SubmissionRow {
	quiz_id: string
	score: number
	submitted_at: string
	quizzes: {
		lesson_id: string
		lessons: {
			title: string
			course_id: string
		} | null
	} | null
}

export interface LessonScoreAccumulator {
	lessonId: string
	lessonTitle: string
	courseId: string
	scores: number[]
}