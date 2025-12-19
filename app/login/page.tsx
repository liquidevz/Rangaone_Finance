import LoginClient from "./login-client"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - RangaOne Finance",
  description: "Sign in to your account"
}

export default function LoginPage() {
  return <LoginClient />
}
