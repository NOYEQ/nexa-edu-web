import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap } from 'lucide-react'

export default async function RegisterPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-10 w-10 text-blue-600" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Create an Account</h2>
          <p className="text-center text-slate-500 mb-8">Join Nexa-Edu today</p>

          <form action={signup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" placeholder="John Doe" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select name="role" defaultValue="student">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher (Individual)</SelectItem>
                  <SelectItem value="institution">Institution Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchParams?.message && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-200">
                {searchParams.message}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base mt-2">
              Create Account
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
