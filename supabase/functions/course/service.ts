/**
 * Course Edge Function
 * Endpoint: POST /course
 * Handles UC-08 (Create Course Content)
 * Owner: Grevi
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { CreateCourseRequest, CourseResponse } from "./types.ts"
import { AppError } from "../_shared/errors.ts"

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

	//insert lessons
	for (const lessonReq of request.lessons) {
		const { data: lesson, error: lessonError } = await supabase
			.from("lessons")
			.insert({
				course_id: course.id,
				title: lessonReq.title,
				video_url: lessonReq.videoUrl ?? null,
				rich_text_content: lessonReq.richTextContent ?? null,
				summary: lessonReq.summary ?? null,
				is_premium: lessonReq.isPremium,
				order: lessonReq.order,
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

	return {
		courseId: course.id,
		status: "PENDING_APPROVAL",
	}
}