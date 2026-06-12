/**
 * Payment Create Edge Function
 * Endpoint: POST /payment/create
 * Handles UC-07 (Payment Process)
 * Owner: Grevi
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { CreatePaymentRequest, MidtransChargeResponse } from "./types.ts"
import { NotFoundError, AppError } from "../_shared/errors.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? ""
const MIDTRANS_MERCHANT_ID = Deno.env.get("MIDTRANS_MERCHANT_ID") ?? ""
const MIDTRANS_IS_PRODUCTION = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true"
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
	? "https://app.midtrans.com/snap/v1/transactions"
	: "https://app.sandbox.midtrans.com/snap/v1/transactions"

export async function getPlans(
	supabase: SupabaseClient
): Promise<unknown> {
	const { data: plans, error } = await supabase
		.from("plans")
		.select("id, name, price, duration_days")
		.order("price", { ascending: true })

	if (error) throw new AppError("Failed to fetch plans")
	return plans
}

export async function getSubscriptionStatus(
	supabase: SupabaseClient,
	userId: string
): Promise<unknown> {
	const { data: subscription, error } = await supabase
		.from("subscriptions")
		.select("id, status, start_date, expires_at")
		.eq("user_id", userId)
		.single()

	if (error) return { status: "INACTIVE" }
	return subscription
}

export async function createPaymentTransaction(
	supabase: SupabaseClient,
	request: CreatePaymentRequest & { userId: string }
): Promise<MidtransChargeResponse> {
	const { data: plan, error: planError } = await supabase
		.from("plans")
		.select("id, name, price, duration_days")
		.eq("id", request.planId)
		.single()

	if (planError || !plan) {
		throw new NotFoundError("Plan not found")
	}

	// Midtrans caps order_id at 50 chars, so keep it short and unique
	const orderId = `BB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

	// Midtrans requires an integer gross_amount for IDR (no decimals)
	const amount = Math.round(Number(plan.price))

	const { error: txError } = await supabase
		.from("transactions")
		.insert({
			order_id: orderId,
			user_id: request.userId,
			plan_id: request.planId,
			amount: amount,
			status: "PENDING",
			created_at: new Date().toISOString(),
		})

	if (txError) {
		throw new AppError("Failed to create transaction record")
	}

	const midtransResponse = await fetch(MIDTRANS_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Basic ${btoa(MIDTRANS_SERVER_KEY + ":")}`,
			// Route callbacks to this project's webhook per-transaction, so the
			// shared Midtrans sandbox dashboard URL (used by another project)
			// stays untouched (UC-07)
			"X-Override-Notification": `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`
		},
		body: JSON.stringify({
			transaction_details: {
				order_id: orderId,
				gross_amount: amount,
			},
			customer_details: {
				customer_id: request.userId,
			},
			item_details: [
				{
					id: plan.id,
					price: amount,
					quantity: 1,
					name: plan.name,
				}
			]
		})
	})

	if (!midtransResponse.ok) {
		throw new AppError("Failed to create Midtrans transaction")
	}

	const midtransData = await midtransResponse.json()

	return {
		paymentUrl: midtransData.redirect_url,
		orderId,
	}
}