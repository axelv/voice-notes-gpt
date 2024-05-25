import { markdownToBlocks } from "@tryfabric/martian";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OAuth2Server, {
  Request,
  Response,
  UnauthorizedRequestError,
  InvalidTokenError,
  InsufficientScopeError,
  AccessDeniedError,
  OAuthError,
} from "@node-oauth/oauth2-server";
import { OAUTH2_MODEL } from "../oauth2/model";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic"; // static by default, unless reading the request

const CreateVoiceNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export async function GET() {
  return NextResponse.json({
    message:
      "Welcome to the voice notes API. Use POST to create a new voice note.",
  });
}

class VoiceNotesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceNotesError";
  }
}

const oauth = new OAuth2Server({
  model: OAUTH2_MODEL,
});

async function authenticate(request: NextRequest) {
  const req = new Request({
    headers: Object.fromEntries(request.headers),
    method: request.method,
    body: request.json(),
    query: Object.fromEntries(new URL(request.url).searchParams),
  });
  const res = new Response();
  const { user } = await oauth.authenticate(req, res, {});
  return user.id as string;
}

/**
 * Get the database id for a database called "Voice Notes"
 */
function getVoiceNotesDatabaseId(notion: Client) {
  return notion
    .search({
      filter: {
        property: "object",
        value: "database",
      },
      query: "Voice Notes",
    })
    .then((response) => {
      if (response.results.length > 0) {
        return response.results[0].id;
      } else {
        throw new VoiceNotesError("Voice Notes database not found");
      }
    });
}

export async function POST(request: NextRequest) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }
  let user_id;
  try {
    user_id = await authenticate(request);
  } catch (e) {
    if (e instanceof UnauthorizedRequestError) {
      console.log(e.message);
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: e.code },
      );
    }
    if (e instanceof AccessDeniedError) {
      /**
       * The resource owner or authorization server denied the request. See Section 4.1.2.1 of RFC 6749.
       */
      console.log(e.message);
      return NextResponse.json(
        { message: "Access Denied." },
        { status: e.code },
      );
    }
    if (e instanceof InvalidTokenError) {
      /**
       * The access token provided is expired, revoked, malformed, or invalid for other reasons. See Section 3.1 of RFC 6750.
       */
      console.log(e.message);
      return NextResponse.json(
        {
          message:
            "Token is invalid or expired. Please sign in or request a new token.",
        },
        { status: e.code },
      );
    }
    if (e instanceof OAuthError) {
      console.log(e.message);
      return NextResponse.json({ message: e.name }, { status: e.code });
    }
    if (e instanceof Error) {
      console.error(e.message, e.stack);
    }
    return NextResponse.json(
      { message: "Internal Server Error. Please try again later." },
      { status: 500 },
    );
  }

  const supabase = createClient();
  const { data: notionData, error } = await supabase
    .from("notion_token")
    .select("access_token")
    .eq("user_id", user_id)
    .single();

  if (!notionData || error) {
    console.log("No access token found for Notion API. " + error?.message);
    return NextResponse.json(
      { message: "No access token found for Notion API. Please sign in." },
      { status: 401 },
    );
  }
  const { access_token: bearer } = notionData;
  if (!bearer) {
    console.log("No access token found for Notion API.");
    return NextResponse.json(
      { message: "No access token found for Notion API. Please sign in." },
      { status: 401 },
    );
  }
  let data: z.infer<typeof CreateVoiceNoteSchema> | null = null;
  try {
    data = CreateVoiceNoteSchema.parse(await request.json());
  } catch (e) {
    if (e instanceof Error) console.error(e.message);
    console.log("Request body: " + request.text());
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }
  const blocks = markdownToBlocks(data.content);
  const notion = new Client({ auth: bearer });
  let database_id: string;
  try {
    database_id = await getVoiceNotesDatabaseId(notion);
  } catch (e) {
    if (e instanceof VoiceNotesError) {
      return NextResponse.json(
        { message: "Could not find Voice Notes database" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
  const page_response = await notion.pages.create({
    parent: {
      database_id,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
    },
    children: blocks as BlockObjectRequest[],
  });
  return NextResponse.json(
    {
      voice_note_id: page_response.id,
      message:
        "Successfully created new voice note with id: " + page_response.id,
    },
    { status: 201 },
  );
}
