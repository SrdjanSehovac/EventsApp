import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchCurrentUser,
  signInRequest,
  signOutRequest,
  signUpRequest,
} from '../api/auth';
import { ApiError } from '../api/client';
import { setAuthToken, subscribeUnauthorized } from '../api/session';
import type { AuthUser, SignInInput, SignUpInput } from '../types/auth';
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  isSignedIn: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string | null, user: AuthUser | null) {
  setAuthToken(token);
  await Promise.all([setStoredToken(token), setStoredUser(user)]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const applySignedOut = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setStatus('signedOut');
    queryClient.removeQueries({ queryKey: ['favourites'] });
    queryClient.removeQueries({ queryKey: ['business'] });
    queryClient.removeQueries({ queryKey: ['submissions'] });
  }, [queryClient]);

  const applySignedIn = useCallback(async (nextToken: string | null, nextUser: AuthUser) => {
    await persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setStatus('signedIn');
    void queryClient.invalidateQueries({ queryKey: ['favourites'] });
    void queryClient.invalidateQueries({ queryKey: ['business'] });
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const storedToken = await getStoredToken();
      const storedUser = await getStoredUser();

      if (!storedToken && !storedUser) {
        if (!cancelled) applySignedOut();
        return;
      }

      if (storedToken) setAuthToken(storedToken);

      try {
        const remoteUser = await fetchCurrentUser();
        if (cancelled) return;
        await applySignedIn(storedToken, remoteUser);
      } catch (error) {
        if (cancelled) return;
        const unauthorized = error instanceof ApiError && error.status === 401;
        if (storedUser && storedToken && !unauthorized) {
          // /auth/me missing or EventServer is down — keep the local session.
          setToken(storedToken);
          setUser(storedUser);
          setStatus('signedIn');
          return;
        }
        await clearStoredSession();
        applySignedOut();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySignedIn, applySignedOut]);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      void clearStoredSession();
      applySignedOut();
    });
  }, [applySignedOut]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const session = await signInRequest(input);
      let nextUser = session.user;
      if (session.token) setAuthToken(session.token);
      if (!nextUser && session.token) {
        try {
          nextUser = await fetchCurrentUser();
        } catch {
          nextUser = {
            user_id: input.email,
            email: input.email,
            display_name: input.email,
          };
        }
      }
      if (!nextUser) {
        throw new Error('Sign-in succeeded but EventServer returned no user profile.');
      }
      await applySignedIn(session.token, nextUser);
    },
    [applySignedIn],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const session = await signUpRequest(input);
      let nextUser = session.user;
      let nextToken = session.token;

      if (!nextToken) {
        const signedIn = await signInRequest(input);
        nextToken = signedIn.token;
        nextUser = signedIn.user ?? nextUser;
      }

      if (nextToken) setAuthToken(nextToken);
      if (!nextUser && nextToken) {
        try {
          nextUser = await fetchCurrentUser();
        } catch {
          nextUser = {
            user_id: input.email,
            email: input.email,
            display_name: input.display_name,
          };
        }
      }
      if (!nextUser) {
        nextUser = {
          user_id: input.email,
          email: input.email,
          display_name: input.display_name,
        };
      }
      await applySignedIn(nextToken, nextUser);
    },
    [applySignedIn],
  );

  const signOut = useCallback(async () => {
    await signOutRequest();
    await clearStoredSession();
    applySignedOut();
  }, [applySignedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      isSignedIn: status === 'signedIn',
      signIn,
      signUp,
      signOut,
    }),
    [status, user, token, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
