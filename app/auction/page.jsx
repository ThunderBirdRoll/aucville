"use client";
export const dynamic = "force-dynamic";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import Navbar from "../component/Navbar";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Footer from "../component/Footer";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Real Estate",
  "Vehicles",
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function timeLeft(endTime) {
  const diff = new Date(endTime) - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function Countdown({ endTime }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const t = timeLeft(endTime);
  if (!t) return <span style={{ color: "#EF4444" }}>Ended</span>;
  const urgent = !t.includes("d") && !t.includes("h");
  return <span style={{ color: urgent ? "#F59E0B" : "inherit" }}>{t} left</span>;
}

function AuctionCard({ auction, index }) {
  const displayPrice = auction.finalPrice ?? auction.startingPrice;
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/auction/${auction._id}`)}
      className="ac"
      style={{ animationDelay: `${(index % 12) * 0.04}s` }}
    >
      <div className="ac-img-wrap">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="ac-img"
          onError={e => { e.target.src = "https://placehold.co/480x360/f3f4f6/9ca3af?text=No+Image"; }}
        />
        <span className={`ac-badge ${auction.isLive ? "ac-badge-live" : "ac-badge-ended"}`}>
          {auction.isLive && <span className="ac-dot" />}
          {auction.isLive ? "Live" : "Ended"}
        </span>
        <span className="ac-cat">{auction.category}</span>
      </div>

      <div className="ac-body">
        <p className="ac-title">{auction.title}</p>
        <div className="ac-foot">
          <div>
            <div className="ac-price-lbl">
              {auction.finalPrice ? "Current price" : "Starting at"}
            </div>
            <div className="ac-price">
              <span className="ac-currency">$</span>
              {displayPrice.toLocaleString()}
            </div>
          </div>
          <div className="ac-time">
            {auction.isLive
              ? <Countdown endTime={auction.endTime} />
              : <span style={{ color: "#374151" }}>Auction ended</span>
            }
          </div>
        </div>
        <div className={`ac-btn ${auction.isLive ? "ac-btn-live" : "ac-btn-ended"}`}>
          {auction.isLive ? "View & Bid →" : "View Details →"}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="sk-card">
      <div className="sk sk-img" />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="sk sk-line" style={{ width: "80%" }} />
        <div className="sk sk-line" style={{ width: "50%" }} />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    }
  }
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push("…");
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div className="pg-wrap">
      <button className="pg-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>←</button>
      {withEllipsis.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} className="pg-ellipsis">…</span>
          : <button
              key={p}
              className={`pg-btn ${p === page ? "pg-active" : ""}`}
              onClick={() => onChange(p)}
            >{p}</button>
      )}
      <button className="pg-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>→</button>
    </div>
  );
}

function AuctionsInner() {
  const searchParams = useSearchParams();

  const [search, setSearch]     = useState(searchParams.get("search")   || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All Categories");

  const [page, setPage]             = useState(1);
  const [auctions, setAuctions]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats]           = useState({ liveCount: 0, categoryCount: 0, avgPrice: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [visible, setVisible]       = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const debouncedSearch = useDebounce(search, 320);

  useEffect(() => { setPage(1); }, [debouncedSearch, category]);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category !== "All Categories") params.set("category", category);
      const res = await fetch(`/api/auction/get/?${params}`);
      if (!res.ok) throw new Error("Failed to load auctions");
      const data = await res.json();
      setAuctions(data.auctions || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(data.stats || { liveCount: 0, categoryCount: 0, avgPrice: 0 });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, page]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const live  = auctions.filter(a =>  a.isLive);
  const ended = auctions.filter(a => !a.isLive);

  return (
    <div className="ap-wrap">

      <div className={`anim ${visible ? "go d1" : ""}`}>
        <div className="ap-eyebrow">Marketplace</div>
        <h1 className="ap-h1">Live <b>auctions</b></h1>
        <p className="ap-sub">Browse, bid, and win — in real time.</p>
      </div>

      {/* stats */}
      <div className={`anim ${visible ? "go d2" : ""}`}>
        <div className="stats">
          <div className="stat">
            <div className="stat-icon">🟢</div>
            <div>
              <div className="stat-val">{loading ? "—" : stats.liveCount.toLocaleString()}</div>
              <div className="stat-lbl">Live auctions</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon">🏷️</div>
            <div>
              <div className="stat-val">{loading ? "—" : stats.categoryCount}</div>
              <div className="stat-lbl">Categories</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon">💰</div>
            <div>
              <div className="stat-val">{loading ? "—" : `$${stats.avgPrice.toLocaleString()}`}</div>
              <div className="stat-lbl">Avg price</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`anim ${visible ? "go d3" : ""}`}>
        <div className="fbar">
          <div className="sbox">
            <svg width="15" height="15" fill="none" stroke="#4B5563" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="sinput"
              placeholder="Search auctions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="s-clear" onClick={() => setSearch("")}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="csel-wrap">
            <select className="csel" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span className="csel-arrow">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="err-banner">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={`result-meta anim ${visible ? "go d4" : ""}`}>
          {pagination.total === 0
            ? "No auctions found"
            : `Showing ${((pagination.page - 1) * 12) + 1}–${Math.min(pagination.page * 12, pagination.total)} of ${pagination.total} auction${pagination.total !== 1 ? "s" : ""}`
          }
        </div>
      )}

      {loading && (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && live.length > 0 && (
        <>
          <div className="sec-hdr">
            <span className="sec-title">Live now</span>
            <span className="sec-count">{live.length}</span>
            <div className="sec-line" />
          </div>
          <div className="grid">
            {live.map((a, i) => <AuctionCard key={a._id} auction={a} index={i} />)}
          </div>
        </>
      )}

      {!loading && ended.length > 0 && (
        <>
          <div className="sec-hdr" style={{ marginTop: live.length ? 12 : 0 }}>
            <span className="sec-title">Ended</span>
            <span className="sec-count">{ended.length}</span>
            <div className="sec-line" />
          </div>
          <div className="grid">
            {ended.map((a, i) => <AuctionCard key={a._id} auction={a} index={i} />)}
          </div>
        </>
      )}

      {!loading && !error && auctions.length === 0 && (
        <div className="empty">
          <svg width="44" height="44" fill="none" stroke="#374151" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
          </svg>
          <div className="empty-title">No auctions found</div>
          <div className="empty-sub">Try a different search or category</div>
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      )}
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }

        .ap {
          min-height: 100vh;
          background: #fff;
          font-family: 'DM Sans','Helvetica Neue',sans-serif;
          font-weight: 300;
          position: relative;
          overflow-x: hidden;
        }

        .ap-bg { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .ap-bg-g {
          position:absolute; top:-10%; right:-8%; width:55%; height:120%;
          background: radial-gradient(ellipse at 80% 50%,
            rgba(82,183,136,0.13) 0%, rgba(216,240,230,0.09) 40%,
            rgba(242,250,246,0.05) 65%, transparent 82%);
        }

        @keyframes barShimmer {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        .accent-bar {
          height:3px;
          background:linear-gradient(90deg,#1B3A2D 0%,#52B788 55%,#a7f3d0 100%);
          background-size:200% 100%;
          animation:barShimmer 5s ease infinite;
          position:relative; z-index:2;
        }

        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .anim { opacity:0; }
        .anim.go { animation:slideUp .5s cubic-bezier(.22,.68,0,1.15) forwards; }
        .anim.go.d1 { animation-delay:.05s; }
        .anim.go.d2 { animation-delay:.14s; }
        .anim.go.d3 { animation-delay:.23s; }
        .anim.go.d4 { animation-delay:.32s; }

        @keyframes fadeInRight {
          from { opacity:0; transform:translateX(32px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .ap-wrap {
          position:relative; z-index:1;
          max-width:1200px; margin:0 auto;
          padding:clamp(28px,5vw,52px) clamp(16px,4vw,40px) 72px;
        }

        .ap-eyebrow {
          font-size:12px; font-weight:600; color:#111111;
          letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;
        }
        .ap-h1 {
          font-size:clamp(30px,4vw,48px); font-weight:500; color:#111111;
          letter-spacing:-1px; line-height:1.1; margin-bottom:8px;
        }
        .ap-h1 b { font-weight:700; color:#2D6A4F; }
        .ap-sub { font-size:15px; color:#1F2937; font-weight:400; margin-bottom:32px; }

        /* ── Stats: desktop ── */
        .stats {
          display:flex;
          gap:12px;
          margin-bottom:24px;
        }
        .stat {
          flex:1;
          display:flex;
          align-items:center;
          gap:12px;
          background:rgba(255,255,255,0.9);
          border:0.5px solid #E5E7EB;
          border-radius:14px;
          padding:16px 18px;
          backdrop-filter:blur(8px);
        }
        .stat-icon { font-size:20px; line-height:1; flex-shrink:0; }
        .stat-val  { font-size:clamp(17px,2vw,22px); font-weight:300; color:#1B3A2D; letter-spacing:-0.3px; line-height:1.1; }
        .stat-lbl  { font-size:10px; color:#6B7280; margin-top:3px; letter-spacing:0.3px; text-transform:uppercase; }

        .fbar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; align-items:center; }

        .sbox {
          flex:1; min-width:180px;
          display:flex; align-items:center; gap:9px;
          border:1px solid #E5E7EB; border-radius:11px;
          padding:0 14px; background:rgba(255,255,255,0.86);
          backdrop-filter:blur(8px);
          transition:border-color .2s, box-shadow .2s;
        }
        .sbox:focus-within { border-color:#52B788; box-shadow:0 0 0 3px rgba(82,183,136,0.10); background:#fff; }
        .sinput {
          flex:1; border:none; outline:none;
          font-size:14px; color:#1B3A2D; background:transparent;
          padding:12px 0; font-family:inherit; font-weight:300;
        }
        .sinput::placeholder { color:#4B5563; }
        .s-clear { background:none; border:none; cursor:pointer; color:#374151; display:flex; padding:0; }

        .csel-wrap { position:relative; flex-shrink:0; }
        .csel {
          appearance:none;
          border:1px solid #E5E7EB; border-radius:11px;
          padding:12px 36px 12px 14px;
          font-size:13.5px; font-family:inherit; font-weight:300;
          color:#1B3A2D; background:rgba(255,255,255,0.86);
          outline:none; cursor:pointer;
          transition:border-color .2s, box-shadow .2s;
          backdrop-filter:blur(8px);
        }
        .csel:focus { border-color:#52B788; box-shadow:0 0 0 3px rgba(82,183,136,0.10); }
        .csel-arrow { position:absolute; right:11px; top:50%; transform:translateY(-50%); pointer-events:none; color:#374151; }

        .result-meta { font-size:12px; color:#374151; font-weight:300; margin-bottom:20px; }

        .sec-hdr { display:flex; align-items:center; gap:10px; margin-bottom:14px; margin-top:4px; }
        .sec-title { font-size:11px; font-weight:500; color:#374151; letter-spacing:0.8px; text-transform:uppercase; }
        .sec-count { font-size:10.5px; color:#374151; background:#F3F4F6; border-radius:20px; padding:2px 8px; }
        .sec-line { flex:1; height:0.5px; background:#E5E7EB; }

        .grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(260px,1fr));
          gap:16px;
          margin-bottom:32px;
        }

        .ac {
          display:block; text-decoration:none;
          background:rgba(255,255,255,0.92);
          border:0.5px solid #E5E7EB; border-radius:16px;
          overflow:hidden; cursor:pointer;
          transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          backdrop-filter:blur(6px);
          animation:fadeInRight .45s cubic-bezier(.22,.68,0,1.15) forwards;
          opacity:0;
        }
        .ac:hover {
          transform:translateY(-4px);
          box-shadow:0 10px 32px rgba(27,58,45,0.10);
          border-color:#C6E8D8;
        }

        .ac-img-wrap { position:relative; aspect-ratio:4/3; overflow:hidden; background:#F9FAFB; }
        .ac-img { width:100%; height:100%; object-fit:cover; transition:transform .3s ease; display:block; }
        .ac:hover .ac-img { transform:scale(1.05); }

        .ac-badge {
          position:absolute; top:10px; left:10px;
          display:flex; align-items:center; gap:5px;
          border-radius:20px; padding:3px 9px;
          font-size:10.5px; font-weight:400;
          backdrop-filter:blur(10px); letter-spacing:0.2px;
        }
        .ac-badge-live  { background:rgba(27,58,45,0.84); color:#D8F0E6; border:0.5px solid rgba(82,183,136,0.4); }
        .ac-badge-ended { background:rgba(243,244,246,0.92); color:#6B7280; border:0.5px solid #E5E7EB; }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.35;transform:scale(0.75);} }
        .ac-dot { width:5px; height:5px; border-radius:50%; background:#52B788; animation:pulse 1.6s ease-in-out infinite; }

        .ac-cat {
          position:absolute; top:10px; right:10px;
          background:rgba(255,255,255,0.9); border:0.5px solid #E5E7EB;
          border-radius:20px; padding:3px 9px;
          font-size:10px; color:#111827; font-weight:500;
          backdrop-filter:blur(8px);
        }

        .ac-body { padding:14px 16px 16px; }
        .ac-title {
          font-size:18px; font-weight:500; color:#111111;
          line-height:1.4; margin-bottom:12px;
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .ac-foot { display:flex; justify-content:space-between; align-items:flex-end; }
        .ac-price-lbl { font-size:10px; color:#374151; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px; }
        .ac-price { font-size:18px; font-weight:300; color:#1B3A2D; letter-spacing:-0.2px; }
        .ac-currency { font-size:12px; color:#52B788; }
        .ac-time { font-size:11.5px; color:#1F2937; font-weight:400; text-align:right; line-height:1.5; }

        .ac-btn {
          display:block; width:100%; margin-top:12px;
          padding:9px 14px; border-radius:10px; border:none;
          font-size:12.5px; font-weight:400; font-family:inherit;
          cursor:pointer; text-align:center; letter-spacing:0.2px;
          transition:background .15s, transform .1s;
        }
        .ac-btn-live { background:#1B3A2D; color:#D8F0E6; }
        .ac-btn-live:hover { background:#2D6A4F; transform:translateY(-1px); }
        .ac-btn-ended { background:#E5E7EB; color:#111827; border:0.5px solid #D1D5DB; }

        @keyframes shimmer { 0%{background-position:-600px 0;} 100%{background-position:600px 0;} }
        .sk { background:linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%); background-size:600px 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        .sk-card { border:0.5px solid #E5E7EB; border-radius:16px; overflow:hidden; }
        .sk-img  { height:195px; border-radius:0; }
        .sk-line { height:12px; }

        .err-banner {
          display:flex; align-items:center; gap:10px;
          background:#FEF2F2; border:0.5px solid #FECACA;
          border-radius:12px; padding:14px 18px;
          font-size:13px; color:#B91C1C; margin-bottom:24px;
        }

        .empty { text-align:center; padding:64px 24px; color:#374151; }
        .empty svg { opacity:0.3; margin-bottom:14px; }
        .empty-title { font-size:15px; color:#374151; margin-bottom:4px; }
        .empty-sub   { font-size:12.5px; }

        .pg-wrap { display:flex; justify-content:center; align-items:center; gap:6px; padding-top:8px; flex-wrap:wrap; }
        .pg-btn {
          min-width:36px; height:36px; padding:0 10px;
          border:1px solid #E5E7EB; border-radius:9px;
          background:rgba(255,255,255,0.85); color:#374151;
          font-size:13px; font-family:inherit; font-weight:300;
          cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center;
        }
        .pg-btn:hover:not(:disabled) { border-color:#52B788; color:#1B3A2D; background:#fff; }
        .pg-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .pg-active { background:#1B3A2D !important; color:#D8F0E6 !important; border-color:#1B3A2D !important; font-weight:400; }
        .pg-ellipsis { font-size:13px; color:#374151; padding:0 4px; }

        /* ── Mobile ── */
        @media (max-width:640px) {
          /* stats: 3 compact pill cards in a row */
          .stats {
            gap:8px;
            margin-bottom:18px;
          }
          .stat {
            flex-direction:column;
            align-items:flex-start;
            gap:4px;
            padding:12px 12px;
            border-radius:12px;
          }
          .stat-icon { font-size:16px; }
          .stat-val  { font-size:16px; }
          .stat-lbl  { font-size:8.5px; }

          .fbar  { flex-direction:column; }
          .sbox, .csel { width:100%; }
          .grid  { grid-template-columns:repeat(2, 1fr); gap:10px; }
          .ac-title  { font-size:13px; margin-bottom:8px; }
          .ac-price  { font-size:15px; }
          .ac-btn    { font-size:11px; padding:8px 10px; }
          .ac-body   { padding:10px 12px 12px; }
          .ac-cat    { font-size:9px; padding:2px 7px; }
          .ac-badge  { font-size:9.5px; padding:2px 7px; }
        }

        @media (prefers-reduced-motion:reduce) {
          .anim,.ac { opacity:1; animation:none !important; }
          .accent-bar,.ac-dot { animation:none; }
        }
      `}</style>

      <div className="ap">
        <Navbar />
        <div className="ap-bg"><div className="ap-bg-g" /></div>
        <div className="accent-bar" />
        <Suspense
          fallback={
            <div className="ap-wrap">
              <div className="grid" style={{ marginTop: 48 }}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          }
        >
          <AuctionsInner />
        </Suspense>
      </div>

      <Footer />
    </>
  );
}