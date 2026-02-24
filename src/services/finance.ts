export type Quote = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency?: string;
  name?: string;
  timestamp?: number;
  error?: string;
  fiftyTwoWeekHigh?: number;
};

// Add delay between requests to avoid rate limiting
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  // In development: use Vite proxy at /api
  // In production: use Netlify function at /.netlify/functions/quote
  const isDev = import.meta.env.DEV;
  const url = isDev
    ? `/api/v8/finance/chart/${encodeURIComponent(symbol)}`
    : `/.netlify/functions/quote?symbol=${encodeURIComponent(symbol)}`;

  try {
    // Add a small delay to avoid burst requests
    await delay(100);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No result");
    const meta = result.meta || {};
    const price =
      typeof meta.regularMarketPrice === "number"
        ? meta.regularMarketPrice
        : null;
    const change =
      typeof meta.regularMarketChange === "number"
        ? meta.regularMarketChange
        : null;
    const changePercent =
      typeof meta.regularMarketChangePercent === "number"
        ? meta.regularMarketChangePercent
        : null;

    const fiftyTwoWeekHigh =
      typeof meta.fiftyTwoWeekHigh === "number" ? meta.fiftyTwoWeekHigh : null;

    return {
      symbol,
      price,
      change,
      changePercent,
      currency: meta.currency,
      name: meta.symbol || meta.shortName || undefined,
      timestamp: meta.regularMarketTime,
      fiftyTwoWeekHigh: fiftyTwoWeekHigh,
    };
  } catch (err: unknown) {
    return {
      symbol,
      price: null,
      change: null,
      changePercent: null,
      error: String(err?.message || err),
    };
  }
}
