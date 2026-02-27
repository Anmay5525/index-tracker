import { useEffect, useState } from "react";
import { fetchQuote } from "../services/finance";
import type { Quote } from "../services/finance";
import "../App.css";
import { DEFAULT_INDICES } from "../constants";

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function fetchAll() {
    const symbols = DEFAULT_INDICES.map((w) => w.symbol);
    const results: Record<string, Quote> = {};
    // mark all requested symbols as loading
    setLoading(symbols.reduce((acc, s) => ({ ...acc, [s]: true }), {}));

    // fetch sequentially to avoid burst requests that may trigger rate limits
    for (const s of symbols) {
      try {
        const q = await fetchQuote(s);
        results[s] = q;
      } catch (err) {
        results[s] = {
          symbol: s,
          price: null,
          change: null,
          changePercent: null,
          error: String(err instanceof Error ? err.message : err),
        };
      } finally {
        setLoading((prev) => ({ ...prev, [s]: false }));
      }
    }

    setQuotes((prev) => ({ ...prev, ...results }));
  }

  useEffect(() => {
    // one initial load (no polling)
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // detect whether any symbols are currently loading
  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="dashboard">
      <h1>Index Watch</h1>
      <button type="button" onClick={() => fetchAll()} disabled={anyLoading}>
        {anyLoading ? "Refreshing..." : "Refresh All"}
      </button>

      <div className="card-grid">
        {DEFAULT_INDICES.map((w) => {
          const q = quotes[w.symbol];
          const price = q?.price;
          const allTimeHigh = q?.allTimeHigh;

          const isLoading = !!loading[w.symbol];

          const upside =
            allTimeHigh && price ? ((allTimeHigh - price) / price) * 100 : "-";

          return (
            <div className="index-card" key={w.symbol}>
              <div className="index-header">
                <div className="index-name">{w.name ?? w.symbol}</div>
              </div>
              <div className="index-body">
                {isLoading ? (
                  <div className="index-loading">Loading…</div>
                ) : (
                  <>
                    <div className="index-price">{price ?? "-"}</div>
                    {allTimeHigh && price ? (
                      <div className={`index-change`}>
                        {typeof upside === "number"
                          ? upside.toFixed(2)
                          : upside}{" "}
                        % upside
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <div className="index-actions">
                <button
                  onClick={async () => {
                    setLoading((l) => ({ ...l, [w.symbol]: true }));
                    const qq = await fetchQuote(w.symbol);
                    setQuotes((s) => ({ ...s, [w.symbol]: qq }));
                    setLoading((l) => ({ ...l, [w.symbol]: false }));
                  }}
                  disabled={isLoading}
                >
                  Refresh
                </button>
              </div>
              {q?.error ? <div className="error">{q.error}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
