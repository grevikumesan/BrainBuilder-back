/**
 * Auth Login Edge Function
 * Endpoint: POST /auth/register, POST /auth/login
 * Handles UC-01 (Register/Login)
 * Owner: Hans
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { validateRegisterRequest, validateLoginRequest } from "./validation.ts"
import { registerUser, loginUser } from "./service.ts"
import { successResponse, errorResponse } from "../_shared/response.ts"
import { AppError } from "../_shared/errors.ts"

Deno.serve(async (req: Request) => {
	try {
		const url = new URL(req.url)
		const path = url.pathname

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? ""
		)

		if (path.endsWith("/register") && req.method === "POST") {
			const body = await req.json()
			const validated = validateRegisterRequest(body)
			const result = await registerUser(supabase, validated)
			return successResponse(result, 201)
		}

		if (path.endsWith("/login") && req.method === "POST") {
			const body = await req.json()
			const validated = validateLoginRequest(body)
			const result = await loginUser(supabase, validated)
			return successResponse(result, 200)
		}

		return errorResponse("Not found", 404)

	} catch (error) {
		const err = error as AppError
		return errorResponse(err.message ?? "Internal server error", err.statusCode ?? 400)
	}
})