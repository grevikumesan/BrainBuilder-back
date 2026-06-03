export type AdminAction =
	| "ACTIVATE_USER"
	| "SUSPEND_USER"
	| "REMOVE_USER"
	| "APPROVE_COURSE"
	| "REJECT_COURSE"

export interface ListItemsResponse {
	users: UserItem[]
	pendingCourses: PendingCourseItem[]
}

export interface UserItem {
	id: string
	name: string
	email: string
	role: string
	status: string
	createdAt: string
}

export interface PendingCourseItem {
	id: string
	title: string
	subject: string
	grade: string
	teacherId: string
	createdAt: string
}

export interface ApplyActionRequest {
	targetId: string
	action: AdminAction
	reason?: string
}