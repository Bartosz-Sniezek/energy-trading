export type RefreshTokenId = string & { readonly __type: unique symbol };
export type RefreshToken = string & { readonly __type: unique symbol };
export type RefreshTokenHash = string & { readonly __type: unique symbol };
export type AccessToken = string & { readonly __type: unique symbol };

export type AccessTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
};
