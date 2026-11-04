import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vfmqkluidyurdwvusmhq.supabase.co' // Dán URL dự án của bạn vào đây
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbXFrbHVpZHl1cmR3dnVzbWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzcwODQsImV4cCI6MjA2NzI1MzA4NH0.MizBsd6Q90V_xQ7wCfmlrMNgqrGiUvHzCN2JcfU2IXM'   // Dán anon key của bạn vào đây

export const supabase = createClient(supabaseUrl, supabaseKey)