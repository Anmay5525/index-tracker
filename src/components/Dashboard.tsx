import React, { useEffect, useState } from "react";
import { fetchQuote } from "../services/finance";
import type { Quote } from "../services/finance";
import "../App.css";
import { DEFAULT_INDICES, type DefaultIndices } from "../constants";

export default function Dashboard() {
  const [watched, setWatched] = useState<DefaultIndices[]>(DEFAULT_INDICES);

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  async function fetchAll() {
    const symbols = watched.map((w) => w.symbol);
    const results: Record<string, Quote> = {};
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
      }
    }
    setQuotes((prev) => ({ ...prev, ...results }));
  }

  useEffect(() => {
    // one initial load (no polling)
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard">
      <h1>Index Watch</h1>
      <button type="button" onClick={() => fetchAll()}>
        Refresh All
      </button>

      <div className="card-grid">
        {watched.map((w) => {
          const q = quotes[w.symbol];
          const price = q?.price;
          const allTimeHigh = q?.allTimeHigh;

          const upside =
            allTimeHigh && price ? ((allTimeHigh - price) / price) * 100 : "-";

          return (
            <div className="index-card" key={w.symbol}>
              <div className="index-header">
                <div className="index-name">{w.name ?? w.symbol}</div>
              </div>
              <div className="index-body">
                <div className="index-price">{price}</div>
                {allTimeHigh && price ? (
                  <div className={`index-change`}>
                    {typeof upside === "number" ? upside.toFixed(2) : upside} %
                    upside
                  </div>
                ) : null}
              </div>
              <div className="index-actions">
                <button
                  onClick={() =>
                    fetchQuote(w.symbol).then((qq) =>
                      setQuotes((s) => ({ ...s, [w.symbol]: qq })),
                    )
                  }
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
