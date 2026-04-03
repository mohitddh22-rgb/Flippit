import { signup } from '../actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RegisterPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <Card className="w-full max-w-md bg-zinc-900 text-zinc-100 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Create an Account</CardTitle>
        <CardDescription className="text-zinc-400">Join Flippit to start betting on cricket matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
            <Input id="full_name" name="full_name" placeholder="John Doe" required className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-300">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+91 9999999999" required className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-zinc-300">Date of Birth</Label>
            <Input id="dob" name="dob" type="date" required className="bg-zinc-800 border-zinc-700 text-white [color-scheme:dark]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input id="password" name="password" type="password" required className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          
          {searchParams?.message && (
            <p className="text-sm border-l-2 border-red-500 bg-red-500/10 p-2 text-red-500">{searchParams.message}</p>
          )}
          
          <Button formAction={signup} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            Sign Up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-emerald-500 hover:underline">
            Login here
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
