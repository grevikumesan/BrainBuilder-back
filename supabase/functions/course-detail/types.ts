export interface CourseDetailRequest {
    courseId: string
}

export interface LessonDetail {
    id: string
    title: string
    videoUrl?: string
    richTextContent?: string
    summary?: string
    isPremium: boolean
    order: number
}

export interface CourseDetailResponse {
    id: string
    title: string
    description?: string
    subject: string
    grade: string
    lessons: LessonDetail[]
}