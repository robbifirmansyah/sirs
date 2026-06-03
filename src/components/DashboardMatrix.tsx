'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Calendar, Activity, ShieldAlert, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Table } from 'lucide-react'
import * as XLSX from 'xlsx'

type RS = { id: string, kode_rs: string, nama_rs: string }
type LaporanInduk = { id: string, rs_id: string, bulan: number, tahun: number }

export default function DashboardMatrix({ initialRS }: { initialRS: RS[] }) {
  const supabase = createClient()
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [laporan, setLaporan] = useState<LaporanInduk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const currentMonth = new Date().getMonth() + 1 // 1-12

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      const { data } = await supabase
        .from('laporan_induk')
        .select('id, rs_id, bulan, tahun')
        .eq('tahun', tahun)
      
      if (mounted) {
        if (data) setLaporan(data)
        setIsLoading(false)
      }
    }
    load()

    // Fitur Real-time dari Supabase: Jika ada RS yang baru saja submit laporan, 
    // tabel ini akan otomatis ter-update tanpa perlu refresh halaman (seperti WhatsApp).
    const channel = supabase.channel('realtime_laporan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'laporan_induk' }, (payload) => {
        const newRecord = payload.new as LaporanInduk
        setLaporan((prev) => {
          if (newRecord.tahun === tahun) {
             if (!prev.find(p => p.id === newRecord.id)) {
               return [...prev, newRecord]
             }
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [tahun, supabase])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i)

  // Variabel untuk menyimpan bulan ini (angka 1-12)
  const isCurrentYear = tahun === new Date().getFullYear()
  // Hitung jumlah RS yang sudah lapor bulan ini
  const rsLaporBulanIni = isCurrentYear ? laporan.filter(l => l.bulan === currentMonth).length : 0
  const totalRS = initialRS.length
  // Hitung yang belum lapor (Total dikurangi yang sudah lapor)
  const rsBelumLapor = totalRS - rsLaporBulanIni
  // Rumus persentase kepatuhan: (Yang Lapor / Total RS) * 100
  const complianceRate = totalRS > 0 ? Math.round((rsLaporBulanIni / totalRS) * 100) : 0

  const exportMatrixToExcel = () => {
    const dataToExport = initialRS.map(rs => {
      const rowData: Record<string, string | number> = {
        'Kode RS': rs.kode_rs,
        'Nama Rumah Sakit': rs.nama_rs
      }
      
      let reportedCount = 0
      months.forEach((m, idx) => {
        const month = idx + 1
        const hasReported = laporan.some(l => l.rs_id === rs.id && l.bulan === month)
        rowData[m] = hasReported ? 'V' : 'X'
        if (hasReported) reportedCount++
      })
      
      rowData['Persentase Kepatuhan'] = `${((reportedCount / 12) * 100).toFixed(2)}%`
      return rowData
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `Matriks ${tahun}`)
    XLSX.writeFile(workbook, `Matriks_Kepatuhan_RL3.5_${tahun}.xlsx`)
    setIsExportMenuOpen(false)
  }

  const exportDataLengkapToExcel = async () => {
    setIsExporting(true)
    try {
      const { data: detailData, error } = await supabase
        .from('laporan_induk')
        .select(`
          bulan,
          tahun,
          rumah_sakit ( kode_rs, nama_rs ),
          laporan_detail (
            dalam_kota_laki,
            dalam_kota_perempuan,
            luar_kota_laki,
            luar_kota_perempuan,
            hari_buka,
            master_poli ( kode_poli, nama_poli )
          )
        `)
        .eq('tahun', tahun)

      if (error) throw error

      type DetailData = {
        bulan: number;
        tahun: number;
        rumah_sakit: { kode_rs: string; nama_rs: string } | null;
        laporan_detail: {
          dalam_kota_laki: number;
          dalam_kota_perempuan: number;
          luar_kota_laki: number;
          luar_kota_perempuan: number;
          hari_buka: number;
          master_poli: { kode_poli: string; nama_poli: string } | null;
        }[];
      }

      const rows: Record<string, string | number>[] = []
      ;(detailData as unknown as DetailData[]).forEach((induk) => {
        const rsName: string = induk.rumah_sakit?.nama_rs || '-'
        const rsCode: string = induk.rumah_sakit?.kode_rs || '-'
        
        induk.laporan_detail.forEach((detail) => {
          rows.push({
            'Tahun': induk.tahun,
            'Bulan': months[induk.bulan - 1],
            'Kode RS': rsCode,
            'Nama RS': rsName,
            'Kode Poli': detail.master_poli?.kode_poli || '-',
            'Nama Poli': detail.master_poli?.nama_poli || '-',
            'Pasien Dalam Kota (L)': detail.dalam_kota_laki,
            'Pasien Dalam Kota (P)': detail.dalam_kota_perempuan,
            'Pasien Luar Kota (L)': detail.luar_kota_laki,
            'Pasien Luar Kota (P)': detail.luar_kota_perempuan,
            'Total Pasien': detail.dalam_kota_laki + detail.dalam_kota_perempuan + detail.luar_kota_laki + detail.luar_kota_perempuan,
            'Hari Buka': detail.hari_buka
          })
        })
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, `Data ${tahun}`)
      XLSX.writeFile(workbook, `Data_Lengkap_RL3.5_${tahun}.xlsx`)
    } catch (e) {
      console.error('Error exporting data:', e)
      alert('Gagal mengunduh data.')
    } finally {
      setIsExporting(false)
      setIsExportMenuOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 tracking-tight">Compliance Bulan Ini ({months[currentMonth-1]})</h3>
            <div className="p-3 bg-teal-50 rounded-2xl">
              <Activity className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-zinc-900 tracking-tight">{complianceRate}%</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 tracking-tight">Sudah Lapor</h3>
            <div className="p-3 bg-cyan-50 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-zinc-900 tracking-tight">{rsLaporBulanIni} <span className="text-xl font-semibold text-zinc-400">RS</span></p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 tracking-tight">Belum Lapor</h3>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-zinc-900 tracking-tight">{rsBelumLapor} <span className="text-xl font-semibold text-zinc-400">RS</span></p>
        </div>
      </div>

      {/* Filter and Matrix */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center tracking-tight">
            <Calendar className="w-6 h-6 mr-3 text-cyan-600" />
            Matriks Pelaporan
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                className="pl-5 pr-12 py-2.5 rounded-xl border-0 bg-zinc-50 shadow-inner focus:bg-white focus:ring-2 focus:ring-cyan-600/20 outline-none w-full font-bold text-zinc-700 transition-all cursor-pointer appearance-none"
              >
                {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
            
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={isExporting}
                className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(8,145,178,0.2)] transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isExporting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Unduh Excel
              </button>
              
              {isExportMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsExportMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 overflow-hidden z-30 animate-in slide-in-from-top-2">
                    <button onClick={exportMatrixToExcel} className="flex items-center w-full px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors border-b border-zinc-100">
                      <Table className="w-4 h-4 mr-3 text-cyan-600" />
                      <div className="text-left">
                        <div className="block">Matriks Checklist</div>
                        <div className="text-xs text-zinc-400 font-normal mt-0.5">Ringkasan kepatuhan per bulan</div>
                      </div>
                    </button>
                    <button onClick={exportDataLengkapToExcel} className="flex items-center w-full px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                      <FileSpreadsheet className="w-4 h-4 mr-3 text-cyan-600" />
                      <div className="text-left">
                        <div className="block">Data Lengkap (Laporan 3.5)</div>
                        <div className="text-xs text-zinc-400 font-normal mt-0.5">Detail pasien rawat jalan per poli</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center backdrop-blur-sm">
              <span className="w-10 h-10 border-4 border-zinc-100 border-t-cyan-600 rounded-full animate-spin" />
            </div>
          )}
          
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 text-zinc-500 border-b border-zinc-100">
              <tr>
                <th className="px-8 py-5 font-bold min-w-[250px] sticky left-0 z-20 bg-zinc-50/80 backdrop-blur-md shadow-[1px_0_0_0_#f4f4f5]">Rumah Sakit</th>
                {months.map((m, i) => (
                  <th key={m} className={`px-4 py-5 text-center font-bold w-16 ${(isCurrentYear && currentMonth === i + 1) ? 'bg-cyan-50 text-cyan-700 shadow-[0_-2px_0_0_#0891b2_inset]' : ''}`}>
                    {m}
                  </th>
                ))}
                <th className="px-6 py-5 text-center font-bold min-w-[140px]">Persentase Kepatuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {initialRS.map((rs) => (
                <tr key={rs.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-8 py-5 font-semibold text-zinc-800 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 shadow-[1px_0_0_0_#f4f4f5] whitespace-nowrap transition-colors">
                    <span className="inline-block px-2 py-1 bg-zinc-100 rounded-md text-[10px] font-bold text-zinc-500 mr-3">{rs.kode_rs}</span>
                    {rs.nama_rs}
                  </td>
                  {months.map((_, idx) => {
                    const month = idx + 1
                    const hasReported = laporan.some(l => l.rs_id === rs.id && l.bulan === month)
                    
                    return (
                      <td key={idx} className={`px-4 py-4 text-center ${(isCurrentYear && currentMonth === month) ? 'bg-cyan-50/30' : ''}`}>
                        {hasReported ? (
                          <div className="mx-auto w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center animate-in zoom-in border-0 shadow-sm shadow-cyan-100">
                            <Check className="w-4 h-4 text-cyan-600" />
                          </div>
                        ) : (
                          <div className="mx-auto w-8 h-8 rounded-full flex items-center justify-center opacity-40">
                            <X className="w-4 h-4 text-zinc-300" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 text-center font-bold text-zinc-700">
                    {(() => {
                      const count = months.reduce((acc, _, idx) => acc + (laporan.some(l => l.rs_id === rs.id && l.bulan === idx + 1) ? 1 : 0), 0)
                      return `${((count / 12) * 100).toFixed(2)}%`
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
