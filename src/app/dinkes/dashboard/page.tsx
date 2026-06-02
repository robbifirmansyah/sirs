import DashboardMatrix from '@/components/DashboardMatrix'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch initial master RS
  const { data: rumahSakit } = await supabase
    .from('rumah_sakit')
    .select('id, kode_rs, nama_rs')
    .order('kode_rs', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard Monitoring Kepatuhan</h1>
        <p className="text-zinc-500 mt-2">Pantau status pelaporan Laporan 3.5 dari seluruh Rumah Sakit secara real-time.</p>
      </div>

      <DashboardMatrix initialRS={rumahSakit || []} />
    </div>
  )
}
