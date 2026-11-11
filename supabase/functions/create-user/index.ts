// Edge Function: create-user
// Tạo tài khoản nhân viên — CHỈ admin đã đăng nhập mới được gọi.
// Dùng service_role key (bypass RLS) để tạo user trong Supabase Auth.
// Triển khai: supabase functions deploy create-user --project-ref <project_ref>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return json(405, { error: 'Chỉ hỗ trợ POST' })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // ---- 1) Xác thực người gọi bằng JWT gửi lên ----
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return json(401, { error: 'Thiếu hoặc sai Authorization header' })
    }

    // Client mang JWT của người gọi (quyền authenticated, có RLS)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData?.user) {
      return json(401, { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' })
    }
    const caller = userData.user

    // ---- 2) Kiểm tra role = admin trong bảng profiles ----
    // Tra theo id trước; nếu không thấy (hồ sơ tạo tay id sai) thì tra theo email
    const callerEmail = (caller.email || '').toLowerCase()

    const { data: profileById, error: byIdError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()

    let profileRole = profileById?.role
    let profileSource = 'id'

    if (!profileRole && !byIdError) {
      const { data: profileByEmail } = await callerClient
        .from('profiles')
        .select('role')
        .eq('email', callerEmail)
        .maybeSingle()
      if (profileByEmail) {
        profileRole = profileByEmail.role
        profileSource = 'email'
      }
    }

    if (!profileRole) {
      return json(403, {
        error: `Không tìm thấy hồ sơ quyền cho ${callerEmail}. Hãy chạy file supabase/profiles_repair.sql trong Supabase SQL Editor để đồng bộ hồ sơ với tài khoản Auth.`,
      })
    }

    if (profileRole !== 'admin') {
      return json(403, {
        error: `Chỉ quản trị (admin) mới được tạo tài khoản. Hồ sơ hiện tại của bạn (${profileSource === 'email' ? 'tra theo email' : 'tra theo id'}) có role = '${profileRole}'. Nếu bạn là admin, chạy supabase/profiles_repair.sql để gán quyền.`,
      })
    }

    // ---- 3) Đọc & kiểm tra dữ liệu đầu vào ----
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = body.role === 'admin' ? 'admin' : 'staff'

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: 'Email không hợp lệ' })
    }
    if (password.length < 6) {
      return json(400, { error: 'Mật khẩu tối thiểu 6 ký tự' })
    }

    // ---- 4) Tạo user bằng service_role key (email_confirm=true: không cần xác nhận email) ----
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      const message = /already/i.test(createError.message || '')
        ? `Email ${email} đã được đăng ký.`
        : createError.message
      return json(400, { error: message })
    }

    // ---- 5) Ghi hồ sơ vào profiles ----
    const { error: profileUpsertError } = await serviceClient
      .from('profiles')
      .upsert(
        { id: created.user!.id, email, role },
        { onConflict: 'id' }
      )

    if (profileUpsertError) {
      return json(200, {
        ok: true,
        warning: `Đã tạo tài khoản nhưng chưa ghi được hồ sơ: ${profileUpsertError.message}`,
        user: { id: created.user!.id, email },
      })
    }

    return json(200, {
      ok: true,
      user: { id: created.user!.id, email, role },
    })
  } catch (err) {
    return json(500, { error: `Lỗi không xác định: ${String(err)}` })
  }
})
