import { ApplyActionRequest, AdminAction } from "./types.ts"

const VALID_ACTIONS: AdminAction[] = [
	"ACTIVATE_USER",
	"SUSPEND_USER",
	"REMOVE_USER",
	"APPROVE_COURSE",
	"REJECT_COURSE",
]

export function validateApplyActionRequest(body: unknown): ApplyActionRequest {
	if (!body || typeof body !== "object") {
		throw new Error("Invalid request body")
	}

	const { targetId, action, reason } = body as Record<string, unknown>

	if (!targetId || typeof targetId !== "string") {
		throw new Error("targetId is required")
	}
	if (!action || !VALID_ACTIONS.includes(action as AdminAction)) {
		throw new Error(`action must be one of: ${VALID_ACTIONS.join(", ")}`)
	}
	if (action === "REJECT_COURSE" && (!reason || typeof reason !== "string")) {
		throw new Error("reason is required when rejecting a course")
	}

	return { targetId, action: action as AdminAction, reason: reason as string | undefined }
}