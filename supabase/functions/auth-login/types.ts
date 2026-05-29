export interface RegisterRequest {
	name: string
	email: string
	password: string
	role: "STUDENT" | "TEACHER"
}

export interface LoginRequest {
	email: string
	password: string
}

export interface AuthResponse {
	accessToken: string
	role: string
	userId: string
}