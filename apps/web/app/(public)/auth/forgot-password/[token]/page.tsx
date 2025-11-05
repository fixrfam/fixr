"use client"

import { use, useState } from "react"
import AuthFormSuccess from "@/components/auth/auth-form-success"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default function ChangePasswordPage(props: {
  params: Promise<{ token: string }>
}) {
  const params = use(props.params)
  const [success, setSuccess] = useState(false)

  return !success ? (
    <ResetPasswordForm onSuccess={setSuccess} token={params.token} />
  ) : (
    <AuthFormSuccess
      title="Senha alterada! 🎉"
      description="Sua senha foi alterada com sucesso."
      paragraph="Você conseguiu! Agora você pode entrar com sua nova senha."
    />
  )
}
