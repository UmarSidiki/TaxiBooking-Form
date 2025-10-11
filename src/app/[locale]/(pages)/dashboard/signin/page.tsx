'use client'

import { useState, type FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function SignInPage() {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: `/${locale}/dashboard`,
    })

    setLoading(false)

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error
      )
      return
    }

    router.push(result?.url ?? `/${locale}/dashboard`)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Sign In</CardTitle>
          <CardDescription>
            Enter your admin credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}