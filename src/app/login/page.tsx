import Link from 'next/link'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, Info } from 'lucide-react'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 px-4 py-12">
      {/* Top Brand Link */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="text-left">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block">Nexa-Edu</span>
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest block -mt-1">
              Tuition Management
            </span>
          </div>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1">
              Access your classes, student rosters, and schedules
            </p>
          </div>

          {searchParams?.message && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 leading-relaxed">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice</p>
                <p>{searchParams.message}</p>
              </div>
            </div>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue="institute@noyeq.com"
                  placeholder="institute@noyeq.com"
                  required
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 text-sm focus-visible:bg-white focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="institute123"
                  placeholder="••••••••"
                  required
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 text-sm focus-visible:bg-white focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-blue-200 hover:shadow-lg transition-all mt-2"
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          {/* Quick Credential Helper Pill */}
          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Default login: <strong className="text-slate-800">institute@noyeq.com</strong>
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono">
              institute123
            </span>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Protected with encrypted Supabase auth • Real-time cloud sync with mobile app
      </p>
    </div>
  )
}
