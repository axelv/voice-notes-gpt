import OAuth2Server, { Request, Response } from "@node-oauth/oauth2-server";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH2_MODEL } from "../model";

export const dynamic = "force-dynamic"; // static by default, unless reading the request

const oauth = new OAuth2Server({
  model: OAUTH2_MODEL,
});
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let req: Request | null = null;
  if (
    request.headers.get("Content-Type") === "application/x-www-form-urlencoded"
  ) {
    req = new Request({
      headers: request.headers,
      method: request.method,
      query: Object.fromEntries(url.searchParams.entries()),
      body: Object.fromEntries((await request.formData()).entries()),
    });
  }
  if (request.headers.get("Content-Type") === "application/json") {
    req = new Request({
      headers: request.headers,
      method: request.method,
      query: Object.fromEntries(url.searchParams.entries()),
      body: await request.json(),
    });
  }
  if (!req) throw new Error("Unsupported Content-Type");
  const res = new Response();
  await oauth.token(req, res);
  return new NextResponse(res.body, {
    headers: res.headers,
    status: res.status,
  });
}
