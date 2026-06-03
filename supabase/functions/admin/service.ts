/**
 * Admin Edge Function
 * Endpoint: GET /admin/items, POST /admin/action
 * Handles UC-09 (Manage User)
 * Owner: Hans
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AdminAction, ListItemsResponse, ApplyActionRequest } from "./types.ts"
import { AppError, NotFoundError } from "../_shared/errors.ts"

export async function listPendingItems(
	supabase: SupabaseClient
): Promise<ListItemsResponse> {
	// Fetch all users
	const { data: users, error: usersError } = await supabase
		.from("users")
		.select("id, name, email, role, status, created_at")
		.order("created_at", { ascending: false })

	if (usersError) {
		throw new AppError("Failed to fetch users")
	}

	// Fetch pending courses
	const { data: pendingCourses, error: coursesError } = await supabase
		.from("courses")
		.select("id, title, subject, grade, teacher_id, created_at")
		.eq("status", "PENDING_APPROVAL")
		.order("created_at", { ascending: true })

	if (coursesError) {
		throw new AppError("Failed to fetch pending courses")
	}

	return {
		users: users.map(u => ({
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role,
			status: u.status,
			createdAt: u.created_at,
		})),
		pendingCourses: pendingCourses.map(c => ({
			id: c.id,
			title: c.title,
			subject: c.subject,
			grade: c.grade,
			teacherId: c.teacher_id,
			createdAt: c.created_at,
		})),
	}
}

export async function applyAction(
	supabase: SupabaseClient,
	adminId: string,
	request: ApplyActionRequest
): Promise<void> {
	const userActions: AdminAction[] = ["ACTIVATE_USER", "SUSPEND_USER", "REMOVE_USER"]
	const courseActions: AdminAction[] = ["APPROVE_COURSE", "REJECT_COURSE"]

	if (userActions.includes(request.action)) {
		await handleUserAction(supabase, adminId, request)
	} else if (courseActions.includes(request.action)) {
		await handleCourseAction(supabase, adminId, request)
	}
}

async function handleUserAction(
	supabase: SupabaseClient,
	adminId: string,
	request: ApplyActionRequest
): Promise<void> {
	const { data: user, error: userError } = await supabase
		.from("users")
		.select("id")
		.eq("id", request.targetId)
		.single()

	if (userError || !user) {
		throw new NotFoundError("User not found")
	}

	if (request.action === "REMOVE_USER") {
		const { error } = await supabase
			.from("users")
			.delete()
			.eq("id", request.targetId)

		if (error) throw new AppError("Failed to remove user")
	} else {
		const newStatus = request.action === "ACTIVATE_USER" ? "ACTIVE" : "SUSPENDED"

		const { error } = await supabase
			.from("users")
			.update({ status: newStatus })
			.eq("id", request.targetId)

		if (error) throw new AppError("Failed to update user status")
	}

	// Log action (NFR-11, append-only)
	await logAction(supabase, adminId, request)
}

async function handleCourseAction(
	supabase: SupabaseClient,
	adminId: string,
	request: ApplyActionRequest
): Promise<void> {
	const { data: course, error: courseError } = await supabase
		.from("courses")
		.select("id")
		.eq("id", request.targetId)
		.single()

	if (courseError || !course) {
		throw new NotFoundError("Course not found")
	}

	const newStatus = request.action === "APPROVE_COURSE" ? "APPROVED" : "REJECTED"

	const { error } = await supabase
		.from("courses")
		.update({
			status: newStatus,
			rejection_reason: request.reason ?? null,
		})
		.eq("id", request.targetId)

	if (error) throw new AppError("Failed to update course status")

	// Log action (NFR-11, append-only)
	await logAction(supabase, adminId, request)
}

async function logAction(
	supabase: SupabaseClient,
	adminId: string,
	request: ApplyActionRequest
): Promise<void> {
	const { error } = await supabase
		.from("audit_log")
		.insert({
			admin_id: adminId,
			target_id: request.targetId,
			action: request.action,
			reason: request.reason ?? null,
			timestamp: new Date().toISOString(),
		})

	if (error) throw new AppError("Failed to log action")
}