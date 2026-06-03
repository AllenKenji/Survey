import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [forceLoggedOut, setForceLoggedOut] = useState(false);
  const syncBisPresenceMutation = trpc.auth.syncBisPresence.useMutation();
  const bisPresenceSessionId = useMemo(() => {
    if (typeof window === "undefined") return "server";

    const storageKey = "cfdp-bis-presence-session-id";
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;

    const generated =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(storageKey, generated);
    return generated;
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const withLogoutMarker = useCallback((url: string) => {
    try {
      const target = new URL(url, window.location.origin);
      target.searchParams.set("loggedOut", Date.now().toString());
      return target.toString();
    } catch {
      return url;
    }
  }, []);

  const logout = useCallback(async () => {
    setForceLoggedOut(true);
    utils.auth.me.setData(undefined, null);

    try {
      if (meQuery.data) {
        void syncBisPresenceMutation
          .mutateAsync({
            sessionId: bisPresenceSessionId,
            online: false,
          })
          .catch((presenceError) => {
            console.warn("[BIS Presence] Failed to clear survey presence", presenceError);
          });
      }

      void logoutMutation.mutateAsync().catch((error: unknown) => {
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          return;
        }
        console.warn("[Auth] Background logout mutation failed", error);
      });

      if (typeof window !== "undefined") {
        window.location.href = withLogoutMarker(getLoginUrl());
      }
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [
    bisPresenceSessionId,
    logoutMutation,
    meQuery.data,
    syncBisPresenceMutation,
    utils,
    withLogoutMarker,
  ]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );

    if (forceLoggedOut) {
      return {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    }

    return {
      user: meQuery.data ?? null,
      // Block UI only during initial auth load (or explicit logout),
      // not during normal background refetches.
      loading:
        meQuery.isLoading ||
        (!meQuery.data && meQuery.isFetching),
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    forceLoggedOut,
    meQuery.data,
    meQuery.error,
    meQuery.isFetching,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (forceLoggedOut) return;
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (!meQuery.data && meQuery.isFetching) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    forceLoggedOut,
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.data,
    meQuery.isFetching,
    meQuery.isLoading,
    state.user,
  ]);

  useEffect(() => {
    if (forceLoggedOut) return;
    if (!state.user) return;

    let cancelled = false;
    const syncPresence = async () => {
      try {
        await syncBisPresenceMutation.mutateAsync({
          sessionId: bisPresenceSessionId,
          online: true,
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("[BIS Presence] Failed to sync survey presence", error);
        }
      }
    };

    void syncPresence();
    const interval = window.setInterval(() => {
      void syncPresence();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bisPresenceSessionId, forceLoggedOut, state.user, syncBisPresenceMutation]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
