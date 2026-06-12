export type Subject = "MATHEMATICS" | "PHYSICS" | "CHEMISTRY"
export type Grade = "X" | "XI" | "XII"
export type CourseStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

export interface CourseRow {
	id: string
	teacher_id: string
	subject: Subject
	grade: Grade
	title: string
	description: string
	status: CourseStatus
	created_at: string
}

export interface LessonRow {
	id: string
	course_id: string
	title: string
	video_url: string
	rich_text_content: string
	summary: string
	is_premium: boolean
	lesson_order: number
}

export interface QuizRow {
	id: string
	lesson_id: string
}

export interface CourseListItem {
	id: string
	subject: Subject
	grade: Grade
	title: string
	description: string
	createdAt: string
}

export interface LessonDetail {
	id: string
	courseId: string
	title: string
	videoUrl: string
	richTextContent: string
	summary: string
	isPremium: boolean
	order: number
	quiz: QuizSummary | null
}

export interface QuizQuestion {
	id: string
	type: string
	prompt: string
	options: string[] | null
}

export interface QuizSummary {
	id: string
	lessonId: string
	questions: QuizQuestion[]
}

export interface CourseListResponse {
	courses: CourseListItem[]
}

export interface LessonDetailResponse {
	lesson: LessonDetail
	accessAllowed: boolean
}