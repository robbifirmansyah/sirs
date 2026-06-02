'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const role = data.user.user_metadata?.role

    if (role === 'rs') {
      router.push('/rs/riwayat')
    } else if (role === 'dinkes') {
      router.push('/dinkes/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen w-full flex bg-zinc-50">
      {/* Left side - Branding / Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-cyan-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="relative z-10 flex items-center gap-2 text-white">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SIRS Online</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-medium text-white tracking-tight leading-tight mb-4">
            Sistem Informasi <br/>
            <span className="text-cyan-100">Rumah Sakit & Dinkes</span>
          </h2>
          <p className="text-cyan-50 text-lg max-w-md">
            Platform terpadu pelaporan kunjungan pasien secara real-time dan terintegrasi untuk fasilitas kesehatan daerah.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-cyan-100">
          <span>&copy; {new Date().getFullYear()} Dinas Kesehatan</span>
          <span>•</span>
          <span>Sistem Aman & Terenkripsi</span>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-white">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="flex flex-col space-y-2 text-left">
            <div className="lg:hidden flex items-center gap-2 text-zinc-900 mb-6">
              <div className="bg-cyan-50 p-2 rounded-lg border border-cyan-100">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-cyan-700">SIRS Online</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Masuk ke akun Anda
            </h1>
            <p className="text-sm text-zinc-500">
              Gunakan email Rumah Sakit atau Dinkes yang terdaftar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2 animate-in shake">
                <span className="text-xs font-bold px-1.5 py-0.5 mt-0.5 rounded-sm bg-red-100">!</span>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex w-full rounded-2xl border-0 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white focus:ring-2 focus:ring-cyan-600/20 px-5 py-3.5 text-base shadow-inner font-medium text-zinc-800 transition-all placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="nama@rs.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-zinc-700">
                  Kata Sandi
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full rounded-2xl border-0 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white focus:ring-2 focus:ring-cyan-600/20 px-5 py-3.5 text-base shadow-inner font-medium text-zinc-800 transition-all placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-4 text-base font-bold text-white shadow-[0_4px_12px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_16px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 disabled:pointer-events-none disabled:opacity-70 mt-6 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk Sekarang'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-zinc-500">
            Lupa kata sandi? <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors">Hubungi Admin Dinkes</a>
          </div>
        </div>
      </div>
    </main>
  )
}
