"use client";

import { Identity, LoginRequest, getIdentity, login } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import { PropsWithChildren, createContext, useContext, useEffect, useId, useRef, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface Context {
  initialized: boolean;
  promptParentId: string;
}

const GSIContext = createContext<Context | undefined>(undefined);

export const GSIProvider = ({ children }: PropsWithChildren<{}>) => {
  const [initialized, setInitialized] = useState(false);
  const promptParentId = useId();
  const queryClient = useQueryClient();

  const onResponse = (
    res: google.accounts.id.CredentialResponse,
    nonce: string
  ) => {
    login({
      id_token: res.credential,
      nonce,
    }).then((res) => {
      queryClient.setQueryData<Identity>(["identity"], res);
    });
    // authenticate({
    //   grant_type: "id_token",
    //   provider: "google",
    //   id_token: res.credential,
    //   nonce,
    // });
  };

  const onLoad = () => {
    if (!CLIENT_ID) throw new Error("Missing Google Client ID");

    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (res) => onResponse(res, nonce),
      nonce,
      prompt_parent_id: promptParentId,
    });

    setInitialized(true);
  };

  return (
    <GSIContext.Provider value={{ initialized, promptParentId }}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={onLoad}
      />
      {children}
    </GSIContext.Provider>
  );
};

export function useGSI() {
  const context = useContext(GSIContext);
  if (context === undefined) {
    throw new Error("useGSI must be used within a GSIProvider");
  }
  return context;
}

export function GoogleLoginButton() {
  const container = useRef<HTMLDivElement>(null);
  const { initialized } = useGSI();

  useEffect(() => {
    if (!initialized || !container.current) return;
    google.accounts.id.renderButton(container.current, {
      type: "standard",
      size: "large",
      text: "signin",
    });
  }, [initialized]);

  return <div ref={container} />;
}

export const useAuth = () => {
  const {data: identity} =useQuery({
    queryKey: ["identity"],
    queryFn: getIdentity,
  });

  return {
    identity,
    authenticated: !!identity,
    unauthenticated: identity === null,
  }
}
