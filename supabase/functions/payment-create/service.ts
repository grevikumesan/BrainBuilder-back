/**
 * Payment Create Edge Function
 * Endpoint: POST /payment/create
 * Handles UC-07 (Payment Process)
 * Owner: FJ
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { CreatePaymentRequest, MidtransChargeResponse } from "./types.ts"
import { NotFoundError, AppError } from "../_shared/errors.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? ""
const MIDTRANS_API_URL = Deno.env.get("MIDTRANS_API_URL") ?? "https://app.sandbox.midtrans.com/snap/v1/transactions"

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

	const orderId = `BB-${request.userId}-${Date.now()}`

	const { error: txError } = await supabase
		.from("transactions")
		.insert({
			order_id: orderId,
			user_id: request.userId,
			plan_id: request.planId,
			amount: plan.price,
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
			"Authorization": `Basic ${btoa(MIDTRANS_SERVER_KEY + ":")}`
		},
		body: JSON.stringify({
			transaction_details: {
				order_id: orderId,
				gross_amount: plan.price,
			},
			customer_details: {
				customer_id: request.userId,
			}
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