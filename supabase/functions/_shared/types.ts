export type Role = "STUDENT" | "TEACHER" | "ADMIN"

export interface JWTClaims {
	sub: string
	role: Role
	email: string
	exp: number
}