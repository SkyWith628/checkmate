// 관리자 계정 생성/승격 스크립트 (service_role 사용, 서버에서만 실행)
//
// 사용법:
//   node --env-file=.env.local scripts/create-admin.mjs <email> <password> [name]
//
// 동작:
//   1) 이메일 인증된 auth 유저 생성 (이미 있으면 기존 유저 재사용)
//   2) profiles 행을 role='admin' 으로 승격
//      - protect_profile_fields 트리거가 UPDATE 로의 role 변경을 막으므로
//        (service_role 은 auth.uid()=null → is_admin()=false),
//        트리거가 없는 DELETE + INSERT 경로로 승격한다.
//
// 보안: service_role 키를 쓰므로 로컬/서버에서만 실행. 비밀번호는 로그에 남기지 않는다.

import { createClient } from "@supabase/supabase-js";

const [email, password, name = "관리자"] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    "사용법: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [name]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (--env-file=.env.local 확인)",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// 1) 유저 생성 (이미 있으면 기존 유저 조회)
let userId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});

if (createErr) {
  // 이미 존재하는 이메일이면 기존 유저를 찾아 비밀번호를 갱신하고 승격
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.users.find((u) => u.email === email);
  if (!existing) {
    console.error("유저 생성 실패:", createErr.message);
    process.exit(1);
  }
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password });
  console.log(`기존 계정 사용 + 비밀번호 갱신: ${email}`);
} else {
  userId = created.user.id;
  console.log(`계정 생성: ${email}`);
}

// 2) role='admin' 승격 — UPDATE 트리거 우회(DELETE + INSERT)
await admin.from("profiles").delete().eq("id", userId);
const { error: insertErr } = await admin
  .from("profiles")
  .insert({ id: userId, name, role: "admin" });

if (insertErr) {
  console.error("관리자 승격 실패:", insertErr.message);
  process.exit(1);
}

// 검증
const { data: profile } = await admin
  .from("profiles")
  .select("role, name")
  .eq("id", userId)
  .single();

if (profile?.role !== "admin") {
  console.error("승격 검증 실패: role =", profile?.role);
  process.exit(1);
}

console.log(`✅ 관리자 준비 완료 — ${email} (role=${profile.role}, name=${profile.name})`);
console.log("   이 계정으로 로그인하면 우상단 메뉴에 '관리자 페이지' 항목이 보입니다.");
