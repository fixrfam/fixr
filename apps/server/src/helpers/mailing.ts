import { APP_NAME } from "@repo/constants/app";
import { renderEmail as renderDeletionEmail } from "../emails/AccountDeletion";
import { renderEmail as renderVerificationEmail } from "../emails/Verification";
import { renderEmail as renderPasswordResetEmail } from "../emails/PasswordReset";
import { env } from "../env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
    try {
        const info = await transporter.sendMail({
            from: `${APP_NAME} - Mailing <${env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw error;
    }
};

export const sendAccountVerificationEmail = async ({
    to,
    verificationUrl,
    displayName,
}: {
    to: string;
    verificationUrl: string;
    displayName: string;
}) =>
    sendEmail({
        to,
        subject: `Verify your email, @${displayName}!`,
        html: renderVerificationEmail({ verificationUrl, displayName, appName: APP_NAME }),
    });

export const sendAccountDeletionEmail = async ({
    to,
    verificationUrl,
    displayName,
}: {
    to: string;
    verificationUrl: string;
    displayName: string;
}) =>
    sendEmail({
        to,
        subject: `${displayName}'s account delete confirmation.`,
        html: renderDeletionEmail({ verificationUrl, displayName, appName: APP_NAME }),
    });

export const sendPasswordResetEmail = async ({
    to,
    verificationUrl,
    displayName,
}: {
    to: string;
    verificationUrl: string;
    displayName: string;
}) =>
    sendEmail({
        to,
        subject: `Change your password, @${displayName}!`,
        html: renderPasswordResetEmail({ verificationUrl, displayName, appName: APP_NAME }),
    });

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split("@")[0];
