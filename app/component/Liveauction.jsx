"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── Countdown ── */
function timeLeft(endTime) {
  const diff = new Date(endTime) - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function Countdown({ endTime }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const t = timeLeft(endTime);
  if (!t) return <span className="lac-time-urgent">Ended</span>;
  const urgent = !t.includes("d") && !t.includes("h");
  return <span className={urgent ? "lac-time-urgent" : "lac-time"}>⏱ {t}</span>;
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="lac-skeleton">
      <div className="lac-sk-img" />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="lac-sk-line" style={{ width: "70%" }} />
        <div className="lac-sk-line" style={{ width: "40%", height: 9 }} />
        <div className="lac-sk-line" style={{ width: "55%", marginTop: 4 }} />
      </div>
    </div>
  );
}

/* ── Card ── */
function AuctionCard({ auction, index }) {
  const router = useRouter();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displayPrice = auction.finalPrice ?? auction.startingPrice;

  return (
    <div
      ref={ref}
      className={`lac-card ${visible ? "lac-card-visible" : ""}`}
      style={{ transitionDelay: `${(index % 4) * 0.07}s` }}
      onClick={() => router.push(`/auction/${auction._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/auction/${auction._id}`)}
    >
      {/* image */}
      <div className="lac-img-wrap">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="lac-img"
          onError={(e) => {
            e.target.src = "https://placehold.co/480x360/f1f5f9/94a3b8?text=No+Image";
          }}
        />
        {/* live badge */}
        <div className="lac-live-badge">
          <span className="lac-pulse" />
          LIVE
        </div>
      </div>

      {/* body */}
      <div className="lac-body">
        {/* category below image, above title */}
        <span className="lac-cat">{auction.category}</span>

        <p className="lac-title">{auction.title}</p>

        <div className="lac-meta">
          <div>
            <div className="lac-price-lbl">Current Price</div>
            <div className="lac-price">
              <span className="lac-currency">$</span>
              {displayPrice.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="lac-price-lbl">Ends in</div>
            <Countdown endTime={auction.endTime} />
          </div>
        </div>

        <button className="lac-cta-btn">Bid Now →</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LiveAuctionCards — main export
══════════════════════════════════════════ */
export default function LiveAuctionCards() {
  const router = useRouter();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const headerRef = useRef(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  const INITIAL_COUNT = 4;
  const displayed = showAll ? auctions : auctions.slice(0, INITIAL_COUNT);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auction/get/?page=1&limit=20");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const live = (data.auctions || []).filter((a) => a.isLive).slice(0, 20);
        setAuctions(live);
      } catch {
        setError("Could not load live auctions.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .lac-section {
  background: #ffffff;
  padding: clamp(48px, 7vw, 88px) clamp(16px, 5vw, 64px);
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
}

/* animated green gradient orb — top right */
.lac-section::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -100px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(82, 183, 136, 0.18) 0%,
    rgba(187, 247, 208, 0.10) 45%,
    transparent 75%
  );
  animation: lacOrbDrift 9s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
    .accent-green { color: #1a7a48; font-weight: 700; }

/* secondary orb — bottom left */
.lac-section::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(34, 197, 94, 0.10) 0%,
    rgba(187, 247, 208, 0.06) 50%,
    transparent 75%
  );
  animation: lacOrbDrift 12s ease-in-out infinite reverse;
  pointer-events: none;
  z-index: 0;
}

@keyframes lacOrbDrift {
  0%,100% { transform: translateY(0px) scale(1); }
  50%      { transform: translateY(-30px) scale(1.06); }
}

        .lac-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1;}

        /* header */
        .lac-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: clamp(28px, 4vw, 44px);
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .lac-header.lac-hdr-visible { opacity: 1; transform: translateY(0); }

        .lac-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600;
          color: #16a34a; letter-spacing: 1.8px;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .lac-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #16a34a;
          animation: lacPulse 1.6s ease-in-out infinite;
        }
        @keyframes lacPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(0.6); }
        }

        .lac-h2 {
          font-size: clamp(26px, 3.8vw, 46px);
          font-weight: 700; color: #111827;
          line-height: 1.08; letter-spacing: -0.8px;
          margin: 0;
        }
        .lac-h2 em { font-style: normal;  }

        .lac-view-all {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px;
          border: 1.5px solid #D1D5DB; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: #374151; background: #fff;
          cursor: pointer; font-family: inherit;
          transition: border-color .18s, color .18s, background .18s;
          text-decoration: none;
        }
        .lac-view-all:hover {
          border-color: #16a34a; color: #15803d; background: #f0fdf4;
        }

        /* grid — always 4 columns on desktop */
        .lac-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        @media (max-width: 1024px) { .lac-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px)  { .lac-grid { grid-template-columns: 1fr; } }

        /* card */
        .lac-card {
          background: #ffffff;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.4s ease, transform 0.4s ease,
                      box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .lac-card.lac-card-visible { opacity: 1; transform: translateY(0); }
        .lac-card:hover {
          border-color: #86efac;
          box-shadow: 0 4px 20px rgba(22,163,74,0.10);
          transform: translateY(-2px);
        }

        /* image */
        .lac-img-wrap {
          position: relative; aspect-ratio: 4/3; overflow: hidden;
          background: #f1f5f9;
        }
        .lac-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.35s ease;
        }
        .lac-card:hover .lac-img { transform: scale(1.05); }

        /* live badge */
        .lac-live-badge {
          position: absolute; top: 10px; left: 10px;
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff;
          border: 1px solid #86efac;
          border-radius: 20px; padding: 4px 10px;
          font-size: 10px; font-weight: 700;
          color: #15803d; letter-spacing: 1.2px;
        }
        .lac-pulse {
          width: 6px; height: 6px; border-radius: 50%;
          background: #16a34a;
          animation: lacPulse 1.4s ease-in-out infinite;
        }

        /* body */
        .lac-body { padding: 14px 16px 16px; }

        /* category — below image, above title */
        .lac-cat {
          display: inline-block;
          font-size: 10.5px; font-weight: 600;
          color: #16a34a;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 20px;
          padding: 2px 9px;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
          text-transform: capitalize;
        }

        .lac-title {
          font-size: 15px; font-weight: 600; color: #111827;
          line-height: 1.4; margin: 0 0 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lac-meta {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 14px;
          padding-top: 12px;
          border-top: 1px solid #F3F4F6;
        }
        .lac-price-lbl {
          font-size: 10px; color: #9CA3AF;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;
          font-weight: 500;
        }
        .lac-price { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px; }
        .lac-currency { font-size: 13px; font-weight: 500; color: #16a34a; margin-right: 1px; }
        .lac-time { font-size: 12px; font-weight: 500; color: #6B7280; }
        .lac-time-urgent { font-size: 12px; font-weight: 600; color: #f59e0b; }

        .lac-cta-btn {
          display: block; width: 100%;
          padding: 10px 14px; border-radius: 9px; border: none;
          background: #1B3A2D; color: #d1fae5;
          font-size: 13px; font-weight: 600;
          font-family: inherit; letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
        }
        .lac-cta-btn:hover { background: #166534; transform: translateY(-1px); }
        .lac-cta-btn:active { transform: scale(0.98); }

        /* show more */
        .lac-show-more-wrap {
          margin-top: 36px; text-align: center;
        }
        .lac-show-more-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 36px;
          background: #fff;
          border: 1.5px solid #D1D5DB;
          border-radius: 12px;
          font-size: 14px; font-weight: 600; color: #1B3A2D;
          font-family: inherit; cursor: pointer;
          transition: border-color .18s, background .18s, color .18s, transform .12s;
          letter-spacing: 0.1px;
        }
        .lac-show-more-btn:hover {
          border-color: #16a34a; background: #f0fdf4; color: #15803d;
          transform: translateY(-1px);
        }
        .lac-show-more-btn:active { transform: scale(0.98); }
        .lac-count-badge {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #16a34a; border-radius: 20px;
          padding: 1px 8px; font-size: 12px; font-weight: 700;
        }

        /* skeleton */
        @keyframes lacShimmer {
          0%   { background-position: -500px 0; }
          100% { background-position:  500px 0; }
        }
        .lac-skeleton {
          border: 1.5px solid #E5E7EB; border-radius: 14px;
          overflow: hidden; background: #fff;
        }
        .lac-sk-img {
          height: 180px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 500px 100%;
          animation: lacShimmer 1.3s infinite;
        }
        .lac-sk-line {
          height: 12px; border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 500px 100%;
          animation: lacShimmer 1.3s infinite;
        }

        .lac-err   { color: #dc2626; font-size: 14px; padding: 24px 0; text-align: center; }
        .lac-empty { text-align: center; padding: 48px 0; color: #9CA3AF; font-size: 14px; }

        @media (max-width: 640px) {
          .lac-header { flex-direction: column; align-items: flex-start; }
          .lac-view-all { align-self: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lac-card, .lac-header { transition: none !important; opacity: 1 !important; transform: none !important; }
          .lac-pulse, .lac-eyebrow-dot { animation: none; }
        }
      `}</style>

      <section className="lac-section">
        <div className="lac-inner">
          {/* header */}
          <div ref={headerRef} className={`lac-header ${headerVisible ? "lac-hdr-visible" : ""}`}>
            <div>
              <div className="lac-eyebrow">
                <span className="lac-eyebrow-dot" />
                Happening right now
              </div>
              <h2 className="lac-h2">
                Live <em className="accent-green">Auctions</em>
              </h2>
            </div>
            <button className="lac-view-all" onClick={() => router.push("/auction")}>
              Browse all auctions ↗
            </button>
          </div>

          {error && <div className="lac-err">{error}</div>}

          {/* skeletons */}
          {loading && (
            <div className="lac-grid">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          )}

          {/* cards */}
          {!loading && !error && auctions.length > 0 && (
            <>
              <div className="lac-grid">
                {displayed.map((a, i) => (
                  <AuctionCard key={a._id} auction={a} index={i} />
                ))}
              </div>

              {auctions.length > INITIAL_COUNT && (
                <div className="lac-show-more-wrap">
                  <button
                    className="lac-show-more-btn"
                    onClick={() => showAll ? setShowAll(false) : setShowAll(true)}
                  >
                    {showAll ? (
                      <>Show less ↑</>
                    ) : (
                      <>
                        Show all auctions
                        <span className="lac-count-badge">{auctions.length}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && !error && auctions.length === 0 && (
            <div className="lac-empty">No live auctions right now — check back soon.</div>
          )}
        </div>
      </section>
    </>
  );
}