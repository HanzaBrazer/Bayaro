import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Menukar `code` OAuth (Google) / tautan email menjadi sesi, lalu arahkan:
// user baru (belum onboarding) -> /onboarding, selainnya -> /dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let dest = "/dashboard";
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarded")
          .eq("id", user.id)
          .maybeSingle();
        dest = profile?.onboarded ? "/dashboard" : "/onboarding";
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
