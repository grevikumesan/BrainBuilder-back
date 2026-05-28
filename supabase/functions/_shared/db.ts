import { createClient, SupabaseClient } from "@supabase/supabase-js"

export function getServiceClient(): SupabaseClient {
	return createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
	)
}

export function getUserClient(jwt: string): SupabaseClient {
	return createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_ANON_KEY") ?? "",
		{
			global: {
				headers: { Authorization: `Bearer ${jwt}` }
			}
		}
	)
}