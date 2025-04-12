import { renderEmail as renderDeletionEmail } from "../emails/AccountDeletion";
import { renderEmail as renderVerificationEmail } from "../emails/Verification";
import { renderEmail as renderPasswordResetEmail } from "../emails/PasswordReset";
import {
    renderEmail as renderInviteEmail,
    type EmailProps as InviteEmailProps,
} from "../emails/Invite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

interface EmailCommonProps {
    to: string;
    appName: string;
    credentials: {
        email_user: string;
        email_pass: string;
    };
}

const sendEmail = async ({
    to,
    subject,
    html,
    appName,
    credentials,
}: EmailCommonProps & {
    html: string;
    subject: string;
}) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: credentials.email_user,
            pass: credentials.email_pass,
        },
        from: credentials.email_user,
    });

    try {
        const info = await transporter.sendMail({
            from: `${appName} - Comunicação <${process.env.EMAIL_USER}>`,
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

export const sendInviteEmail = async ({
    to,
    appName,
    credentials,
    ...props
}: InviteEmailProps & EmailCommonProps) =>
    sendEmail({
        to,
        appName,
        subject: `🎉 Bem-vindo ao Fixr – Seu acesso ao sistema`,
        html: await renderInviteEmail({
            appName,
            ...props,
        }),
        credentials,
    });

export const sendAccountVerificationEmail = async ({
    to,
    verificationUrl,
    displayName,
    credentials,
    appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
    sendEmail({
        to,
        appName,
        subject: `Verify your email, @${displayName}!`,
        html: await renderVerificationEmail({ verificationUrl, displayName, appName }),
        credentials,
    });

export const sendAccountDeletionEmail = async ({
    to,
    verificationUrl,
    displayName,
    credentials,
    appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
    sendEmail({
        to,
        appName,
        subject: `${displayName}'s account delete confirmation.`,
        html: await renderDeletionEmail({ verificationUrl, displayName, appName }),
        credentials,
    });

export const sendPasswordResetEmail = async ({
    to,
    verificationUrl,
    displayName,
    credentials,
    appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
    sendEmail({
        to,
        appName,
        subject: `Change your password, @${displayName}!`,
        html: await renderPasswordResetEmail({ verificationUrl, displayName, appName }),
        credentials,
    });

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split("@")[0];

export const emails = {
    sendInviteEmail,
    sendAccountVerificationEmail,
    sendAccountDeletionEmail,
    sendPasswordResetEmail,
};
