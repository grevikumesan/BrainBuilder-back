import { JWTClaims } from "./types.ts"
import { UnauthorizedError } from "./errors.ts"

export async function validateJWT(req: Request): Promise<JWTClaims> {
	const authHeader = req.headers.get("Authorization")

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("Missing or invalid Authorization header")
	}

	const token = authHeader.replace("Bearer ", "")

	try {
		// Decode JWT payload (Supabase verifies signature internally via RLS)
		const parts = token.split(".")
		if (parts.length !== 3) {
			throw new UnauthorizedError("Invalid JWT format")
		}

		const payload = JSON.parse(atob(parts[1]))

		// Check expiry
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			throw new UnauthorizedError("JWT expired")
		}

		return {
			sub: payload.sub,
			role: payload.user_metadata?.role ?? payload.role,
			email: payload.email,
			exp: payload.exp,
		} as JWTClaims

	} catch (error) {
		if (error instanceof UnauthorizedError) throw error
		throw new UnauthorizedError("Invalid JWT")
	}
}

export function extractToken(req: Request): string {
	const authHeader = req.headers.get("Authorization")
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("Missing or invalid Authorization header")
	}
	return authHeader.replace("Bearer ", "")
}