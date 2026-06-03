'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, FileText, Clock, Activity, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function RSLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [rsName, setRsName] = useState<string>('Rumah Sakit')

  useEffect(() => {
    const fetchRSName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.user_metadata) {
        setRsName(user.user_metadata.nama_rs || user.user_metadata.rs_name || 'Rumah Sakit')
      }
    }
    fetchRSName()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { name: 'Buat Laporan Baru', href: '/rs/laporan/baru', icon: FileText },
    { name: 'Riwayat Laporan', href: '/rs/riwayat', icon: Clock },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-cyan-600 relative overflow-hidden shadow-xl z-10">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        <div className="h-24 flex items-center px-8 relative z-10">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm mr-3 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-lg tracking-tight text-white leading-tight">SIRS RS</span>
            <span className="text-xs font-medium text-cyan-100 truncate mt-0.5" title={rsName}>{rsName}</span>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-1 relative z-10 mt-4">
          <div className="mb-4 px-4 text-xs font-semibold text-cyan-200 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/10'
                    : 'text-cyan-50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-cyan-200'}`} />
                {item.name}
              </a>
            )
          })}
        </div>

        <div className="p-6 relative z-10">
          <div className="bg-cyan-700/50 rounded-xl p-4 border border-cyan-500/30 backdrop-blur-sm">
            <div className="flex flex-col mb-4">
              <span className="text-xs text-cyan-200 font-medium uppercase tracking-wider mb-1">Fasilitas</span>
              <span className="truncate text-sm font-semibold text-white">{rsName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-bold text-cyan-50 bg-white/10 hover:bg-red-500 hover:text-white border border-white/10 hover:border-red-500 rounded-xl transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-cyan-600 flex items-center justify-between px-4 z-20 shadow-sm text-white">
          <div className="flex items-center overflow-hidden">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm mr-2 border border-white/20 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold tracking-tight text-white leading-tight">SIRS RS</span>
              <span className="text-[10px] font-medium text-cyan-100 truncate leading-none mt-1">{rsName}</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-cyan-600 border-t border-cyan-500 z-30 shadow-xl animate-in slide-in-from-top-2">
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <a
                     key={item.href}
                     href={item.href}
                     className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                       isActive
                         ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/10'
                         : 'text-cyan-50 hover:bg-white/10 hover:text-white'
                     }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                )
              })}
              <div className="pt-4 mt-4 border-t border-cyan-500/50">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 text-sm font-medium text-white hover:bg-white/10 w-full rounded-xl"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-zinc-50">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
