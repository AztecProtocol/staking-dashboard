import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { config } from "./wagmi.ts";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import App from "./App.tsx";
import { SafeProvider } from "./contexts/SafeContext.tsx";
import { ATPProvider } from "./contexts/ATPContext.tsx";
import { ATPSelectionProvider } from "./contexts/ATPSelectionContext.tsx";
import { TransactionCartProvider } from "./contexts/TransactionCartContext.tsx";
import { AlertProvider } from "./contexts/AlertContext.tsx";
import { TermsModalProvider } from "./contexts/TermsModalContext.tsx";
import { CustomAvatar } from "./components/CustomAvatar/CustomAvatar.tsx";
import { Alert } from "./components/Alert";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SafeProvider>
          <RainbowKitProvider avatar={CustomAvatar}>
            <ATPProvider>
              <ATPSelectionProvider>
                <AlertProvider>
                  <TermsModalProvider>
                    <TransactionCartProvider>
                      <Alert />
                      <App />
                    </TransactionCartProvider>
                  </TermsModalProvider>
                </AlertProvider>
              </ATPSelectionProvider>
            </ATPProvider>
          </RainbowKitProvider>
        </SafeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
