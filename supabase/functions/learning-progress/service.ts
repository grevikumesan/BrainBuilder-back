/**
 * Track Learning Progress Edge Function
 * Endpoint: GET /track-progress
 * Handles UC-05 (Track Learning Progress)
 * Owner: Dharma
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
	CourseMetaRow,
	CourseProgress,
	EnrollmentRow,
	LessonScoreAccumulator,
	ProgressSummary,
	QuizScoreHistory,
	RecommendedTopic,
	SubmissionRow,
} from "./types.ts"
import { AppError } from "../_shared/errors.ts"
 
async function fetchEnrollments(
	supabase: SupabaseClient,
	userId: string
): Promise<EnrollmentRow[]> {
	const { data, error } = await supabase
		.from("enrollments")
		.select("course_id, completed_lessons, total_lessons, last_accessed_at")
		.eq("user_id", userId)
 
	if (error) throw new AppError("Failed to fetch enrollments", 500)
	return (data ?? []) as EnrollmentRow[]
}
 
async function fetchSubmissions(
	supabase: SupabaseClient,
	userId: string
): Promise<SubmissionRow[]> {
	const { data, error } = await supabase
		.from("submissions")
		.select("quiz_id, score, submitted_at, quizzes(lesson_id, lessons(title, course_id))")
		.eq("user_id", userId)
		.order("submitted_at", { ascending: false })
 
	if (error) throw new AppError("Failed to fetch submissions", 500)
	return (data ?? []) as SubmissionRow[]
}
 
async function fetchCourseMetadata(
	supabase: SupabaseClient,
	courseIds: string[]
): Promise<Map<string, CourseMetaRow>> {
	if (courseIds.length === 0) return new Map()
 
	const { data, error } = await supabase
		.from("courses")
		.select("id, title, subject, grade")
		.in("id", courseIds)
 
	if (error) throw new AppError("Failed to fetch course metadata", 500)
 
	return new Map((data ?? []).map((c: CourseMetaRow) => [c.id, c]))
}
 
function computeCourseProgress(
	enrollments: EnrollmentRow[],
	courseMetaMap: Map<string, CourseMetaRow>
): CourseProgress[] {
	return enrollments.map(e => {
		const meta = courseMetaMap.get(e.course_id)
		const total = e.total_lessons ?? 0
		const completed = e.completed_lessons ?? 0
		return {
			courseId: e.course_id,
			courseTitle: meta?.title ?? "Unknown Course",
			subject: meta?.subject ?? "",
			grade: meta?.grade ?? "",
			completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
			totalLessons: total,
			completedLessons: completed,
			lastAccessedAt: e.last_accessed_at ?? undefined,
		}
	})
}
 
function buildScoreHistory(
	submissions: SubmissionRow[],
	courseMetaMap: Map<string, CourseMetaRow>
): { scoreHistory: QuizScoreHistory[]; accumulatorMap: Map<string, LessonScoreAccumulator> } {
	const accumulatorMap = new Map<string, LessonScoreAccumulator>()
 
	const scoreHistory: QuizScoreHistory[] = submissions.map(s => {
		const lessonId = s.quizzes?.lesson_id ?? ""
		const lessonTitle = s.quizzes?.lessons?.title ?? "Unknown Lesson"
		const courseId = s.quizzes?.lessons?.course_id ?? ""
		const courseTitle = courseMetaMap.get(courseId)?.title ?? "Unknown Course"
 
		if (lessonId) {
			const existing = accumulatorMap.get(lessonId)
			if (existing) {
				existing.scores.push(s.score)
			} else {
				accumulatorMap.set(lessonId, { lessonId, lessonTitle, courseId, scores: [s.score] })
			}
		}
 
		return { quizId: s.quiz_id, lessonTitle, courseTitle, score: s.score, submittedAt: s.submitted_at }
	})
 
	return { scoreHistory, accumulatorMap }
}
 
function buildRecommendations(
	accumulatorMap: Map<string, LessonScoreAccumulator>,
	courseMetaMap: Map<string, CourseMetaRow>,
	// Lessons where average score is below this threshold are surfaced for review
	threshold = 70
): RecommendedTopic[] {
	const recommendations: RecommendedTopic[] = []
 
	for (const [, entry] of accumulatorMap) {
		const avg = entry.scores.reduce((sum, s) => sum + s, 0) / entry.scores.length
		if (avg < threshold) {
			recommendations.push({
				courseId: entry.courseId,
				courseTitle: courseMetaMap.get(entry.courseId)?.title ?? "Unknown Course",
				lessonId: entry.lessonId,
				lessonTitle: entry.lessonTitle,
				avgScore: Math.round(avg),
			})
		}
	}
 
	return recommendations.sort((a, b) => a.avgScore - b.avgScore)
}
 
export async function getProgress(
	supabase: SupabaseClient,
	userId: string
): Promise<ProgressSummary> {
	const [enrollments, submissions] = await Promise.all([
		fetchEnrollments(supabase, userId),
		fetchSubmissions(supabase, userId),
	])
 
	// "Start your first lesson" when false
	const hasStarted = submissions.length > 0
	if (!hasStarted) {
		return { hasStarted: false, courses: [], scoreHistory: [], recommendedTopics: [] }
	}
 
	const courseIds = [
		...new Set([
			...enrollments.map(e => e.course_id),
			...submissions.map(s => s.quizzes?.lessons?.course_id).filter((id): id is string => !!id),
		]),
	]
 
	const courseMetaMap = await fetchCourseMetadata(supabase, courseIds)
	const courseProgress = computeCourseProgress(enrollments, courseMetaMap)
	const { scoreHistory, accumulatorMap } = buildScoreHistory(submissions, courseMetaMap)
	const recommendedTopics = buildRecommendations(accumulatorMap, courseMetaMap)
 
	return { hasStarted: true, courses: courseProgress, scoreHistory, recommendedTopics }
}
 