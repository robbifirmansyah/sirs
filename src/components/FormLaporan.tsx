'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle2, ChevronRight, ChevronLeft, Save, AlertCircle, ChevronDown } from 'lucide-react'

type MasterPoli = {
  id: string
  kode_poli: string
  nama_poli: string
}

type LaporanDetail = {
  poli_id: string
  dalam_kota_laki: string
  dalam_kota_perempuan: string
  luar_kota_laki: string
  luar_kota_perempuan: string
  hari_buka: string
}

export default function FormLaporan({ masterPoli }: { masterPoli: MasterPoli[] }) {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [selectedPolis, setSelectedPolis] = useState<Set<string>>(new Set())
  const [details, setDetails] = useState<Record<string, LaporanDetail>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fungsi untuk memvalidasi input sebelum lanjut ke pemilihan poli (Step 2)
  const handleNextToPoli = () => {
    if (!bulan || !tahun) {
      setErrorMsg("Bulan dan tahun wajib dipilih.")
      return
    }
    if (tahun < 2000 || tahun > 2100) {
      setErrorMsg("Tahun tidak valid.")
      return
    }
    setErrorMsg(null)
    setStep(2) // Lanjut ke langkah 2
  }

  // Fungsi untuk menambah atau menghapus poli dari daftar yang dipilih
  const togglePoli = (id: string) => {
    const newSet = new Set(selectedPolis)
    if (newSet.has(id)) {
      // Jika sudah ada, hapus poli dan datanya
      newSet.delete(id)
      const newDetails = { ...details }
      delete newDetails[id]
      setDetails(newDetails)
    } else {
      // Jika belum ada, tambahkan dengan nilai default (0)
      newSet.add(id)
      setDetails({
        ...details,
        [id]: {
          poli_id: id,
          dalam_kota_laki: '0',
          dalam_kota_perempuan: '0',
          luar_kota_laki: '0',
          luar_kota_perempuan: '0',
          hari_buka: '0'
        }
      })
    }
    setSelectedPolis(newSet)
  }

  // Fungsi untuk memvalidasi sebelum masuk ke pengisian angka (Step 3)
  const handleNextToForm = () => {
    if (selectedPolis.size === 0) {
      setErrorMsg("Pilih minimal satu poliklinik untuk dilaporkan.")
      return
    }
    setErrorMsg(null)
    setStep(3)
  }

  // Menghitung otomatis jumlah hari dalam bulan yang dipilih
  const maxDaysInMonth = useMemo(() => {
    return new Date(tahun, bulan, 0).getDate()
  }, [bulan, tahun])

  // Menyimpan data angka yang diketik user ke dalam state details
  const handleDetailChange = (poliId: string, field: keyof LaporanDetail, value: string) => {
    setDetails({
      ...details,
      [poliId]: {
        ...details[poliId],
        [field]: value
      }
    })
  }

  // Validasi isi data sebelum disimpan (Step 4)
  const validateForm = (): boolean => {
    for (const [poliId, data] of Object.entries(details)) {
      const poliName = masterPoli.find(p => p.id === poliId)?.nama_poli || 'Poli'
      
      const fields = [
        { k: 'dalam_kota_laki', n: 'Dalam Kota Laki-laki' },
        { k: 'dalam_kota_perempuan', n: 'Dalam Kota Perempuan' },
        { k: 'luar_kota_laki', n: 'Luar Kota Laki-laki' },
        { k: 'luar_kota_perempuan', n: 'Luar Kota Perempuan' }
      ]

      for (const f of fields) {
        const val = parseInt(data[f.k as keyof LaporanDetail])
        if (isNaN(val) || val < 0) {
          setErrorMsg(`${f.n} ${poliName} wajib diisi angka ≥ 0. Masukkan 0 jika tidak ada kunjungan.`)
          return false
        }
      }

      const hb = parseInt(data.hari_buka)
      if (isNaN(hb) || hb < 0 || hb > maxDaysInMonth) {
        setErrorMsg(`Hari Buka ${poliName}: nilai ${data.hari_buka} melebihi jumlah hari di bulan terpilih (${maxDaysInMonth} hari). Masukkan 0–${maxDaysInMonth}.`)
        return false
      }
    }
    return true
  }

  const handleReview = () => {
    if (!validateForm()) return
    setErrorMsg(null)
    setStep(4)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulan,
          tahun,
          details: Object.values(details)
        })
      })

      const resData = await response.json()

      if (!response.ok) {
        throw new Error(resData.error || "Gagal menyimpan laporan.")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/rs/riwayat')
      }, 2000)

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setStep(3)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-zinc-200 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-20 h-20 text-cyan-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Laporan Berhasil Dikirim!</h2>
        <p className="text-zinc-500">Status RS Anda di dashboard Dinkes telah diperbarui.</p>
        <p className="text-sm text-zinc-400 mt-4">Mengalihkan ke riwayat...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all">
      <div className="p-8 border-b border-zinc-100 bg-white">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-zinc-100 -z-0"></div>
          
          {['Periode', 'Pilih Poli', 'Isi Data', 'Konfirmasi'].map((label, idx) => {
            const isCompleted = step > idx + 1
            const isCurrent = step === idx + 1
            return (
              <div key={idx} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300
                  ${isCurrent ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-4 ring-cyan-50' : 
                    isCompleted ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' : 'bg-white text-zinc-400 border-2 border-zinc-100'}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-cyan-600" /> : idx + 1}
                </div>
                <span className={`text-sm font-semibold text-center ${isCurrent ? 'text-cyan-800' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-start animate-in shake">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Bulan Pelaporan</label>
                <div className="relative">
                  <select 
                    value={bulan}
                    onChange={(e) => setBulan(parseInt(e.target.value))}
                    className="w-full pl-5 pr-12 py-3.5 rounded-2xl border-0 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white focus:ring-2 focus:ring-cyan-600/20 shadow-inner outline-none transition-all font-medium text-zinc-800 appearance-none"
                  >
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Tahun</label>
                <input 
                  type="number" 
                  value={tahun}
                  onChange={(e) => setTahun(parseInt(e.target.value))}
                  min="2000"
                  max="2100"
                  className="w-full px-5 py-3.5 rounded-2xl border-0 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white focus:ring-2 focus:ring-cyan-600/20 shadow-inner outline-none transition-all font-medium text-zinc-800"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleNextToPoli} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all flex items-center">
                Lanjut <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 max-w-4xl mx-auto">
            <p className="text-zinc-500 mb-6 font-medium">Pilih poliklinik yang aktif dan memiliki data kunjungan untuk dilaporkan pada periode ini.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {masterPoli.map(poli => {
                const isSelected = selectedPolis.has(poli.id)
                return (
                  <button
                    key={poli.id}
                    onClick={() => togglePoli(poli.id)}
                    className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-sm' 
                        : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="font-semibold">{poli.nama_poli}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 text-white' : 'bg-zinc-100 text-transparent group-hover:bg-zinc-200'}`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between pt-10 mt-6 border-t border-zinc-100">
              <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-800 px-6 py-2.5 font-bold transition-all flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
              </button>
              <button onClick={handleNextToForm} className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center shadow-[0_4px_12px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_16px_rgba(8,145,178,0.3)]">
                Lanjut <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-4">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm mb-6 flex items-start border border-amber-200">
              <Calendar className="w-5 h-5 mr-3 shrink-0" />
              <p>Maksimal Hari Buka untuk bulan ini adalah <strong>{maxDaysInMonth} hari</strong>. Jika Hari Buka 0, nilai Rata-rata Kunjungan akan dihitung 0.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-5 font-bold min-w-[200px]">Poliklinik</th>
                    <th className="px-4 py-5 font-bold w-32">DK Laki</th>
                    <th className="px-4 py-5 font-bold w-32">DK Peremp</th>
                    <th className="px-4 py-5 font-bold w-32">LK Laki</th>
                    <th className="px-4 py-5 font-bold w-32">LK Peremp</th>
                    <th className="px-4 py-5 font-bold w-32 bg-zinc-100/50">Hari Buka</th>
                    <th className="px-6 py-5 font-bold w-32 text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {Array.from(selectedPolis).map(id => {
                    const poli = masterPoli.find(p => p.id === id)
                    const data = details[id]
                    
                    const sum = parseInt(data.dalam_kota_laki||'0') + parseInt(data.dalam_kota_perempuan||'0') + parseInt(data.luar_kota_laki||'0') + parseInt(data.luar_kota_perempuan||'0')
                    const hb = parseInt(data.hari_buka||'0')
                    const avg = hb > 0 ? (sum / hb).toFixed(2) : '0.00'

                    return (
                      <tr key={id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4 font-semibold text-zinc-800">{poli?.nama_poli}</td>
                        <td className="px-4 py-4"><input type="number" min="0" value={data.dalam_kota_laki} onChange={(e)=>handleDetailChange(id,'dalam_kota_laki',e.target.value)} className="w-full bg-zinc-50 group-hover:bg-white rounded-lg px-3 py-2 border-0 shadow-inner focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all font-medium text-zinc-800" /></td>
                        <td className="px-4 py-4"><input type="number" min="0" value={data.dalam_kota_perempuan} onChange={(e)=>handleDetailChange(id,'dalam_kota_perempuan',e.target.value)} className="w-full bg-zinc-50 group-hover:bg-white rounded-lg px-3 py-2 border-0 shadow-inner focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all font-medium text-zinc-800" /></td>
                        <td className="px-4 py-4"><input type="number" min="0" value={data.luar_kota_laki} onChange={(e)=>handleDetailChange(id,'luar_kota_laki',e.target.value)} className="w-full bg-zinc-50 group-hover:bg-white rounded-lg px-3 py-2 border-0 shadow-inner focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all font-medium text-zinc-800" /></td>
                        <td className="px-4 py-4"><input type="number" min="0" value={data.luar_kota_perempuan} onChange={(e)=>handleDetailChange(id,'luar_kota_perempuan',e.target.value)} className="w-full bg-zinc-50 group-hover:bg-white rounded-lg px-3 py-2 border-0 shadow-inner focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all font-medium text-zinc-800" /></td>
                        <td className="px-4 py-4 bg-zinc-50/50 group-hover:bg-zinc-100/50"><input type="number" min="0" max={maxDaysInMonth} value={data.hari_buka} onChange={(e)=>handleDetailChange(id,'hari_buka',e.target.value)} className="w-full bg-white rounded-lg px-3 py-2 border border-zinc-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all font-bold text-zinc-900 shadow-sm" /></td>
                        <td className="px-6 py-4 text-right font-bold text-cyan-700">{avg}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-10 mt-6 border-t border-zinc-100">
              <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-zinc-800 px-6 py-2.5 font-bold transition-all flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
              </button>
              <button onClick={handleReview} className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center shadow-[0_4px_12px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_16px_rgba(8,145,178,0.3)]">
                Review Laporan <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4">
            <div className="bg-zinc-50 border-0 shadow-inner p-8 rounded-3xl mb-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-6 tracking-tight">Ringkasan Laporan</h3>
              <dl className="grid grid-cols-2 gap-y-6 text-sm">
                <div>
                  <dt className="text-zinc-500 font-medium mb-1">Periode</dt>
                  <dd className="text-lg font-bold text-zinc-900">{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][bulan-1]} {tahun}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 font-medium mb-1">Jumlah Poliklinik</dt>
                  <dd className="text-lg font-bold text-zinc-900">{selectedPolis.size} Poli</dd>
                </div>
              </dl>
              <p className="mt-8 text-sm text-zinc-500 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <strong className="text-zinc-800">Pernyataan:</strong> Dengan menekan tombol Kirim, Anda menyatakan bahwa data kunjungan pasien telah diisi dengan benar sesuai dengan rekapitulasi rumah sakit.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} disabled={isSubmitting} className="text-zinc-500 hover:text-zinc-800 px-6 py-2.5 font-bold transition-all flex items-center disabled:opacity-50 bg-zinc-50 hover:bg-zinc-100 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Edit Kembali
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(8,145,178,0.2)] hover:shadow-[0_6px_16px_rgba(8,145,178,0.3)] flex items-center disabled:opacity-70 text-base">
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Kirim Laporan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
