"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const PLACEHOLDERS = [
  "Search phones, laptops, cameras…",
  "Search clothes, shoes, watches…",
  "Search furniture, décor, appliances…",
  "Search plots, houses, apartments…",
];

// ── Card stack data ──
const LOTS = [
  { lotNo: "0148", item: "Vintage Leica M6, Black Paint", bid: "$2,140", bidders: "14", closes: "06:12 am", stub: "4471-A" },
  { lotNo: "0149", item: "Mid-Century Walnut Sideboard", bid: "$980", bidders: "9", closes: "11:47 pm", stub: "4471-B" },
  { lotNo: "0150", item: "Rolex Datejust, Steel & Gold", bid: "$6,400", bidders: "27", closes: "02:35 pm", stub: "4471-C" },
  { lotNo: "0151", item: "1967 Gibson SG Standard", bid: "$3,250", bidders: "18", closes: "19:02 am", stub: "4471-D" },
];

// fixed alternating tilt per stack position — hand-dealt look, not random-per-render
const TILTS = [-3.5, 4, -5.5, 3];

// ── Desktop: fanned ticket stack, advances on click OR scroll ──
function TicketStack({ lots }) {
  const [cards, setCards] = useState(lots);
  const wrapRef = useRef(null);
  const lastScrollY = useRef(0);
  const cooldown = useRef(false);

  const advance = useCallback(() => {
    if (cooldown.current) return;
    cooldown.current = true;
    setCards((prev) => {
      const next = [...prev];
      next.unshift(next.pop());
      return next;
    });
    setTimeout(() => { cooldown.current = false; }, 550);
  }, []);

  // scroll-triggered advance — only while the stack is in/near viewport
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    function handleScroll() {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      const currentY = window.scrollY;
      if (inView && Math.abs(currentY - lastScrollY.current) > 70) {
        advance();
        lastScrollY.current = currentY;
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [advance]);

  return (
    <div className="ticket-stack" ref={wrapRef} onClick={advance} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && advance()}
      aria-label="Show next auction lot">
      {cards.map((lot, index) => {
        const tilt = TILTS[index % TILTS.length];
        return (
          <motion.div
            key={lot.lotNo}
            className="ticket"
            initial={false}
            animate={{
              top: index * -14,
              left: index * (index % 2 === 0 ? 0 : 0),
              x: index * (index % 2 === 0 ? 6 : -6),
              rotate: index === 0 ? 0 : tilt,
              scale: 1 - index * 0.055,
              opacity: index < 4 ? 1 - index * 0.16 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.05] }}
            style={{ zIndex: cards.length - index }}
          >
            <div className="ticket-discount">20% <span>off</span> buyer's premium</div>

            <div className="ticket-top">
              <div>
                <div className="ticket-label">Lot</div>
                <div className="ticket-lotnum">{lot.lotNo}</div>
              </div>
              <span className="ticket-badge"><span className="live-dot" />Live</span>
            </div>

            <div className="ticket-mid">
              <div className="ticket-item-label">Now bidding</div>
              <div className="ticket-item-name">{lot.item}</div>

              <div className="ticket-stats">
                <div>
                  <div className="ticket-stat-label">Current bid</div>
                  <div className="ticket-stat-val green">{lot.bid}</div>
                </div>
                <div>
                  <div className="ticket-stat-label">Bidders</div>
                  <div className="ticket-stat-val">{lot.bidders}</div>
                </div>
                <div>
                  <div className="ticket-stat-label">Closes</div>
                  <div className="ticket-stat-val">{lot.closes}</div>
                </div>
              </div>
            </div>

            <div className="ticket-notch-r" />
            <div className="ticket-bottom">
              <span className="ticket-foot-label">Admit one bidder</span>
              <span className="ticket-stub-no">stub · {lot.stub}</span>
            </div>
          </motion.div>
        );
      })}
      <div className="ticket-hint">Click or scroll to browse lots</div>
    </div>
  );
}

