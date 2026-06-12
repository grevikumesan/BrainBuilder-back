/**
 * Course Access Edge Function
 * Endpoint: GET /courses, GET /lessons/:id
 * Handles UC-02 (Access Materials)
 * Owner: Jason
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
	CourseListItem,
	CourseListResponse,
	LessonDetailResponse,
	CourseRow,
	LessonRow,
	QuizSummary,
} from "./types.ts"
import { CourseListQuery } from "./validation.ts"
import { NotFoundError, ForbiddenError, AppError } from "../_shared/errors.ts"

export async function listApprovedCourses(
	supabase: SupabaseClient,
	query: CourseListQuery
): Promise<CourseListResponse> {
	const { data, error } = await supabase
		.from("courses")
		.select("id, subject, grade, title, description, created_at")
		.eq("subject", query.subject)
		.eq("grade", query.grade)
		.eq("status", "APPROVED")
		.order("created_at", { ascending: false })

	if (error) {
		throw new AppError("Failed to fetch courses")
	}

	const courses: CourseListItem[] = (data as CourseRow[]).map((row) => ({
		id: row.id,
		subject: row.subject,
		grade: row.grade,
		title: row.title,
		description: row.description,
		createdAt: row.created_at,
	}))

	return { courses }
}

export async function getLessonDetail(
	supabase: SupabaseClient,
	lessonId: string,
	userId: string
): Promise<LessonDetailResponse> {
	// Fetch lesson including isPremium flag
	const { data: lessonData, error: lessonError } = await supabase
		.from("lessons")
		.select("id, course_id, title, video_url, rich_text_content, summary, is_premium, lesson_order")
		.eq("id", lessonId)
		.single()

	if (lessonError || !lessonData) {
		throw new NotFoundError("Lesson not found")
	}

	const lesson = lessonData as LessonRow

	// Check premium access gating
	const accessAllowed = await checkLessonAccess(supabase, lesson.is_premium, userId)

	if (!accessAllowed) {
		// Withhold premium content from students without an active subscription
		// (UC-02 Ext 4a); return only the gating flag and an empty lesson shell
		const gatedLesson = mapLessonRow(lesson, null)
		gatedLesson.videoUrl = ""
		gatedLesson.richTextContent = ""
		gatedLesson.summary = "Premium access required to view content"
		return {
			lesson: gatedLesson,
			accessAllowed: false,
		}
	}

	// Fetch quiz for this lesson (if any)
	const quiz = await fetchQuizSummary(supabase, lessonId)

	// Record lesson view in progress log
	await recordLessonView(supabase, userId, lesson.course_id)

	return {
		lesson: mapLessonRow(lesson, quiz),
		accessAllowed: true,
	}
}

async function checkLessonAccess(
	supabase: SupabaseClient,
	isPremium: boolean,
	userId: string
): Promise<boolean> {
	// Non-premium lessons are always accessible
	if (!isPremium) return true

	// Check if student has an active subscription
	const { data, error } = await supabase
		.from("subscriptions")
		.select("status")
		.eq("user_id", userId)
		.eq("status", "ACTIVE")
		.maybeSingle()

	if (error) {
		throw new AppError("Failed to verify subscription status")
	}

	return data !== null
}

async function fetchQuizSummary(
	supabase: SupabaseClient,
	lessonId: string
): Promise<QuizSummary | null> {
	const { data: quiz, error } = await supabase
		.from("quizzes")
		.select("id, lesson_id")
		.eq("lesson_id", lessonId)
		.maybeSingle()

	if (error || !quiz) return null

	// Return the questions needed to render and answer the quiz, but never the
	// answer key — correct_answer is deliberately excluded so it cannot leak
	const { data: questions, error: questionsError } = await supabase
		.from("questions")
		.select("id, type, prompt, options")
		.eq("quiz_id", quiz.id)
		.order("created_at", { ascending: true })

	if (questionsError) return null

	return {
		id: quiz.id,
		lessonId: quiz.lesson_id,
		questions: (questions ?? []).map((q) => ({
			id: q.id,
			type: q.type,
			prompt: q.prompt,
			options: q.options ?? null,
		})),
	}
}

async function recordLessonView(
	supabase: SupabaseClient,
	userId: string,
	courseId: string
): Promise<void> {
	await supabase
		.from("enrollments")
		.upsert(
			{
				user_id: userId,
				course_id: courseId,
				last_accessed_at: new Date().toISOString(),
			},
			{ onConflict: "user_id,course_id" }
		)
}

function mapLessonRow(
	row: LessonRow,
	quiz: QuizRow | null
) {
	return {
		id: row.id,
		courseId: row.course_id,
		title: row.title,
		videoUrl: row.video_url,
		richTextContent: row.rich_text_content,
		summary: row.summary,
		isPremium: row.is_premium,
		order: row.lesson_order,
		quiz: quiz,
	}
}