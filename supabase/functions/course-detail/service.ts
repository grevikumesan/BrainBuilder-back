/**
 * Course Detail Edge Function
 * Endpoint: GET /course-detail
 * Handles UC-04 (View Course Content)
 * Owner: Jason
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { CourseDetailResponse, LessonDetail } from "./types.ts"
import { AppError } from "../_shared/errors.ts"

async function getCourseBase(supabase: SupabaseClient, courseId: string) {
    const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, subject, grade")
        .eq("id", courseId)
        .single()
        
    if (error || !data) {
        throw new AppError("Course not found", 404)
    }
    return data
}

async function getLessonsForCourse(supabase: SupabaseClient, courseId: string): Promise<LessonDetail[]> {
    const { data, error } = await supabase
        .from("lessons")
        .select("id, title, video_url, rich_text_content, summary, is_premium, order")
        .eq("course_id", courseId)
        .order("order", { ascending: true })
        
    if (error || !data) {
        throw new AppError("Failed to fetch lessons", 500)
    }
    return data.map(l => ({
        id: l.id,
        title: l.title,
        videoUrl: l.video_url ?? undefined,
        richTextContent: l.rich_text_content ?? undefined,
        summary: l.summary ?? undefined,
        isPremium: l.is_premium,
        order: l.order,
    }))
}

async function checkPremiumAccess(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .maybeSingle()
        
    return !error && !!data
}

export async function getCourseDetail(
    supabase: SupabaseClient,
    courseId: string,
    userId: string,
    role: string
): Promise<CourseDetailResponse> {
    const course = await getCourseBase(supabase, courseId)
    const lessons = await getLessonsForCourse(supabase, courseId)
    
    // Bypass check for teachers to allow raw content moderation/evaluation
    const hasPremiumAccess = role === "TEACHER" || await checkPremiumAccess(supabase, userId)
    
    const processedLessons = lessons.map(lesson => {
        if (lesson.isPremium && !hasPremiumAccess) {
            return { 
                ...lesson, 
                videoUrl: undefined, 
                richTextContent: undefined, 
                summary: "Premium access required to view content" 
            }
        }
        return lesson
    })

    return { ...course, lessons: processedLessons }
}