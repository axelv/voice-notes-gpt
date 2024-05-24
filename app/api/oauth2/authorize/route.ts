import OAuth2Server, { Request, Response } from "@node-oauth/oauth2-server";
import { OAUTH2_MODEL } from "../model";
import { NextRequest, NextResponse } from "next/server";

const oauth = new OAuth2Server({
  model: OAUTH2_MODEL,
});
export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;

  const req = new Request({
    headers: request.headers,
    method: request.method,
    query: Object.fromEntries(searchParams),
  });
  const res = new Response();
  await oauth.authorize(req, res);
  return new NextResponse(null, { headers: res.headers });
}
