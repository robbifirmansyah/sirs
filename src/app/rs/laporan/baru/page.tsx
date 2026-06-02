import { createClient } from '@/lib/supabase/server'
import FormLaporan from '@/components/FormLaporan'

export default async function BaruPage() {
  const supabase = await createClient()

  // Fetch master_poli to pass to the client component
  const { data: masterPoli } = await supabase
    .from('master_poli')
    .select('id, kode_poli, nama_poli')
    .order('kode_poli', { ascending: true })

  // Also try to get current user's RS ID. 
  const { data: { user } } = await supabase.auth.getUser()
  const rsId = user?.user_metadata?.rs_id || null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Buat Laporan Baru</h1>
        <p className="text-zinc-500 mt-2">Isi rekapitulasi kunjungan pasien (Laporan 3.5).</p>
      </div>
      
      <FormLaporan masterPoli={masterPoli || []} />
    </div>
  )
}
