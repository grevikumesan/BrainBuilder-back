/**
 * Payment Webhook Edge Function
 * Endpoint: POST /payment/webhook
 * Handles UC-07 (Payment Process — async callback)
 * Owner: Grevi
 */

import { handlePaymentCallback } from "./service.ts"
import { MidtransCallbackPayload } from "./types.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { getServiceClient } from "../_shared/db.ts"
import { AppError } from "../_shared/errors.ts";

Deno.serve(async (req: Request) => {
	try {
		const payload: MidtransCallbackPayload = await req.json()

		const supabase = getServiceClient()

		await handlePaymentCallback(supabase, payload)

		return successResponse({ message: "OK" }, 200)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})