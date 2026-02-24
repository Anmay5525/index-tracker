import React, { useEffect, useState } from "react";
import { fetchQuote } from "../services/finance";
import type { Quote } from "../services/finance";
import "../App.css";

type Watched = { symbol: string; name?: string };

const DEFAULT_WATCH: Watched[] = [
  { symbol: "^NSEI", name: "Nifty 50" },
  {
    symbol: "NIFTYMIDCAP150.NS",
    name: "Nifty Midcap 150",
  },
  {
    symbol: "NIFTYSMLCAP250.NS",
    name: "Nifty Smallcap 150",
  },
];

export default function Dashboard() {
  const [watched, setWatched] = useState<Watched[]>(DEFAULT_WATCH);

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [symbolInput, setSymbolInput] = useState("");

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

  function addSymbol(e?: React.FormEvent) {
    e?.preventDefault();
    const s = (symbolInput || "").trim();
    if (!s) return;
    if (watched.find((w) => w.symbol.toLowerCase() === s.toLowerCase())) {
      setSymbolInput("");
      return;
    }
    setWatched((p) => [...p, { symbol: s }]);
    setSymbolInput("");
  }

  function removeSymbol(symbol: string) {
    setWatched((p) => p.filter((w) => w.symbol !== symbol));
    setQuotes((q) => {
      const copy = { ...q };
      delete copy[symbol];
      return copy;
    });
  }

  return (
    <div className="dashboard">
      <h1>Index Watch</h1>
      <form onSubmit={addSymbol} className="add-form">
        <input
          placeholder="Add symbol (e.g. ^NSEI, ^BSESN, ^NSEBANK)"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
        />
        <button type="submit">Add</button>
        <button
          type="button"
          onClick={() => fetchAll()}
          style={{ marginLeft: 8 }}
        >
          Refresh All
        </button>
      </form>

      <div className="card-grid">
        {watched.map((w) => {
          const q = quotes[w.symbol];
          const price = q?.price;
          const fiftyTwoWeekHigh = q?.fiftyTwoWeekHigh;

          const upside =
            fiftyTwoWeekHigh && price
              ? ((fiftyTwoWeekHigh - price) / price) * 100
              : "-";

          return (
            <div className="index-card" key={w.symbol}>
              <div className="index-header">
                <div className="index-name">{w.name ?? w.symbol}</div>
                <div className="index-symbol">{w.symbol}</div>
              </div>
              <div className="index-body">
                <div className="index-price">{price}</div>
                {fiftyTwoWeekHigh && price ? (
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
                <button
                  className="danger"
                  onClick={() => removeSymbol(w.symbol)}
                >
                  Remove
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
