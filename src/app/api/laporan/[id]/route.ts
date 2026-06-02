import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const res = await supabase.auth.getUser(token)
        user = res.data.user
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bulan, tahun, details } = body

    // Server-side Validations
    if (!bulan || !tahun || !details || !Array.isArray(details) || details.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const maxDays = new Date(tahun, bulan, 0).getDate()

    for (const d of details) {
      if (
        parseInt(d.dalam_kota_laki) < 0 ||
        parseInt(d.dalam_kota_perempuan) < 0 ||
        parseInt(d.luar_kota_laki) < 0 ||
        parseInt(d.luar_kota_perempuan) < 0
      ) {
        return NextResponse.json({ error: 'Nilai kunjungan tidak boleh negatif.' }, { status: 400 })
      }
      const hb = parseInt(d.hari_buka)
      if (hb < 0 || hb > maxDays) {
        return NextResponse.json({ error: `Hari buka tidak valid. Maksimal ${maxDays} hari untuk bulan ${bulan}/${tahun}.` }, { status: 400 })
      }
    }

    // Update Induk
    const { error: indukError } = await supabase
      .from('laporan_induk')
      .update({ bulan, tahun, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (indukError) {
      if (indukError.code === '23505') {
        return NextResponse.json({ error: `Laporan untuk bulan ${bulan} tahun ${tahun} sudah ada. Pastikan tidak menduplikasi laporan lain.` }, { status: 409 })
      }
      throw indukError
    }

    // Delete existing details and insert new ones
    const { error: delError } = await supabase
      .from('laporan_detail')
      .delete()
      .eq('laporan_id', id)

    if (delError) throw delError

    type DetailInput = {
      poli_id: string;
      dalam_kota_laki: string | number;
      dalam_kota_perempuan: string | number;
      luar_kota_laki: string | number;
      luar_kota_perempuan: string | number;
      hari_buka: string | number;
    }

    const detailsToInsert = details.map((d: DetailInput) => ({
      laporan_id: id,
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
      throw detailsError
    }

    return NextResponse.json({ success: true, message: 'Laporan berhasil diperbarui.' })
  } catch (error: unknown) {
    console.error('API Laporan Edit Error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
