import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OTPPage() {
  return (
    <Card className="w-full max-w-md bg-zinc-900 text-zinc-100 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Verify Your Email</CardTitle>
        <CardDescription className="text-zinc-400">We've sent a verification link to your email address.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Placeholder for actual OTP form if using SMS or Email 6-digit codes. Currently assuming magic link standard Supabase flow for simplicity. */}
        <p className="text-sm text-zinc-300">
          Please check your inbox (and spam folder) and click the link to verify your account. Once verified, you can log in to your account.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
        <Link href="/auth/login">
          <Button variant="outline" className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10">
            Back to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
