import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lnwmugtcfgqmrzzxkjri.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_OAD5V_ONkll6OTLnj0rBGw_law6vcWG'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
