"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const BROWSE_ITEMS = [
  { label: "All auctions",   href: "/auction" },
  { label: "Create auction", href: "/create-auction" },
];

const ACCOUNT_ITEMS = [
  { label: "My auctions",      href: "/my-auction" },
  { label: "Orders",           href: "/orders" },
  { label: "Shipping address", href: "/address" },
];

export default function Footer() {
  const router  = useRouter();
  const ref     = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
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
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(0.75); }
        }
        @keyframes barShimmer {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        @keyframes ftSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .ft {
          background: #fff;
          font-family: 'DM Sans','Helvetica Neue',sans-serif;
          border-top: 0.5px solid #E5E7EB;
          position: relative;
          overflow: hidden;
        }

        /* subtle bg texture */
        .ft::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 90% 0%,
            rgba(82,183,136,0.07) 0%,
            transparent 60%);
          pointer-events: none;
        }

        .ft-accent {
          height: 2.5px;
          background: linear-gradient(90deg, #1B3A2D 0%, #52B788 55%, #a7f3d0 100%);
          background-size: 200% 100%;
          animation: barShimmer 5s ease infinite;
        }

        .ft-wrap {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(36px,5vw,56px) clamp(18px,5vw,48px) clamp(22px,4vw,34px);
          position: relative; z-index: 1;
        }

        /* ── animation ── */
        .ft-anim { opacity: 0; }
        .ft-anim.go {
          animation: ftSlideUp .6s cubic-bezier(.22,.68,0,1.15) forwards;
        }
        .ft-anim.go.d1 { animation-delay: .04s; }
        .ft-anim.go.d2 { animation-delay: .11s; }
        .ft-anim.go.d3 { animation-delay: .18s; }
        .ft-anim.go.d4 { animation-delay: .25s; }

        /* ── grid ── */
        .ft-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: clamp(28px,4vw,40px);
        }

        /* ── brand ── */
        .ft-logo {
          font-size: clamp(19px,2vw,24px); font-weight: 700;
          color: #0a1f14; letter-spacing: -0.5px;
          cursor: pointer; margin-bottom: 12px; display: inline-block;
        }
        .ft-logo span { color: #2D6A4F; }
        .ft-tagline {
          font-size: 13px; color: #6B7280; font-weight: 300;
          line-height: 1.75; max-width: 260px; margin-bottom: 20px;
        }
        .ft-live-badge {
          display: inline-flex; align-items: center; gap: 7px;
          border: 0.5px solid rgba(82,183,136,0.35);
          border-radius: 20px; padding: 5px 13px;
          font-size: 11px; color: #1B3A2D; font-weight: 500;
          background: rgba(82,183,136,0.06);
          letter-spacing: 0.2px;
        }
        .ft-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #52B788; flex-shrink: 0;
          animation: pulse 1.6s ease-in-out infinite;
        }

        /* ── nav columns ── */
        .ft-col-title {
          font-size: 10.5px; font-weight: 600; color: #1B3A2D;
          text-transform: uppercase; letter-spacing: 1.3px;
          margin-bottom: 14px;
        }
        .ft-links { display: flex; flex-direction: column; gap: 11px; }
        .ft-link {
          font-size: 13px; font-weight: 300; color: #4B5563;
          cursor: pointer; transition: color .15s, padding-left .15s;
          background: none; border: none; padding: 0;
          font-family: inherit; text-align: left;
        }
        .ft-link:hover { color: #1B3A2D; padding-left: 4px; }

        /* ── newsletter / cta card ── */
        .ft-cta {
          background: #F9FAFB;
          border: 0.5px solid #E5E7EB;
          border-radius: 16px;
          padding: 18px 16px;
        }
        .ft-cta-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 4px; }
        .ft-cta-sub   { font-size: 12px; color: #6B7280; line-height: 1.6; margin-bottom: 14px; font-weight: 300; }
        .ft-cta-btn {
          width: 100%;
          background: #1B3A2D; color: #D8F0E6;
          border: none; border-radius: 9px;
          padding: 9px 14px; font-size: 12.5px;
          font-weight: 400; font-family: inherit;
          cursor: pointer; transition: background .15s;
          text-align: center;
        }
        .ft-cta-btn:hover { background: #2D6A4F; }

        /* ── divider ── */
        .ft-hr {
          height: 0.5px; background: #E5E7EB; margin-bottom: 20px;
        }

        /* ── bottom bar ── */
        .ft-bottom {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .ft-copy {
          font-size: 12px; color: #9CA3AF; font-weight: 300;
        }
        .ft-copy strong { color: #374151; font-weight: 500; }

        /* ── socials — no bg, just icon + underline on hover ── */
        .ft-socials { display: flex; gap: 18px; align-items: center; }
        .ft-social {
          background: none; border: none; padding: 0;
          color: #9CA3AF; cursor: pointer;
          display: flex; align-items: center;
          transition: color .15s, transform .15s;
          position: relative;
        }
        .ft-social::after {
          content: '';
          position: absolute; bottom: -3px; left: 0; right: 0;
          height: 1px; background: #52B788;
          transform: scaleX(0); transform-origin: left;
          transition: transform .2s ease;
        }
        .ft-social:hover { color: #1B3A2D; transform: translateY(-1px); }
        .ft-social:hover::after { transform: scaleX(1); }

        /* ── responsive ── */
        @media (max-width: 860px) {
          .ft-grid { grid-template-columns: 1.2fr 1fr 1fr; gap: 28px; }
          .ft-grid > .ft-cta-col { display: none; }
        }
        @media (max-width: 600px) {
          .ft-grid { grid-template-columns: 1fr 1fr; gap: 24px 18px; }
          .ft-grid > .ft-brand-col { grid-column: 1 / -1; }
          .ft-bottom { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ft-anim { opacity:1; animation:none !important; }
          .ft-accent, .ft-live-dot { animation:none; }
        }
      `}</style>

      <footer className="ft" ref={ref}>
        <div className="ft-accent" />

        <div className="ft-wrap">
          <div className="ft-grid">

            {/* Brand */}
            <div className={`ft-brand-col ft-anim ${visible ? "go d1" : ""}`}>
              <div className="ft-logo" onClick={() => router.push("/")}>
                Auc<span>ville</span>
              </div>
              <p className="ft-tagline">
                Real-time bidding on thousands of items. Verified sellers, every purchase protected.
              </p>
             
            </div>

            {/* Browse */}
            <div className={`ft-anim ${visible ? "go d2" : ""}`}>
              <div className="ft-col-title">Browse</div>
              <div className="ft-links">
                {BROWSE_ITEMS.map(({ label, href }) => (
                  <button key={label} className="ft-link" onClick={() => router.push(href)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div className={`ft-anim ${visible ? "go d3" : ""}`}>
              <div className="ft-col-title">Account</div>
              <div className="ft-links">
                {ACCOUNT_ITEMS.map(({ label, href }) => (
                  <button key={label} className="ft-link" onClick={() => router.push(href)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA card — hidden on tablet/mobile via CSS */}
            <div className={`ft-cta-col ft-anim ${visible ? "go d4" : ""}`}>
              <div className="ft-col-title">Need help?</div>
              <div className="ft-cta">
                <div className="ft-cta-title">Questions about an order?</div>
                <div className="ft-cta-sub">
                  Our team can help with shipping, bidding, or account issues.
                </div>
                <button className="ft-cta-btn" onClick={() => router.push("/orders")}>
                  View my orders →
                </button>
              </div>
            </div>

          </div>

          <div className="ft-hr" />

          <div className={`ft-bottom ft-anim ${visible ? "go d4" : ""}`}>
            <div className="ft-copy">
              © {new Date().getFullYear()} <strong>Aucville</strong>. All rights reserved.
            </div>

            <div className="ft-socials">
              {/* X / Twitter */}
              <button className="ft-social" aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              {/* Instagram */}
              <button className="ft-social" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </button>
              {/* LinkedIn */}
              <button className="ft-social" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7H10v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
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