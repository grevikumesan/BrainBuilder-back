import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWTClaims } from "./types.ts"
import { UnauthorizedError } from "./errors.ts"

export async function validateJWT(req: Request): Promise<JWTClaims> {
	const authHeader = req.headers.get("Authorization")

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("Missing or invalid Authorization header")
	}

	const token = authHeader.replace("Bearer ", "")

	// getUser verifies the token signature and expiry against Supabase Auth,
	// so a forged or tampered JWT (including a faked role claim) is rejected
	// before any business logic runs (NFR-01)
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_ANON_KEY") ?? ""
	)

	const { data, error } = await supabase.auth.getUser(token)
	if (error || !data.user) {
		throw new UnauthorizedError("Invalid or expired token")
	}

	const user = data.user
	return {
		sub: user.id,
		role: user.user_metadata?.role ?? user.app_metadata?.role,
		email: user.email ?? "",
	} as JWTClaims
}

export function extractToken(req: Request): string {
	const authHeader = req.headers.get("Authorization")
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("Missing or invalid Authorization header")
	}
	return authHeader.replace("Bearer ", "")
}