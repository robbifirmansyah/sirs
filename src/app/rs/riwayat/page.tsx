import { createClient } from '@/lib/supabase/server'
import { FileText, Plus, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function RiwayatPage() {
  const supabase = await createClient()

  const { data: laporan } = await supabase
    .from('laporan_induk')
    .select(`
      id, 
      bulan, 
      tahun, 
      submitted_at, 
      updated_at,
      rumah_sakit ( nama_rs )
    `)
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })

  const getBulanName = (b: number) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return months[b - 1]
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Riwayat Laporan</h1>
          <p className="text-zinc-500 mt-2">Daftar laporan kunjungan pasien yang telah dikirim.</p>
        </div>
        <Link
          href="/rs/laporan/baru"
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 px-5 rounded-xl shadow-[0_4px_12px_rgba(8,145,178,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Laporan Baru
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50/50 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-5 whitespace-nowrap border-b border-zinc-100">Periode</th>
                <th className="px-6 py-5 whitespace-nowrap border-b border-zinc-100">Rumah Sakit</th>
                <th className="px-6 py-5 whitespace-nowrap border-b border-zinc-100">Tanggal Kirim</th>
                <th className="px-6 py-5 whitespace-nowrap border-b border-zinc-100">Status</th>
                <th className="px-6 py-5 whitespace-nowrap text-right border-b border-zinc-100">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {!laporan || laporan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-zinc-50 p-4 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-zinc-400" />
                      </div>
                      <p className="font-medium text-zinc-600">Belum ada laporan yang dikirim.</p>
                      <p className="text-sm mt-1">Buat laporan pertama Anda untuk bulan ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                laporan.map((item: { id: string, bulan: number, tahun: number, submitted_at: string, rumah_sakit: { nama_rs: string } | { nama_rs: string }[] | null }) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-5 font-semibold text-zinc-900">
                      {getBulanName(item.bulan)} {item.tahun}
                    </td>
                    <td className="px-6 py-5 font-medium text-zinc-700">
                      {Array.isArray(item.rumah_sakit) ? item.rumah_sakit[0]?.nama_rs : item.rumah_sakit?.nama_rs || '-'}
                    </td>
                    <td className="px-6 py-5 text-zinc-500">
                      {new Date(item.submitted_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-2"></span>
                        Terkirim
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                         href={`/rs/laporan/${item.id}/edit`}
                        className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                        title="Edit Laporan"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
