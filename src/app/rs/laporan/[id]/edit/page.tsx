import { createClient } from '@/lib/supabase/server'
import FormLaporanEdit from '@/components/FormLaporanEdit'
import { redirect } from 'next/navigation'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Master Poli
  const { data: masterPoli } = await supabase
    .from('master_poli')
    .select('id, kode_poli, nama_poli')
    .order('kode_poli', { ascending: true })

  // Fetch existing laporan_induk
  const { data: induk } = await supabase
    .from('laporan_induk')
    .select('*')
    .eq('id', id)
    .single()

  if (!induk) {
    redirect('/rs/riwayat')
  }

  // Fetch existing laporan_detail
  const { data: details } = await supabase
    .from('laporan_detail')
    .select('*')
    .eq('laporan_id', id)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Edit Laporan</h1>
        <p className="text-zinc-500 mt-2">Perbarui data rekapitulasi kunjungan pasien (Laporan 3.5) yang telah dikirim.</p>
      </div>
      
      <FormLaporanEdit 
        masterPoli={masterPoli || []} 
        induk={induk}
        initialDetails={details || []}
      />
    </div>
  )
}
