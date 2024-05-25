import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { Database } from "@/app/database.types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      },
    );
    const {
      error,
      data: { session, user },
    } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !session || !user) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
    if (session.provider_token) {
      console.log("Storing Notion tokens");
      const { error } = await supabase.from("notion_token").upsert({
        user_id: user.id,
        access_token: session.provider_token,
        refresh_token: session.refresh_token,
      });
      if (error) {
        console.error("Failed to store Notion tokens", error);
      }
    } else {
      console.log("No notion tokens received.");
    }
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
