import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { resend } from '../config/resend'
import { renderEmail as renderDeletionEmail } from '../emails/AccountDeletion'
import {
  type EmailProps as InviteEmailProps,
  renderEmail as renderInviteEmail,
} from '../emails/Invite'
import { renderEmail as renderPasswordResetEmail } from '../emails/PasswordReset'
import { renderEmail as renderVerificationEmail } from '../emails/Verification'

dotenv.config({ path: '../.env' })

interface EmailCommonProps {
  to: string
  appName: string
}

const sendEmail = async ({
  to,
  subject,
  html,
}: EmailCommonProps & {
  html: string
  subject: string
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fixr - Comunicação <no-reply@mail.fixr.com.br>',
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error(`Failed to send email to ${to}:`, error)
      throw error
    }

    console.log(`Email sent to ${to}: ${data?.id}`)
    return data
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    throw error
  }
}

export const sendInviteEmail = async ({
  to,
  appName,
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
  })

export const sendAccountVerificationEmail = async ({
  to,
  verificationUrl,
  displayName,
  appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
  sendEmail({
    to,
    appName,
    subject: `Verify your email, @${displayName}!`,
    html: await renderVerificationEmail({
      verificationUrl,
      displayName,
      appName,
    }),
  })

export const sendAccountDeletionEmail = async ({
  to,
  verificationUrl,
  displayName,
  appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
  sendEmail({
    to,
    appName,
    subject: `${displayName}'s account delete confirmation.`,
    html: await renderDeletionEmail({ verificationUrl, displayName, appName }),
  })

export const sendPasswordResetEmail = async ({
  to,
  verificationUrl,
  displayName,
  appName,
}: EmailCommonProps & { verificationUrl: string; displayName: string }) =>
  sendEmail({
    to,
    appName,
    subject: `Esqueceu sua senha, ${displayName}?`,
    html: await renderPasswordResetEmail({
      verificationUrl,
      displayName,
      appName,
    }),
  })

// Extracts display name from an email
export const emailDisplayName = (email: string) => email.split('@')[0]

export const emails = {
  sendInviteEmail,
  sendAccountVerificationEmail,
  sendAccountDeletionEmail,
  sendPasswordResetEmail,
}
