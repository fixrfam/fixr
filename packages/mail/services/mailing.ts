import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import dotenv from "dotenv";
import { resend } from "../config/resend";
import { renderEmail as renderDeletionEmail } from "../emails/account-deletion";
import {
	type EmailProps as EstimateEmailProps,
	renderEmail as renderEstimateEmail,
} from "../emails/estimate";
import {
	type EmailProps as InviteEmailProps,
	renderEmail as renderInviteEmail,
} from "../emails/invite";
import { renderEmail as renderPasswordResetEmail } from "../emails/password-reset";
import {
	type EmailProps as PortalAccessEmailProps,
	renderEmail as renderPortalAccessEmail,
} from "../emails/portal-access";
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

/**
 * A file sent along with the email. The content is base64 so the job payload
 * stays plain JSON in the queue.
 */
export interface EmailAttachment {
	fileName: string;
	contentBase64: string;
}

const sendEmail = async ({
	to,
	subject,
	html,
	attachments,
}: EmailCommonProps & {
	html: string;
	subject: string;
	attachments?: EmailAttachment[];
}) => {
	try {
		const { data, error } = await resend.emails.send({
			from: "Fixr - Comunicação <no-reply@mail.fixr.com.br>",
			to: [to],
			subject,
			html,
			attachments: attachments?.map((attachment) => ({
				filename: attachment.fileName,
				content: attachment.contentBase64,
			})),
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

export const sendEstimateEmail = async ({
	to,
	appName,
	locale = defaultLocale,
	attachment,
	...props
}: Omit<EstimateEmailProps, "locale"> &
	EmailCommonProps & { attachment: EmailAttachment }) =>
	sendEmail({
		to,
		appName,
		subject: createTranslator(locale).t("emails.estimate.subject", {
			number: props.number,
			company: props.companyName,
		}),
		html: await renderEstimateEmail({ ...props, locale }),
		attachments: [attachment],
	});

export const sendPortalAccessEmail = async ({
	to,
	appName,
	locale = defaultLocale,
	...props
}: Omit<PortalAccessEmailProps, "locale"> & EmailCommonProps) => {
	const { t } = createTranslator(locale);
	return sendEmail({
		to,
		appName,
		subject: props.companyName
			? t("emails.portalAccess.subject", { company: props.companyName })
			: t("emails.portalAccess.subjectSelf"),
		html: await renderPortalAccessEmail({ ...props, locale }),
	});
};

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split("@")[0];

export const emails = {
	sendInviteEmail,
	sendAccountVerificationEmail,
	sendAccountDeletionEmail,
	sendPasswordResetEmail,
	sendEstimateEmail,
	sendPortalAccessEmail,
};
