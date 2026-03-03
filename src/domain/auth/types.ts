import { UserId } from '@modules/users/types';

export type RefreshTokenId = string & { readonly __type: unique symbol };
export type RefreshToken = string & { readonly __type: unique symbol };
export type RefreshTokenHash = string & { readonly __type: unique symbol };
export type AccessToken = string & { readonly __type: unique symbol };

export type AccessTokenPayload = {
  sub: string;
  email: string;
  jti: string;
  sid: string;
  iat: number;
  exp: number;
};

export type AuthenticatedUser = {
  userId: UserId;
  email: string;
  sessionId: string;
};

export type TokenGenerationOutput = {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};
