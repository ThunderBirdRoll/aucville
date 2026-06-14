"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { label: "Electronics", placeholder: "Search phones, laptops, cameras…" },
  { label: "Fashion", placeholder: "Search clothes, shoes, watches…" },
  { label: "Home Living", placeholder: "Search furniture, décor, appliances…" },
  { label: "Real Estate", placeholder: "Search plots, houses, apartments…" },
];

const STATS = [
  { value: "12,400+", label: "Live auctions" },
  { value: "99.9%", label: "On-time delivery" },
  { value: "100%", label: "Verified Seller" },
];

export default function Hero() {
  const [catIndex, setCatIndex] = useState(0);
  const [displayPlaceholder, setDisplayPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const typeRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  function handleSearch() {
    if (!query.trim()) { router.push("/auction"); return; }
    const params = new URLSearchParams();
    params.set("search", query.trim());
    if (catIndex > 0) params.set("category", CATEGORIES[catIndex].label);
    router.push(`/auction?${params}`);
  }

  useEffect(() => {
    const target = CATEGORIES[catIndex].placeholder;
    let timeout;
    if (!isDeleting && displayPlaceholder.length < target.length) {
      timeout = setTimeout(() => setDisplayPlaceholder(target.slice(0, displayPlaceholder.length + 1)), 38);
    } else if (!isDeleting && displayPlaceholder.length === target.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayPlaceholder.length > 0) {
      timeout = setTimeout(() => setDisplayPlaceholder(displayPlaceholder.slice(0, -1)), 18);
    } else {
      setIsDeleting(false);
      setCatIndex((i) => (i + 1) % CATEGORIES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayPlaceholder, isDeleting, catIndex]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes greenDrift {
          0%   { transform: translateY(0px) scale(1); }
          50%  { transform: translateY(-28px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes barShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero {
          min-height: 65vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

        .hero-bg-green {
          position: absolute;
          top: -30%; right: -20%;
          width: 90%; height: 130%;
          background: radial-gradient(
            ellipse at 85% 20%,
            rgba(52, 150, 100, 0.26) 0%,
            rgba(82, 183, 136, 0.14) 30%,
            rgba(187, 237, 212, 0.07) 55%,
            transparent 72%
          );
          animation: greenDrift 10s ease-in-out infinite;
          will-change: transform;
        }

        .hero-bg-secondary {
          position: absolute;
          bottom: -20%; left: -10%;
          width: 55%; height: 90%;
          background: radial-gradient(
            ellipse at 15% 85%,
            rgba(27, 90, 60, 0.09) 0%,
            rgba(82, 183, 136, 0.04) 45%,
            transparent 70%
          );
          animation: greenDrift 14s ease-in-out infinite reverse;
          will-change: transform;
        }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #0f4527 0%, #1a7a48 50%, #52B788 100%);
          background-size: 200% 100%;
          animation: barShimmer 5s ease infinite;
          width: 100%; flex-shrink: 0;
          position: relative; z-index: 2;
        }

        .hero-inner {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          max-width: 1100px; width: 100%; margin: 0 auto;
          padding: clamp(24px, 5vw, 56px) clamp(18px, 5vw, 48px) clamp(20px, 4vw, 40px);
          position: relative; z-index: 1;
        }

        .anim { opacity: 0; }
        .anim.go { animation: slideUp .55s cubic-bezier(.22,.68,0,1.2) forwards; }
        .anim.go.d1 { animation-delay: .05s; }
        .anim.go.d2 { animation-delay: .15s; }
        .anim.go.d3 { animation-delay: .25s; }
        .anim.go.d4 { animation-delay: .38s; }

        .live-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(26,122,72,0.28);
          border-radius: 20px; padding: 5px 14px;
          margin-bottom: 18px; width: fit-content;
          backdrop-filter: blur(8px);
        }
        .live-dot {
          width: 7px; height: 7px;
          background: #1a7a48; border-radius: 50%; flex-shrink: 0;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .live-text { font-size: 12px; color: #0f4527; font-weight: 500; letter-spacing: 0.2px; }

        h1.hero-h1 {
          font-size: clamp(32px, 5.2vw, 66px);
          font-weight: 700; color: #0a1f14;
          line-height: 1.08;
          letter-spacing: clamp(-0.5px, -0.08vw, -1.5px);
          margin-bottom: 14px;
        }
        .accent-green { color: #1a7a48; font-weight: 700; }

        .subtext {
          font-size: clamp(13px, 1.6vw, 15px);
          color: #3d5246; max-width: 420px;
          line-height: 1.75; margin-bottom: 28px;
          font-weight: 400; letter-spacing: 0.1px;
        }

        .cat-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .cat-tab {
          padding: 5px 15px; border-radius: 20px;
          font-size: 12px; cursor: pointer;
          transition: all .16s ease;
          font-family: inherit; font-weight: 400; letter-spacing: 0.1px;
        }
        .cat-tab.active {
          border: 1.5px solid #145c35;
          background: #145c35; color: #d0f0e0; font-weight: 600;
        }
        .cat-tab.inactive {
          border: 1.5px solid #D1D5DB;
          background: rgba(255,255,255,0.75); color: #6B7280;
        }
        .cat-tab.inactive:hover {
          border-color: #1a7a48; color: #0f4527;
          background: rgba(255,255,255,0.95);
        }

        .search-row { display: flex; gap: 10px; max-width: 580px; }

        .search-box {
          flex: 1; display: flex; align-items: center;
          border: 1.5px solid #b5d4c3;
          border-radius: 12px; padding: 0 16px;
          background: #ffffff;
          gap: 10px; min-width: 0;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .search-box:focus-within {
          border-color: #1a7a48;
          box-shadow: 0 0 0 3px rgba(26,122,72,0.12);
        }
        .search-input {
          flex: 1; border: none; outline: none;
          font-size: 14px; color: #0a1f14;
          background: transparent; padding: 14px 0;
          font-family: inherit; font-weight: 400; min-width: 0;
        }
        .search-input::placeholder { color: #8fada0; }

        .search-btn {
          background: #145c35; color: #fff;
          border: none; border-radius: 11px;
          padding: 0 26px; font-size: 14px;
          font-weight: 600; letter-spacing: 0.2px;
          cursor: pointer; font-family: inherit;
          transition: background .15s ease, transform .1s ease;
          white-space: nowrap; height: 50px; flex-shrink: 0;
        }
        .search-btn:hover  { background: #0f4527; }
        .search-btn:active { transform: scale(0.97); }

        .trending {
          display: flex; gap: 7px; margin-top: 11px;
          flex-wrap: wrap; align-items: center;
        }
        .trending-label { font-size: 11px; color: #8fada0; font-weight: 500; }
        .trend-tag {
          font-size: 11px; color: #3d5246;
          background: rgba(255,255,255,0.7);
          border: 1px solid #c8ddd5;
          border-radius: 20px; padding: 3px 10px;
          cursor: pointer; font-weight: 400;
          transition: background .14s, border-color .14s, color .14s;
        }
        .trend-tag:hover { background: #fff; border-color: #1a7a48; color: #0f4527; }

        .stats-wrap {
          margin-top: 30px;
          border-top: 1px solid rgba(181,212,195,0.6);
          padding-top: 2px;
        }
        .stats-row {
          display: flex; overflow-x: auto;
          scrollbar-width: none; -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .stats-row::-webkit-scrollbar { display: none; }
        .stat-cell {
          flex: 1 0 auto; padding: 16px 18px 13px;
          border-right: 1px solid rgba(181,212,195,0.6);
          white-space: nowrap;
        }
        .stat-cell:first-child { padding-left: 0; }
        .stat-cell:last-child  { border-right: none; }
        .stat-value {
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 700; color: #0a1f14;
          letter-spacing: -0.4px; line-height: 1.2;
        }
        .stat-label {
          font-size: 10.5px; color: #4d7060;
          margin-top: 3px; font-weight: 400; letter-spacing: 0.1px;
        }

        @media (max-width: 640px) {
          .hero { min-height: 60vh; }
          .hero-bg-green { width: 110%; top: 20%; height: 90%; right: -25%; }
          .stat-cell { padding: 12px 14px 10px; }
          .search-btn { height: 48px; }
        }
        @media (max-width: 400px) {
          .stat-cell { padding: 10px 12px 8px; }
          .stat-value { font-size: 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-bg-green, .hero-bg-secondary, .accent-bar { animation: none; }
          .live-dot { animation: none; }
          .anim { opacity: 1; animation: none !important; }
        }
      `}</style>

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-bg-green" />
          <div className="hero-bg-secondary" />
        </div>

        <div className="accent-bar" />

        <div className="hero-inner">

          <div className={`live-badge anim ${visible ? "go d1" : ""}`}>
            <span className="live-dot" />
            <span className="live-text">2,400 live auctions right now</span>
          </div>

          <h1 className={`hero-h1 anim ${visible ? "go d2" : ""}`}>
            Bid smarter.<br />
            <span className="accent-green">Pay less. Win more.</span>
          </h1>

          <p className={`subtext anim ${visible ? "go d2" : ""}`} style={{ animationDelay: ".2s" }}>
            Real-time bidding on thousands of items.
            Verified sellers. Every purchase protected.
          </p>

          <div className={`anim ${visible ? "go d3" : ""}`}>
            <div className="cat-tabs">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.label}
                  className={`cat-tab ${i === catIndex ? "active" : "inactive"}`}
                  onClick={() => { setCatIndex(i); setDisplayPlaceholder(""); setIsDeleting(false); }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="search-row">
              <div className="search-box">
                <svg width="16" height="16" fill="none" stroke="#7aab92" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={typeRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={displayPlaceholder}
                  className="search-input"
                />
              </div>
              <button className="search-btn" onClick={handleSearch}>Search</button>
            </div>

            <div className="trending">
              <span className="trending-label">Trending:</span>
              {["Rolex", "iPhone 15", "Honda Civic", "Sectional sofa"].map((tag) => (
                <span key={tag} className="trend-tag" onClick={() => {
                  setQuery(tag);
                  router.push(`/auction?search=${encodeURIComponent(tag)}`);
                }}>{tag}</span>
              ))}
            </div>
          </div>

          <div className={`stats-wrap anim ${visible ? "go d4" : ""}`}>
            <div className="stats-row">
              {STATS.map((s) => (
                <div key={s.label} className="stat-cell">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}