export class AppError extends Error {
	public statusCode: number

	constructor(message: string, statusCode: number = 400) {
		super(message)
		this.name = "AppError"
		this.statusCode = statusCode
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401)
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403)
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Not found") {
		super(message, 404)
	}
}