export interface MidtransCallbackPayload {
	order_id: string
	transaction_status: string
	fraud_status: string
	signature_key: string
	gross_amount: string
	status_code: string
}

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"