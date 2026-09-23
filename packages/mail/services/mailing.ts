import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import dotenv from "dotenv";
import { resend } from "../config/resend";
import { renderEmail as renderDeletionEmail } from "../emails/account-deletion";
import {
	type EmailProps as InviteEmailProps,
	renderEmail as renderInviteEmail,
} from "../emails/invite";
import { renderEmail as renderPasswordResetEmail } from "../emails/password-reset";
import { renderEmail as renderVerificationEmail } from "../emails/verification";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

interface EmailCommonProps {
	to: string;
	appName: string;
	/**
	 * Language of the recipient. Callers that know it (a request carries
	 * `Accept-Language`) should pass it; otherwise the default is used.
	 */
	locale?: Locale;
}

const sendEmail = async ({
	to,
	subject,
	html,
}: EmailCommonProps & {
	html: string;
	subject: string;
}) => {
	try {
		const { data, error } = await resend.emails.send({
			from: "Fixr - Comunicação <no-reply@mail.fixr.com.br>",
			to: [to],
			subject,
			html,
		});

		if (error) {
			console.error(`Failed to send email to ${to}:`, error);
			throw error;
		}

		console.log(`Email sent to ${to}: ${data?.id}`);
		return data;
	} catch (error) {
		console.error(`Failed to send email to ${to}:`, error);
		throw error;
	}
};

export const sendInviteEmail = async ({
	to,
	appName,
	locale = defaultLocale,
	...props
}: InviteEmailProps & EmailCommonProps) =>
	sendEmail({
		to,
		appName,
		subject: createTranslator(locale).t("emails.invite.subject", {
			app: appName,
		}),
		html: await renderInviteEmail({
			appName,
			locale,
			...props,
		}),
	});

export const sendAccountVerificationEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
	locale = defaultLocale,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: createTranslator(locale).t("emails.verification.subject", {
			name: displayName,
		}),
		html: await renderVerificationEmail({
			verificationUrl,
			displayName,
			appName,
			locale,
		}),
	});

export const sendAccountDeletionEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
	locale = defaultLocale,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: createTranslator(locale).t("emails.accountDeletion.subject", {
			name: displayName,
		}),
		html: await renderDeletionEmail({
			verificationUrl,
			displayName,
			appName,
			locale,
		}),
	});

export const sendPasswordResetEmail = async ({
	to,
	verificationUrl,
	displayName,
	appName,
	locale = defaultLocale,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
	sendEmail({
		to,
		appName,
		subject: createTranslator(locale).t("emails.passwordReset.subject", {
			name: displayName,
		}),
		html: await renderPasswordResetEmail({
			verificationUrl,
			displayName,
			appName,
			locale,
		}),
	});

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split("@")[0];

export const emails = {
	sendInviteEmail,
	sendAccountVerificationEmail,
	sendAccountDeletionEmail,
	sendPasswordResetEmail,
};
