import { lightTheme, type Theme } from "@rainbow-me/rainbowkit";

// Brand palette, from https://aztec.network/brand. Kept as literals because
// RainbowKit writes these into its own CSS variables, outside Tailwind.
const paper = "#FFF9F2";
const ink = "#141900";
const grey50 = "#E8E8E6";
const grey300 = "#626554";

const base = lightTheme({
  accentColor: ink,
  accentColorForeground: paper,
  borderRadius: "large",
});

/**
 * RainbowKit's wallet dialogs as a paper surface with ink type, matching the
 * "Connect Your Wallet" dialog that opens before them, with the dashboard's
 * card and button corners.
 */
export const rainbowKitTheme: Theme = {
  ...base,
  colors: {
    ...base.colors,
    modalBackground: paper,
    modalBackdrop: "rgba(20, 25, 0, 0.6)",
    modalBorder: grey50,
    modalText: ink,
    modalTextSecondary: grey300,
    modalTextDim: grey300,
    generalBorder: grey50,
    generalBorderDim: grey50,
    menuItemBackground: grey50,
    actionButtonSecondaryBackground: grey50,
    closeButton: grey300,
    closeButtonBackground: grey50,
    profileForeground: paper,
    profileAction: grey50,
    profileActionHover: grey50,
    selectedOptionBorder: ink,
  },
  fonts: {
    body: '"Oracle Standard", "Geist", system-ui, -apple-system, sans-serif',
  },
  radii: {
    ...base.radii,
    actionButton: "4px",
    connectButton: "4px",
    menuButton: "10px",
    modal: "20px",
    modalMobile: "20px",
  },
};
