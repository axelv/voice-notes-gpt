import OAuth2Server, { Request, Response } from "@node-oauth/oauth2-server";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH2_MODEL } from "../model";

export const dynamic = "force-dynamic"; // static by default, unless reading the request

const oauth = new OAuth2Server({
  model: OAUTH2_MODEL,
});
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const req = new Request({
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    query: Object.fromEntries(url.searchParams.entries()),
    body: Object.fromEntries((await request.formData()).entries()),
  });
  const res = new Response();
  await oauth.token(req, res);
  return NextResponse.json(res.body, {
    headers: res.headers,
    status: res.status,
  });
}