// ── Mobile: horizontal marquee of compact live-lot chips — not a shrunk ticket ──
function MobileLotMarquee({ lots }) {
  const doubled = [...lots, ...lots];
  return (
    <div className="lot-marquee">
      <div className="lot-marquee-track">
        {doubled.map((lot, i) => (
          <div className="lot-chip" key={`${lot.lotNo}-${i}`}>
            <span className="lot-chip-dot" />
            <span className="lot-chip-name">{lot.item}</span>
            <span className="lot-chip-bid">{lot.bid}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayPlaceholder, setDisplayPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  function handleSearch() {
    if (!query.trim()) { router.push("/auction"); return; }
    const params = new URLSearchParams();
    params.set("search", query.trim());
    router.push(`/auction?${params}`);
  }

  useEffect(() => {
    const target = PLACEHOLDERS[phraseIndex];
    let timeout;
    if (!isDeleting && displayPlaceholder.length < target.length) {
      timeout = setTimeout(() => setDisplayPlaceholder(target.slice(0, displayPlaceholder.length + 1)), 38);
    } else if (!isDeleting && displayPlaceholder.length === target.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayPlaceholder.length > 0) {
      timeout = setTimeout(() => setDisplayPlaceholder(displayPlaceholder.slice(0, -1)), 18);
    } else {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayPlaceholder, isDeleting, phraseIndex]);

  useEffect(() => {
    function handleMouseMove(e) {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMouse({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
    }
    const el = heroRef.current;
    el?.addEventListener("mousemove", handleMouseMove);
    return () => el?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const gx = 50 + (mouse.x - 0.5) * 30;
  const gy = 50 + (mouse.y - 0.5) * 30;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .hero {
          min-height: 65vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; transition: background 0.4s ease; }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #0f4527 0%, #1a7a48 50%, #52B788 100%);
          background-size: 200% 100%;
          width: 100%; flex-shrink: 0;
          animation: shimmer 6s linear infinite;
          position: relative; z-index: 2;
        }

        .hero-inner {
          flex: 1; display: flex; flex-direction: row; align-items: center; justify-content: space-between;
          max-width: 1280px; width: 100%; margin: 0 auto;
          padding: clamp(32px, 6vw, 64px) clamp(18px, 5vw, 48px);
          position: relative; z-index: 1;
          gap: 40px;
        }

        .hero-content { max-width: 540px; flex-shrink: 0; }

        .lot-eyebrow {
          display: inline-flex; align-items: baseline; gap: 10px;
          margin-bottom: 22px;
        }
        .lot-eyebrow .lot-no {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 13px;
          color: #1a7a48;
        }
        .lot-eyebrow .lot-sep { width: 22px; height: 1px; background: #c8ddd5; }
        .lot-eyebrow .lot-text {
          font-size: 11px; color: #5c6b62; font-weight: 500;
          letter-spacing: 1.4px; text-transform: uppercase;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .live-dot {
          width: 6px; height: 6px;
          background: #1a7a48; border-radius: 50%; flex-shrink: 0;
          animation: pulse 1.5s ease-in-out infinite;
        }

        h1.hero-h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 400;
          color: #0a1f14;
          line-height: 1.12;
          letter-spacing: -0.4px;
          margin-bottom: 20px;
        }
        h1.hero-h1 em {
          font-style: italic;
          font-weight: 400;
          color: #1a7a48;
        }

        .subtext {
          font-size: clamp(13px, 1.6vw, 15px);
          color: #3d5246; max-width: 420px;
          line-height: 1.75; margin-bottom: 28px;
          font-weight: 400; letter-spacing: 0.1px;
        }

        .search-row {
          display: flex; gap: 8px; max-width: 480px;
          padding: 6px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(10,31,20,0.1);
          border-radius: 18px;
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          box-shadow: 0 8px 24px rgba(10,31,20,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
          transition: box-shadow .25s ease, border-color .25s ease;
        }
        .search-row:focus-within {
          border-color: rgba(26,122,72,0.35);
          box-shadow: 0 10px 28px rgba(10,31,20,0.09), 0 0 0 4px rgba(26,122,72,0.08);
        }

        .search-box {
          flex: 1; display: flex; align-items: center;
          border-radius: 12px; padding: 0 14px;
          gap: 10px; min-width: 0;
        }
        .search-input {
          flex: 1; border: none; outline: none;
          font-size: 14px; color: #0a1f14;
          background: transparent; padding: 13px 0;
          font-family: inherit; font-weight: 400; min-width: 0;
        }
        .search-input::placeholder { color: #8fada0; }

        .search-btn {
          background: #145c35; color: #fff;
          border: none; border-radius: 12px;
          padding: 0 24px; font-size: 13.5px;
          font-weight: 600; letter-spacing: 0.2px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background .2s ease, transform .15s ease;
          white-space: nowrap; height: 46px; flex-shrink: 0;
        }
        .search-btn:hover  { background: #0f4527; }
        .search-btn:active { transform: scale(0.97); }

        .trending {
          display: flex; gap: 7px; margin-top: 14px;
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

        /* ════════ Desktop ticket stack ════════ */
        .ticket-stack-outer {
          flex: 1 1 380px;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ticket-stack {
          position: relative;
          width: 100%;
          max-width: 340px;
          height: 300px;
          cursor: pointer;
          user-select: none;
        }
        .ticket-stack:focus-visible { outline: 2px solid #1a7a48; outline-offset: 6px; border-radius: 18px; }

        .ticket {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 300px;
          background: #ffffff;
          border: 1px solid rgba(10,31,20,0.12);
          border-radius: 18px;
          padding: 28px 28px 24px;
          box-shadow: 0 20px 50px rgba(10,31,20,0.1), 0 4px 14px rgba(10,31,20,0.05);
          display: flex;
          flex-direction: column;
        }
        .ticket::before {
          content: '';
          position: absolute; left: -1px; right: -1px; bottom: 80px;
          border-bottom: 1.5px dashed rgba(10,31,20,0.16);
        }
        .ticket::after {
          content: '';
          position: absolute; left: -7px; bottom: 73px;
          width: 14px; height: 14px;
          background: #ffffff;
          border-radius: 50%;
          border: 1px solid rgba(10,31,20,0.12);
        }
        .ticket-notch-r {
          position: absolute; right: -7px; bottom: 73px;
          width: 14px; height: 14px;
          background: #ffffff;
          border-radius: 50%;
          border: 1px solid rgba(10,31,20,0.12);
        }
        .ticket-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .ticket-label { font-size: 10px; color: #8a968d; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 4px; }
        .ticket-lotnum { font-family: 'Fraunces', Georgia, serif; font-size: 24px; color: #0a1f14; font-weight: 400; }
        .ticket-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(26,122,72,0.08); border: 1px solid rgba(26,122,72,0.22); border-radius: 20px; padding: 4px 10px; font-size: 10.5px; color: #1a7a48; font-weight: 600; }
        .ticket-mid { margin-bottom: 20px; }
        .ticket-item-label { font-size: 10px; color: #8a968d; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 6px; }
        .ticket-item-name {
          font-family: 'Fraunces', Georgia, serif; font-size: 18px; color: #0a1f14; font-weight: 500;
          line-height: 1.3; margin-bottom: 12px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ticket-stats { display: flex; gap: 18px; }
        .ticket-stat-label { font-size: 9.5px; color: #8a968d; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .ticket-stat-val { font-family: 'Fraunces', Georgia, serif; font-size: 17px; color: #0a1f14; font-weight: 500; }
        .ticket-stat-val.green { color: #1a7a48; }
        .ticket-bottom { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .ticket-foot-label { font-size: 10px; color: #8a968d; font-weight: 500; }
        .ticket-stub-no { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 11.5px; color: #b5bcb6; }
        .ticket-discount {
          position: absolute; top: -13px; right: 20px;
          background: #0a1f14; color: #ffffff;
          font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600;
          padding: 6px 13px; border-radius: 10px;
          box-shadow: 0 8px 18px rgba(10,31,20,0.22);
          transform: rotate(3deg);
          white-space: nowrap;
        }
        .ticket-discount span { color: #6fcf9d; }

        .ticket-hint {
          margin-top: 14px;
          font-size: 11px; color: #8fada0; font-weight: 400;
          text-align: center; letter-spacing: 0.2px;
        }

        /* ════════ Mobile marquee — distinct signature, not a shrunk ticket ════════ */
        .lot-marquee {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .lot-marquee-track {
          display: flex;
          gap: 10px;
          width: max-content;
          animation: marqueeScroll 26s linear infinite;
          padding: 2px 0;
        }
        .lot-chip {
          display: flex; align-items: center; gap: 8px;
          background: #ffffff;
          border: 1px solid #e3ece7;
          border-radius: 30px;
          padding: 9px 16px 9px 12px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(10,31,20,0.04);
        }
        .lot-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a7a48; flex-shrink: 0; }
        .lot-chip-name { font-size: 12.5px; color: #1f2d24; font-weight: 500; }
        .lot-chip-bid { font-size: 12.5px; color: #1a7a48; font-weight: 600; }

        @media (max-width: 860px) {
          .hero-inner { flex-direction: column; align-items: flex-start; gap: 28px; padding-bottom: 36px; }
          .hero-content { max-width: 100%; }
          .ticket-stack-outer { display: none; }
        }

        @media (max-width: 460px) {
          .search-row { flex-direction: column; border-radius: 16px; gap: 6px; }
          .search-btn { height: 44px; width: 100%; border-radius: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .accent-bar, .live-dot { animation: none; }
          .lot-marquee-track { animation: none; }
        }
      `}</style>

      <section className="hero" ref={heroRef}>
        <div
          className="hero-bg"
          style={{
            background: `radial-gradient(ellipse 60% 70% at ${gx}% ${gy}%, rgba(52,150,100,0.26) 0%, rgba(82,183,136,0.13) 35%, rgba(187,237,212,0.06) 58%, transparent 75%)`,
          }}
        />

        <div className="accent-bar" />

        <div className="hero-inner">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 18 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1.1] }}
          >
            <motion.div
              className="lot-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
             
              <span className="lot-sep" />
              <span className="lot-text"><span className="live-dot" />Auction floor open now</span>
            </motion.div>

            <motion.h1
              className="hero-h1"
              initial={{ opacity: 0, y: 14 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.12 }}
            >
              Bid with confidence,<br />
              <em>win for less.</em>
            </motion.h1>

            <motion.p
              className="subtext"
              initial={{ opacity: 0, y: 14 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.22 }}
            >
              Real-time bidding on thousands of verified listings.
              Every purchase protected, every seller vetted.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.32 }}
            >
              <div className="search-row">
                <div className="search-box">
                  <svg width="16" height="16" fill="none" stroke="#7aab92" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
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

              {/* mobile-only signature element, sits under the search/trending block */}
              <div className="lot-marquee-mobile-wrap" style={{ marginTop: 24 }}>
                <MobileOnly>
                  <MobileLotMarquee lots={LOTS} />
                </MobileOnly>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="ticket-stack-outer"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 0.68, 0, 1.05] }}
          >
            <TicketStack lots={LOTS} />
          </motion.div>
        </div>
      </section>
    </>
  );
}

// renders children only below the desktop breakpoint — avoids SSR/CSS-only hacks for marquee duplication logic
function MobileOnly({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 860);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (!isMobile) return null;
  return children;
}