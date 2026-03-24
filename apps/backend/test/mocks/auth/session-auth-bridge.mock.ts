import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';
import { mock, mockReset } from 'vitest-mock-extended';

export const createSessionAuthBridgeMock = () => {
  const sessionAuthBridgeMock = mock<SessionAuthBridge>();

  return {
    sessionAuthBridgeMock,
    resetSessionAuthBridgeMock: () => {
      mockReset(sessionAuthBridgeMock);
    },
  };
};
