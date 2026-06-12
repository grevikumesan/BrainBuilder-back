/**
 * Manage Subscription Edge Function
 * Endpoint: GET /manage-subscription
 * Handles UC-06 (Manage Subscription) — fetches available plans and the
 * student's current subscription status for display on the Subscription page.
 * Initiating a purchase delegates to UC-07 (payment-create).
 * Owner: Dharma
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
	ManageSubscriptionSummary,
	Plan,
	PlanRow,
	SubscriptionRow,
	SubscriptionStatus,
} from "./types.ts"
import { AppError } from "../_shared/errors.ts"
 
async function fetchPlans(supabase: SupabaseClient): Promise<Plan[]> {
	const { data, error } = await supabase
		.from("plans")
		.select("id, name, price, duration_days")
		.order("price", { ascending: true })
 
	if (error) throw new AppError("Failed to fetch subscription plans", 500)
 
	return (data ?? []).map((p: PlanRow) => ({
		id: p.id,
		name: p.name,
		price: p.price,
		durationDays: p.duration_days,
	}))
}
 
async function fetchCurrentSubscription(
	supabase: SupabaseClient,
	userId: string
): Promise<SubscriptionRow | null> {
	const { data, error } = await supabase
		.from("subscriptions")
		.select("status, plan_id, start_date, expires_at, plans(name)")
		.eq("user_id", userId)
		.order("start_date", { ascending: false })
		.limit(1)
		.maybeSingle()
 
	if (error) throw new AppError("Failed to fetch subscription status", 500)
	return data as SubscriptionRow | null
}
 
function resolveSubscriptionStatus(row: SubscriptionRow | null): SubscriptionStatus {
	if (!row) {
		return { status: "INACTIVE", planId: null, planName: null, startDate: null, expiryDate: null }
	}
 
	// Guard against a subscription that was ACTIVE but its expiry has passed
	const isExpired =
		row.status === "ACTIVE" &&
		row.expires_at !== null &&
		new Date(row.expires_at) < new Date()
 
	return {
		status: isExpired ? "EXPIRED" : (row.status as SubscriptionStatus["status"]),
		planId: row.plan_id,
		planName: row.plans?.name ?? null,
		startDate: row.start_date,
		expiryDate: row.expires_at,
	}
}
 
export async function getSubscriptionPage(
	supabase: SupabaseClient,
	userId: string
): Promise<ManageSubscriptionSummary> {
	// Fetch plans and current subscription in parallel (Combined Fetch pattern)
	const [plans, subscriptionRow] = await Promise.all([
		fetchPlans(supabase),
		fetchCurrentSubscription(supabase, userId),
	])
 
	const currentSubscription = resolveSubscriptionStatus(subscriptionRow)
 
	return { plans, currentSubscription }
}