export interface CreateCourseRequest {
	title: string
	description?: string
	subject: "MATHEMATICS" | "PHYSICS" | "CHEMISTRY"
	grade: "X" | "XI" | "XII"
	lessons: CreateLessonRequest[]
}

export interface CreateLessonRequest {
	title: string
	videoUrl?: string
	richTextContent?: string
	summary?: string
	isPremium: boolean
	order: number
	quiz?: CreateQuizRequest
}

export interface CreateQuizRequest {
	questions: CreateQuestionRequest[]
}

export interface CreateQuestionRequest {
	type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
	prompt: string
	options?: string[]
	correctAnswer: string
	explanation?: CreateExplanationRequest
}

export interface CreateExplanationRequest {
	steps: string[]
}

export interface CourseResponse {
	courseId: string
	status: "PENDING_APPROVAL"
}

export interface UpdateCourseRequest extends CreateCourseRequest {
	courseId: string
}

export interface TeacherCourseItem {
	id: string
	title: string
	subject: string
	grade: string
	status: string
	rejectionReason: string | null
	createdAt: string
}

export interface TeacherCoursesResponse {
	courses: TeacherCourseItem[]
}