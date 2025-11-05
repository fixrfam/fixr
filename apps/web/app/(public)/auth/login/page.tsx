import { cookieKey } from '@fixr/constants/cookies'
import { cookies } from 'next/headers'
import { AuthDialogs } from '@/components/auth/auth-dialogs'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const showVerifiedDialog =
    cookieStore.get(cookieKey('showVerifiedDialog'))?.value === 'true'
  const showDeletedDialog =
    cookieStore.get(cookieKey('showDeletedDialog'))?.value === 'true'
  const googleAuthError = cookieStore.get(cookieKey('googleAuthError'))

  return (
    <div>
      <LoginForm
        errors={{
          google: googleAuthError?.value,
        }}
      />
      <AuthDialogs
        showDeletedDialog={showDeletedDialog}
        showVerifiedDialog={showVerifiedDialog}
      />
    </div>
  )
}
