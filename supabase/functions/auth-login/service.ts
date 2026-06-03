/**
 * Auth Login Edge Function
 * Endpoint: POST /auth/register, POST /auth/login
 * Handles UC-01 (Register/Login)
 * Owner: Hans
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { RegisterRequest, LoginRequest, AuthResponse } from "./types.ts"
import { AppError } from "../_shared/errors.ts"

export async function registerUser(
	supabase: SupabaseClient,
	request: RegisterRequest
): Promise<AuthResponse> {
	// Register via Supabase Auth
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email: request.email,
		password: request.password,
		options: {
			data: { role: request.role }
		}
	})

	if (authError || !authData.user) {
		throw new AppError(authError?.message ?? "Registration failed")
	}

	// Insert into users table
	const { error: userError } = await supabase
		.from("users")
		.insert({
			id: authData.user.id,
			name: request.name,
			email: request.email,
			role: request.role,
			status: "ACTIVE",
		})

	if (userError) {
		throw new AppError("Failed to create user profile")
	}

	return {
		accessToken: authData.session?.access_token ?? "",
		role: request.role,
		userId: authData.user.id,
	}
}

export async function loginUser(
	supabase: SupabaseClient,
	request: LoginRequest
): Promise<AuthResponse> {
	const { data, error } = await supabase.auth.signInWithPassword({
		email: request.email,
		password: request.password,
	})

	if (error || !data.user) {
		throw new AppError("Invalid email or password", 401)
	}

	const role = data.user.user_metadata?.role ?? "STUDENT"

	return {
		accessToken: data.session?.access_token ?? "",
		role,
		userId: data.user.id,
	}
}