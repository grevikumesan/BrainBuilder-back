export interface Plan {
	id: string
	name: string
	price: number
	durationDays: number
}
 
export interface SubscriptionStatus {
	status: "ACTIVE" | "INACTIVE" | "EXPIRED"
	planId: string | null
	planName: string | null
	startDate: string | null
	expiryDate: string | null
}
 
export interface ManageSubscriptionSummary {
	plans: Plan[]
	currentSubscription: SubscriptionStatus
}
 
export interface PlanRow {
	id: string
	name: string
	price: number
	duration_days: number
}
 
export interface SubscriptionRow {
	status: string
	plan_id: string | null
	start_date: string | null
	expires_at: string | null
	plans: {
		name: string
	} | null
}