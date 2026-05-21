import { env } from "@fixr/env/server";
import { AppError } from "./app-error";

interface TurnstileVerifyResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
	action?: string;
	cdata?: string;
}

export async function verifyTurnstileToken(token: string, ip?: string) {
	const formData = new FormData();
	formData.append("secret", env.TURNSTILE_SECRET_KEY);
	formData.append("response", token);
	if (ip) {
		formData.append("remoteip", ip);
	}

	const response = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			body: formData,
		}
	);

	const data: TurnstileVerifyResponse = await response.json();

	if (!data.success) {
		throw new AppError("TURNSTILE_VALIDATION_FAILED");
	}
}
