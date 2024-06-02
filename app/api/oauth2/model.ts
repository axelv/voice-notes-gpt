import { createClient } from "@/utils/supabase/server";
import {
  Client,
  Token,
  AuthorizationCode,
  User,
  RefreshToken,
} from "@node-oauth/oauth2-server";

if (
  !process.env.CLIENT_ID ||
  !process.env.CLIENT_SECRET ||
  !process.env.CLIENT_REDIRECT_URI
) {
  throw new Error(
    "Missing environment variables" +
      process.env.CLIENT_ID +
      process.env.CLIENT_SECRET +
      process.env.CLIENT_REDIRECT_URI,
  );
}

const supabase = createClient();

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

function getClient(
  clientId: string,
  clientSecret: string | null,
): Promise<Client> {
  if (
    clientId == process.env.CLIENT_ID &&
    (clientSecret == process.env.CLIENT_SECRET || !clientSecret)
  ) {
    return Promise.resolve({
      id: clientId,
      redirectUris: [process.env.CLIENT_REDIRECT_URI!],
      accessTokenLifetime: 3600, // 1 hour
      refreshTokenLifetime: 86400, // 1 day
      grants: ["authorization_code", "refresh_token"],
    });
  }
  return Promise.reject(
    new AuthorizationError("No client found with id=" + clientId),
  );
}

async function getAccessToken(token: string): Promise<Token> {
  const { data, error } = await supabase
    .from("access_token")
    .select()
    .eq("access_token", token)
    .single();
  if (error) throw new AuthorizationError("Failed to get access token");
  if (!data) throw new AuthorizationError("Access token not found");
  return {
    accessToken: data.access_token,
    accessTokenExpiresAt: data?.expires_at
      ? new Date(data.expires_at)
      : undefined,
    scope: data?.scope ?? undefined,
    client: {
      id: process.env.CLIENT_ID!,
      grants: ["authorization_code", "refresh_token"],
    },
    user: { id: data?.user_id },
  };
}
async function getRefreshToken(refreshToken: string): Promise<RefreshToken> {
  const { error, data } = await supabase
    .from("refresh_token")
    .select()
    .eq("refresh_token", refreshToken)
    .single();
  if (error) throw new AuthorizationError("Failed to get refresh token");
  if (!data) throw new AuthorizationError("Refresh token not found");

  return {
    refreshToken: data.refresh_token,
    refreshTokenExpiresAt: new Date(data.expires_at),
    scope: data.scope ?? undefined,
    client: {
      id: process.env.CLIENT_ID!,
      grants: ["authorization_code", "refresh_token"],
    },
    user: { id: data.user_id },
  };
}
async function getAuthorizationCode(code: string): Promise<AuthorizationCode> {
  const { error, data } = await supabase
    .from("authorization_code")
    .select()
    .eq("authorization_code", code)
    .single();
  if (error) throw new AuthorizationError("Failed to get authorization code");
  if (!data) throw new AuthorizationError("Authorization code not found");

  return {
    authorizationCode: data.authorization_code,
    expiresAt: new Date(data.expires_at),
    redirectUri: data.redirect_uri,
    scope: data.scope ?? undefined,
    client: {
      id: process.env.CLIENT_ID!,
      grants: ["authorization_code", "refresh_token"],
    },
    user: { id: data.user_id },
  };
}

async function saveToken(
  token: Token,
  client: Client,
  user: User,
): Promise<Token> {
  const { error: accessTokenError, data: accessTokenData } = await supabase
    .from("access_token")
    .insert({
      access_token: token.accessToken,
      expires_at: token.accessTokenExpiresAt?.toJSON(),
      scope: token.scope,
      user_id: user.id,
    })
    .select()
    .single();
  if (accessTokenError) {
    console.log(accessTokenError);
    throw new AuthorizationError("Failed to save access token.");
  }
  if (!accessTokenData) {
    throw new AuthorizationError("Failed to save access token.");
  }

  if (!token.refreshToken || !token.refreshTokenExpiresAt)
    throw new AuthorizationError("Refresh token not found");

  const { error: refreshTokenError, data: refreshTokenData } = await supabase
    .from("refresh_token")
    .insert({
      refresh_token: token.refreshToken,
      expires_at: token.refreshTokenExpiresAt?.toJSON(),
      scope: token.scope,
      user_id: user.id,
    })
    .select()
    .single();
  if (refreshTokenError)
    throw new AuthorizationError("Failed to save refresh token");
  if (!refreshTokenData)
    throw new AuthorizationError("Failed to save refresh token");
  return {
    accessToken: accessTokenData.access_token,
    accessTokenExpiresAt: accessTokenData.expires_at
      ? new Date(accessTokenData.expires_at)
      : undefined,
    refreshToken: refreshTokenData.refresh_token,
    refreshTokenExpiresAt: new Date(refreshTokenData.expires_at),
    client: {
      id: process.env.CLIENT_ID!,
      grants: ["authorization_code", "refresh_token"],
    },
    user: {
      id: accessTokenData.user_id,
    },
  };
}

async function saveAuthorizationCode(
  code: AuthorizationCode,
  client: Client,
  user: User,
): Promise<AuthorizationCode> {
  const { data, error } = await supabase
    .from("authorization_code")
    .insert({
      authorization_code: code.authorizationCode,
      expires_at: code.expiresAt.toJSON(),
      redirect_uri: code.redirectUri,
      scope: code.scope,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) {
    console.log(error);
    throw new AuthorizationError("Failed to save authorization code");
  }
  if (!data) throw new AuthorizationError("Failed to save authorization code");
  return {
    authorizationCode: data.authorization_code,
    expiresAt: new Date(data.expires_at),
    redirectUri: data.redirect_uri,
    scope: data.scope ?? undefined,
    client: {
      id: process.env.CLIENT_ID!,
      grants: ["authorization_code", "refresh_token"],
    },
    user: {
      id: data.user_id,
    },
  };
}

async function revokeToken(token: Token): Promise<boolean> {
  if (!token.refreshToken)
    throw new AuthorizationError("Refresh token not found");
  const { error } = await supabase
    .from("refresh_token")
    .delete()
    .eq("refresh_token", token.refreshToken);
  if (error) throw new AuthorizationError("Failed to revoke refresh token");
  return true;
}

async function revokeAuthorizationCode(code: AuthorizationCode) {
  const { error } = await supabase
    .from("authorization_code")
    .delete()
    .eq("authorization_code", code.authorizationCode);
  if (error)
    throw new AuthorizationError("Failed to revoke authorization code");
  return true;
}
export const OAUTH2_MODEL = {
  getClient,
  getAccessToken,
  getRefreshToken,
  getAuthorizationCode,
  saveToken,
  saveAuthorizationCode,
  revokeToken,
  revokeAuthorizationCode,
};
