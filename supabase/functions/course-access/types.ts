export type Subject = "MATH" | "PHYSICS" | "CHEMISTRY"
export type Grade = "X" | "XI" | "XII"
export type CourseStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"

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
	status: string
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

export interface QuizSummary {
	id: string
	lessonId: string
}

export interface CourseListResponse {
	courses: CourseListItem[]
}

export interface LessonDetailResponse {
	lesson: LessonDetail
	accessAllowed: boolean
}