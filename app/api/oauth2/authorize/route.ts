import OAuth2Server, { Request, Response } from "@node-oauth/oauth2-server";
import { OAUTH2_MODEL } from "../model";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic"; // static by default, unless reading the request

const oauth = new OAuth2Server({
  model: OAUTH2_MODEL,
});
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams, origin } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = cookies();
    const url = new URL(request.url);
    cookieStore.set("next", `${url.pathname}${url.search}`);
    return NextResponse.redirect(`${origin}/login`, {});
  }

  const req = new Request({
    headers: Object.fromEntries(request.headers),
    method: request.method,
    query: Object.fromEntries(searchParams),
  });
  const res = new Response();
  await oauth.authorize(req, res, {
    authenticateHandler: {
      handle() {
        return {
          id: user.id,
          email: user.email,
        };
      },
    },
  });
  return new NextResponse(null, { headers: res.headers, status: res.status });
}
