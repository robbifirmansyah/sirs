import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    let supabase = await createClient()
    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { createClient: createSupabaseJs } = await import('@supabase/supabase-js')
        supabase = createSupabaseJs(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        }) as any
        const res = await supabase.auth.getUser()
        user = res.data.user
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rs_id = user.user_metadata?.rs_id

    // Fallback for MVP: if seed didn't bind rs_id, just pick the first RS to simulate for testing.
    // In production, we'd strictly enforce rs_id presence.
    let target_rs_id = rs_id
    if (!target_rs_id) {
      const { data: fallbackRs } = await supabase.from('rumah_sakit').select('id').limit(1).single()
      if (fallbackRs) target_rs_id = fallbackRs.id
      else throw new Error("No RS found for this user.")
    }

    // Mengambil body request (data yang dikirim dari form frontend)
    const body = await req.json()
    const { bulan, tahun, details } = body

    // Server-side Validations (Validasi di sisi server agar data tidak error)
    if (!bulan || !tahun || !details || !Array.isArray(details) || details.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Hitung jumlah hari dalam bulan tersebut (misal Februari = 28/29 hari)
    const maxDays = new Date(tahun, bulan, 0).getDate()

    // Looping untuk mengecek setiap data poli yang dikirim
    for (const d of details) {
      // Pastikan tidak ada input nilai negatif (minus)
      if (
        parseInt(d.dalam_kota_laki) < 0 ||
        parseInt(d.dalam_kota_perempuan) < 0 ||
        parseInt(d.luar_kota_laki) < 0 ||
        parseInt(d.luar_kota_perempuan) < 0
      ) {
        return NextResponse.json({ error: 'Nilai kunjungan tidak boleh negatif.' }, { status: 400 })
      }
      
      const hb = parseInt(d.hari_buka)
      // Pastikan hari buka tidak melebihi total hari dalam bulan tersebut
      if (hb < 0 || hb > maxDays) {
        return NextResponse.json({ error: `Hari buka tidak valid. Maksimal ${maxDays} hari untuk bulan ${bulan}/${tahun}.` }, { status: 400 })
      }
    }

    // 1. Insert ke tabel laporan_induk (sebagai header laporan)
    const { data: indukData, error: indukError } = await supabase
      .from('laporan_induk')
      .insert({
        rs_id: target_rs_id,
        bulan,
        tahun
      })
      .select('id')
      .single()

    if (indukError) {
      if (indukError.code === '23505') { // unique violation
        return NextResponse.json({ error: `Laporan untuk bulan ${bulan} tahun ${tahun} sudah ada. Silakan gunakan menu Edit.` }, { status: 409 })
      }
      throw indukError
    }

    // 2. Insert Details
    type DetailInput = {
      poli_id: string;
      dalam_kota_laki: string | number;
      dalam_kota_perempuan: string | number;
      luar_kota_laki: string | number;
      luar_kota_perempuan: string | number;
      hari_buka: string | number;
    }

    const detailsToInsert = details.map((d: DetailInput) => ({
      laporan_id: indukData.id,
      poli_id: d.poli_id,
      dalam_kota_laki: parseInt(String(d.dalam_kota_laki)),
      dalam_kota_perempuan: parseInt(String(d.dalam_kota_perempuan)),
      luar_kota_laki: parseInt(String(d.luar_kota_laki)),
      luar_kota_perempuan: parseInt(String(d.luar_kota_perempuan)),
      hari_buka: parseInt(String(d.hari_buka))
    }))

    const { error: detailsError } = await supabase
      .from('laporan_detail')
      .insert(detailsToInsert)

    if (detailsError) {
      // Rollback induk (Note: Ideally use RPC or Supabase function for transaction)
      await supabase.from('laporan_induk').delete().eq('id', indukData.id)
      throw detailsError
    }

    return NextResponse.json({ success: true, message: 'Laporan berhasil disimpan.' })
  } catch (error: unknown) {
    console.error('API Laporan Error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : JSON.stringify(error) }, { status: 500 })
  }
}
