/**
 * Payment Webhook Edge Function
 * Endpoint: POST /payment/webhook
 * Handles UC-07 (Payment Process — async callback)
 * Owner: FJ
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { MidtransCallbackPayload } from "./types.ts"
import { AppError, NotFoundError } from "../_shared/errors.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? ""

export async function verifyMidtransSignature(
	payload: MidtransCallbackPayload
): Promise<boolean> {
	const rawString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${MIDTRANS_SERVER_KEY}`
	const encoder = new TextEncoder()
	const data = encoder.encode(rawString)
	const hashBuffer = await crypto.subtle.digest("SHA-512", data)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	const computedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

	return computedSignature === payload.signature_key
}

export async function handlePaymentCallback(
	supabase: SupabaseClient,
	payload: MidtransCallbackPayload
): Promise<void> {
	const isValid = await verifyMidtransSignature(payload)
	if (!isValid) {
		throw new AppError("Invalid signature", 400)
	}

	const isSuccess =
		(payload.transaction_status === "capture" && payload.fraud_status === "accept") ||
		payload.transaction_status === "settlement"

	const isFailed =
		payload.transaction_status === "cancel" ||
		payload.transaction_status === "deny" ||
		payload.transaction_status === "expire" ||
		(payload.transaction_status === "capture" && payload.fraud_status === "challenge")

	const finalStatus = isSuccess ? "SUCCESS" : isFailed ? "FAILED" : "PENDING"

	const { data: transaction, error: txError } = await supabase
		.from("transactions")
		.update({ status: finalStatus })
		.eq("order_id", payload.order_id)
		.select("user_id, plan_id")
		.single()

	if (txError || !transaction) {
		throw new NotFoundError("Transaction not found")
	}

	if (isSuccess) {
		const { data: plan } = await supabase
			.from("plans")
			.select("duration_days")
			.eq("id", transaction.plan_id)
			.single()

		const expiryDate = new Date()
		expiryDate.setDate(expiryDate.getDate() + (plan?.duration_days ?? 30))

		await supabase
			.from("subscriptions")
			.upsert({
				user_id: transaction.user_id,
				plan_id: transaction.plan_id,
				status: "ACTIVE",
				start_date: new Date().toISOString(),
				expires_at: expiryDate.toISOString(),
			})
	}
}