import { login } from '../actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <Card className="w-full max-w-md bg-zinc-900 text-zinc-100 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Login to Flippit</CardTitle>
        <CardDescription className="text-zinc-400">Enter your email and password to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input id="password" name="password" type="password" required className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          {searchParams?.message && (
            <p className="text-sm border-l-2 border-red-500 bg-red-500/10 p-2 text-red-500">{searchParams.message}</p>
          )}
          <Button formAction={login} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            Login
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-emerald-500 hover:underline">
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
