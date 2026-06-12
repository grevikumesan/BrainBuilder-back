/**
 * Course Edge Function
 * Endpoint: POST /course
 * Handles UC-08 (Create Course Content)
 * Owner: Grevi
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
	CreateCourseRequest,
	CreateLessonRequest,
	UpdateCourseRequest,
	CourseResponse,
	TeacherCoursesResponse,
} from "./types.ts"
import { AppError, NotFoundError, ForbiddenError } from "../_shared/errors.ts"

export async function createCourse(
	supabase: SupabaseClient,
	request: CreateCourseRequest,
	teacherId: string
): Promise<CourseResponse> {
	//insert course
	const { data: course, error: courseError } = await supabase
		.from("courses")
		.insert({
			teacher_id: teacherId,
			title: request.title,
			description: request.description ?? null,
			subject: request.subject,
			grade: request.grade,
			status: "PENDING_APPROVAL",
		})
		.select("id")
		.single()

	if (courseError || !course) {
		throw new AppError("Failed to create course")
	}

	await insertLessons(supabase, course.id, request.lessons)

	return {
		courseId: course.id,
		status: "PENDING_APPROVAL",
	}
}

// List the authenticated teacher's own courses (UC-08 / FR-11) so they can see
// status + rejection reason and revise a rejected course
export async function listTeacherCourses(
	supabase: SupabaseClient,
	teacherId: string
): Promise<TeacherCoursesResponse> {
	const { data, error } = await supabase
		.from("courses")
		.select("id, title, subject, grade, status, rejection_reason, created_at")
		.eq("teacher_id", teacherId)
		.order("created_at", { ascending: false })

	if (error) {
		throw new AppError("Failed to fetch courses")
	}

	return {
		courses: (data ?? []).map((c) => ({
			id: c.id,
			title: c.title,
			subject: c.subject,
			grade: c.grade,
			status: c.status,
			rejectionReason: c.rejection_reason ?? null,
			createdAt: c.created_at,
		})),
	}
}

// Edit an existing course and resubmit it for approval (UC-08 Ext 5a / FR-11).
// Only the owning teacher may edit; lessons/quizzes are fully replaced.
export async function updateCourse(
	supabase: SupabaseClient,
	request: UpdateCourseRequest,
	teacherId: string
): Promise<CourseResponse> {
	const { data: existing, error: findError } = await supabase
		.from("courses")
		.select("id, teacher_id")
		.eq("id", request.courseId)
		.single()

	if (findError || !existing) {
		throw new NotFoundError("Course not found")
	}
	if (existing.teacher_id !== teacherId) {
		throw new ForbiddenError()
	}

	const { error: updateError } = await supabase
		.from("courses")
		.update({
			title: request.title,
			description: request.description ?? null,
			subject: request.subject,
			grade: request.grade,
			status: "PENDING_APPROVAL",
			rejection_reason: null,
		})
		.eq("id", request.courseId)

	if (updateError) {
		throw new AppError("Failed to update course")
	}

	// Replace the course's lessons (FK cascade removes old quizzes/questions/explanations)
	const { error: deleteError } = await supabase
		.from("lessons")
		.delete()
		.eq("course_id", request.courseId)

	if (deleteError) {
		throw new AppError("Failed to update course lessons")
	}

	await insertLessons(supabase, request.courseId, request.lessons)

	return {
		courseId: request.courseId,
		status: "PENDING_APPROVAL",
	}
}

async function insertLessons(
	supabase: SupabaseClient,
	courseId: string,
	lessons: CreateLessonRequest[]
): Promise<void> {
	for (const lessonReq of lessons) {
		const { data: lesson, error: lessonError } = await supabase
			.from("lessons")
			.insert({
				course_id: courseId,
				title: lessonReq.title,
				video_url: lessonReq.videoUrl ?? null,
				rich_text_content: lessonReq.richTextContent ?? null,
				summary: lessonReq.summary ?? null,
				is_premium: lessonReq.isPremium,
				lesson_order: lessonReq.order,
			})
			.select("id")
			.single()

		if (lessonError || !lesson) {
			throw new AppError("Failed to create lesson")
		}

		//insert quiz if exists
		if (lessonReq.quiz) {
			const { data: quiz, error: quizError } = await supabase
				.from("quizzes")
				.insert({ lesson_id: lesson.id })
				.select("id")
				.single()

			if (quizError || !quiz) {
				throw new AppError("Failed to create quiz")
			}

			//insert questions
			for (const questionReq of lessonReq.quiz.questions) {
				const { data: question, error: questionError } = await supabase
					.from("questions")
					.insert({
						quiz_id: quiz.id,
						type: questionReq.type,
						prompt: questionReq.prompt,
						options: questionReq.options ?? null,
						correct_answer: questionReq.correctAnswer,
					})
					.select("id")
					.single()

				if (questionError || !question) {
					throw new AppError("Failed to create question")
				}

				//insert explanation if exists
				if (questionReq.explanation) {
					const { error: expError } = await supabase
						.from("explanations")
						.insert({
							question_id: question.id,
							steps: questionReq.explanation.steps,
						})

					if (expError) {
						throw new AppError("Failed to create explanation")
					}
				}
			}
		}
	}
}