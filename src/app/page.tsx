import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, GraduationCap, LayoutDashboard, ShieldCheck, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nexa-Edu</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Background Gradient */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#3b82f6_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#020617_40%,#1d4ed8_100%)]" />
          
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Tuition Empire</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
                The all-in-one platform for modern educators. Handle attendance, payments, and communication across individual classes and entire institutions seamlessly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-900">
                    Sign In to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to succeed</h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Powerful tools designed specifically for tutors and educational institutions.</p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard 
                icon={<CheckCircle2 className="h-10 w-10 text-blue-500" />}
                title="Attendance Tracking"
                description="Mark student attendance with a single tap. Keep historical records easily accessible."
              />
              <FeatureCard 
                icon={<Zap className="h-10 w-10 text-amber-500" />}
                title="Instant Notifications"
                description="Send real-time announcements and direct messages directly to student inboxes."
              />
              <FeatureCard 
                icon={<ShieldCheck className="h-10 w-10 text-emerald-500" />}
                title="Payment Management"
                description="Track monthly fees, view revenue dashboards, and never miss a pending payment."
              />
              <FeatureCard 
                icon={<LayoutDashboard className="h-10 w-10 text-purple-500" />}
                title="Unified Workloads"
                description="Teachers can manage private classes and assigned institute classes in one clean view."
              />
            </div>
          </div>
        </section>

        {/* Why Nexa-Edu Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Why switch to Nexa-Edu?</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Zero App Store Delays</h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">Our hybrid architecture means complex business logic updates instantly without waiting for app store reviews.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Real-time Sync</h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">Actions performed on this web portal sync instantly to the mobile apps using robust Supabase WebSockets.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Multi-Role Support</h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">Whether you are an individual tutor, a massive institution, or a student, Nexa-Edu adapts securely to your role.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 hidden lg:block">
                {/* Abstract UI representation */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-8">
                  <div className="w-full h-8 bg-white/50 dark:bg-slate-800/50 rounded-md mb-6 backdrop-blur-sm"></div>
                  <div className="flex gap-4 h-full">
                    <div className="w-1/4 h-3/4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm"></div>
                    <div className="w-3/4 h-full flex flex-col gap-4">
                       <div className="w-full h-1/3 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm"></div>
                       <div className="w-full h-2/3 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm flex gap-4 p-4">
                          <div className="w-1/2 h-full bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"></div>
                          <div className="w-1/2 h-full bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12 dark:bg-slate-950">
        <div className="container mx-auto px-4 md:px-6 text-center text-slate-500">
          <p>© {new Date().getFullYear()} Nexa-Edu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
