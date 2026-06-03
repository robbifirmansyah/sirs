import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfyzkxtmbyygmdblugbg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_W_sibpv2RUe8I-BQqjQ17A_l-UVa61N'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function getShortEmail(namaRs) {
  const name = namaRs.toLowerCase().replace(/rs\s*umum\s*daerah\s*|rs\s*umum\s*|rsu\s*|rs\s*/g, '')
  const shortName = name.split(' ')[0].replace(/[^a-z0-9]/g, '')
  return `${shortName}@sirs.online`
}

async function seed() {
  const { data: rsList, error: rsError } = await supabase.from('rumah_sakit').select('id, nama_rs, kode_rs')
  
  if (rsError) {
    console.log("ERROR GETTING RS", rsError.message)
    return
  }

  console.log("=== MEMBUAT AKUN UNTUK SEMUA RS ===")
  for (const rs of rsList) {
    const email = getShortEmail(rs.nama_rs)
    const password = 'password123'
    
    const { error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'rs',
          rs_id: rs.id,
          nama_rs: rs.nama_rs
        }
      }
    })

    if (signUpError && signUpError.status !== 422) {
      console.log(`Gagal membuat akun untuk ${rs.nama_rs}:`, signUpError.message)
    } else {
      console.log(`[OK] ${rs.nama_rs}`)
      console.log(`     Email: ${email}`)
      console.log(`     Pass : ${password}`)
    }
  }
  console.log("===================================")
}

seed()
