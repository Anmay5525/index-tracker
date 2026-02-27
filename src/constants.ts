export type DefaultIndices = { symbol: string; name?: string };

export const SYMBOLS = {
  NIFTY_50: "^NSEI",
  NIFTY_MIDCAP_150: "NIFTYMIDCAP150.NS",
  NIFTY_SMALLCAP_250: "NIFTYSMLCAP250.NS",
};

export const DEFAULT_INDICES: DefaultIndices[] = [
  { symbol: SYMBOLS.NIFTY_50, name: "Nifty 50" },
  {
    symbol: SYMBOLS.NIFTY_MIDCAP_150,
    name: "Nifty Midcap 150",
  },
  {
    symbol: SYMBOLS.NIFTY_SMALLCAP_250,
    name: "Nifty Smallcap 250",
  },
];
