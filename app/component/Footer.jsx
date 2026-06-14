"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const BROWSE_ITEMS = [
  { label: "All auctions",    href: "/auction" },
  { label: "Create auction",  href: "/create-auction" },
];

const ACCOUNT_ITEMS = [
  { label: "My auctions", href: "/my-auction" },
  { label: "Orders",      href: "/orders" },
  { label: "Shipping address", href: "/address" },
];

export default function Footer() {
  const router = useRouter();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .ft {
          background: #FAFBFA;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          position: relative;
          border-top: 0.5px solid #E5E7EB;
        }

        .ft-accent {
          height: 3px;
          background: linear-gradient(90deg, #0f4527 0%, #1a7a48 50%, #52B788 100%);
          background-size: 200% 100%;
          animation: barShimmer 5s ease infinite;
          width: 100%;
        }

        .ft-wrap {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(32px,5vw,52px) clamp(18px,5vw,48px) clamp(20px,4vw,32px);
        }

        .anim { opacity: 0; }
        .anim.go { animation: slideUp .55s cubic-bezier(.22,.68,0,1.2) forwards; }
        .anim.go.d1 { animation-delay: .05s; }
        .anim.go.d2 { animation-delay: .12s; }
        .anim.go.d3 { animation-delay: .19s; }

        .ft-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 36px;
          padding-bottom: clamp(24px,4vw,36px);
        }

        .ft-logo {
          font-size: clamp(20px,2.5vw,26px); font-weight: 700;
          color: #0a1f14; letter-spacing: -0.5px; cursor: pointer;
          margin-bottom: 10px;
        }
        .ft-logo span { color: #1a7a48; }
        .ft-tagline {
          font-size: 13px; color: #4d7060; font-weight: 400; line-height: 1.7;
          max-width: 280px; margin-bottom: 16px;
        }
        .ft-live-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #ffffff;
          border: 0.5px solid rgba(26,122,72,0.28);
          border-radius: 20px; padding: 5px 14px;
          font-size: 11.5px; color: #0f4527; font-weight: 500;
        }
        .ft-live-dot {
          width: 6px; height: 6px; background: #1a7a48;
          border-radius: 50%; flex-shrink: 0;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .ft-col-title {
          font-size: 11px; font-weight: 600; color: #145c35;
          text-transform: uppercase; letter-spacing: 1.4px; margin-bottom: 16px;
        }
        .ft-links { display: flex; flex-direction: column; gap: 12px; }
        .ft-link {
          font-size: 13.5px; font-weight: 400; color: #3d5246;
          cursor: pointer; transition: color .15s;
          background: none; border: none; padding: 0;
          font-family: inherit; text-align: left;
          display: flex; align-items: center; gap: 6px;
        }
        .ft-link:hover { color: #0f4527; }
        .ft-link-arrow {
          opacity: 0; transition: opacity .15s, transform .15s;
          transform: translateX(-3px);
          font-size: 12px;
        }
        .ft-link:hover .ft-link-arrow { opacity: 1; transform: translateX(0); }

        .ft-help-card {
          background: #ffffff;
          border: 0.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
        }
        .ft-help-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 4px; }
        .ft-help-text { font-size: 12px; color: #6B7280; line-height: 1.6; margin-bottom: 12px; }
        .ft-help-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #1B3A2D; color: #fff; border: none;
          border-radius: 9px; padding: 8px 14px;
          font-size: 12.5px; font-weight: 400; cursor: pointer;
          font-family: inherit; transition: background .15s;
        }
        .ft-help-btn:hover { background: #2D6A4F; }

        .ft-hr { height: 0.5px; background: #E5E7EB; }

        .ft-bottom {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap;
          padding-top: 20px;
        }
        .ft-copy { font-size: 12px; color: #9CA3AF; font-weight: 400; }
        .ft-copy strong { color: #3d5246; font-weight: 600; }

        .ft-socials { display: flex; gap: 8px; }
        .ft-social-btn {
          width: 32px; height: 32px;
          border: 0.5px solid #E5E7EB; border-radius: 9px;
          background: #ffffff; color: #6B7280;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: border-color .15s, color .15s, background .15s;
        }
        .ft-social-btn:hover {
          border-color: #52B788; color: #1B3A2D;
          background: rgba(82,183,136,0.06);
        }

        @media (max-width: 720px) {
          .ft-grid { grid-template-columns: 1fr 1fr; gap: 28px 20px; }
          .ft-grid > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .ft-grid { grid-template-columns: 1fr; }
          .ft-bottom { flex-direction: column; align-items: flex-start; gap: 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim { opacity: 1; animation: none !important; }
          .ft-accent, .ft-live-dot { animation: none; }
        }
      `}</style>

      <footer className="ft" ref={ref}>
        <div className="ft-accent" />

        <div className="ft-wrap">
          <div className="ft-grid">

            {/* Brand */}
            <div className={`anim ${visible ? "go d1" : ""}`}>
              <div className="ft-logo" onClick={() => router.push("/")}>
                <span>Aucville</span>
              </div>
              <div className="ft-tagline">
                Real-time bidding on thousands of items. Verified sellers. Every purchase protected.
              </div>
              <div className="ft-live-badge">
                <span className="ft-live-dot" />
                Platform live
              </div>
            </div>

            {/* Browse */}
            <div className={`anim ${visible ? "go d2" : ""}`}>
              <div className="ft-col-title">Browse</div>
              <div className="ft-links">
                {BROWSE_ITEMS.map(({ label, href }) => (
                  <button key={label} className="ft-link" onClick={() => router.push(href)}>
                    {label}
                    <span className="ft-link-arrow">→</span>
                  </button>
                ))}
              </div>
              <div className="ft-col-title" style={{ marginTop: 24 }}>Account</div>
              <div className="ft-links">
                {ACCOUNT_ITEMS.map(({ label, href }) => (
                  <button key={label} className="ft-link" onClick={() => router.push(href)}>
                    {label}
                    <span className="ft-link-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Help card */}
            <div className={`anim ${visible ? "go d3" : ""}`}>
              <div className="ft-col-title">Need help?</div>
              <div className="ft-help-card">
                <div className="ft-help-title">Questions about an order?</div>
                <div className="ft-help-text">
                  Our team can help with shipping, bidding, or account issues.
                </div>
                <button className="ft-help-btn" onClick={() => router.push("/orders")}>
                  View my orders
                </button>
              </div>
            </div>

          </div>

          <div className="ft-hr" />

          <div className={`ft-bottom anim ${visible ? "go d3" : ""}`}>
            <div className="ft-copy">
              © {new Date().getFullYear()} <strong>Aucville</strong>. All rights reserved.
            </div>

            <div className="ft-socials">
              <button className="ft-social-btn" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button className="ft-social-btn" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </button>
              <button className="ft-social-btn" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}