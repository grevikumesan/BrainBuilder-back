export interface CreatePaymentRequest {
	planId: string
}

export interface MidtransChargeRequest {
	orderId: string
	amount: number
	userId: string
	planName: string
}

export interface MidtransChargeResponse {
	paymentUrl: string
	orderId: string
}

export interface CreatePaymentResponse {
	paymentUrl: string
	orderId: string
}