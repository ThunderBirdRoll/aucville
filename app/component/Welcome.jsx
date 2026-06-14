"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const COOKIE_KEY  = "aucville_visited";
const COOKIE_DAYS = 2;

function setCookie(name, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=1; expires=${expires}; path=/; SameSite=Lax`;
}

function hasCookie(name) {
  return document.cookie.split(";").some(c => c.trim().startsWith(name + "="));
}

export default function WelcomePopup() {
  const { data: session, status } = useSession();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Wait until session is resolved so we don't flash for logged-in users
    if (status === "loading") return;

    // Logged-in users never see the popup
    if (session) return;

    // Returning visitors (cookie present) don't see it again
    if (hasCookie(COOKIE_KEY)) return;

    // New, unauthenticated visitor — set cookie then show
    setCookie(COOKIE_KEY, COOKIE_DAYS);
    setShow(true);
  }, [status, session]);

  function close() { setShow(false); }

  function handleSignIn() {
    close();
    router.push("/login"); // adjust to your sign-in route
  }

  if (!show) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes wp-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wp-slide-up { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .wp-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0, 0, 0, 0.38);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: wp-fade-in .22s ease forwards;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }
        .wp-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 420px;
          overflow: hidden;
          animation: wp-slide-up .32s cubic-bezier(.22,.68,0,1.15) forwards;
          position: relative;
        }

        /* ── header ── */
        .wp-head {
          background: #0f4527;
          padding: 28px 28px 24px;
          text-align: center;
          position: relative;
        }
        .wp-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.10);
          border: 1.5px solid rgba(82,183,136,0.45);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .wp-icon svg { width: 22px; height: 22px; color: #d0f0e0; }
        .wp-title   { font-size: 19px; font-weight: 600; color: #d0f0e0; margin-bottom: 5px; letter-spacing: -0.3px; }
        .wp-sub     { font-size: 12.5px; color: rgba(208,240,224,0.62); font-weight: 400; }

        .wp-close {
          position: absolute; top: 14px; right: 16px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.10); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #d0f0e0;
          transition: background .15s;
        }
        .wp-close:hover { background: rgba(255,255,255,0.18); }

        /* ── body ── */
        .wp-body  { padding: 22px 24px 20px; }
        .wp-steps { display: flex; flex-direction: column; gap: 16px; margin-bottom: 22px; }

        .wp-step       { display: flex; gap: 14px; align-items: flex-start; }
        .wp-step-num   {
          flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .wp-step-num.green { background: #e8f5ee; border: 1px solid #b5d4c3; color: #145c35; }
        .wp-step-num.amber { background: #fef3e2; border: 1px solid #f5c842; color: #92600a; }

        .wp-step-title { font-size: 14px; font-weight: 600; color: #0a1f14; margin-bottom: 2px; }
        .wp-step-desc  { font-size: 12.5px; color: #4d7060; line-height: 1.65; }

        /* ── buttons ── */
        .wp-btns { display: flex; gap: 10px; }
        .wp-btn-primary {
          flex: 1; background: #145c35; color: #d0f0e0;
          border: none; border-radius: 10px;
          padding: 11px 0; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; letter-spacing: 0.1px;
          transition: background .15s, transform .1s;
        }
        .wp-btn-primary:hover  { background: #0f4527; }
        .wp-btn-primary:active { transform: scale(0.97); }

        .wp-btn-ghost {
          flex: 1; background: transparent; color: #4d7060;
          border: 1px solid #c8ddd5; border-radius: 10px;
          padding: 11px 0; font-size: 13.5px; font-weight: 400;
          cursor: pointer; font-family: inherit;
          transition: background .15s, border-color .15s;
        }
        .wp-btn-ghost:hover { background: #f0faf5; border-color: #1a7a48; color: #0f4527; }

        .wp-note {
          text-align: center; font-size: 11px; color: #8fada0;
          margin-top: 14px; line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
          .wp-overlay, .wp-modal { animation: none; }
        }
      `}</style>

      <div className="wp-overlay" onClick={close}>
        <div className="wp-modal" onClick={e => e.stopPropagation()}>

          <div className="wp-head">
            <div className="wp-icon">
              {/* gavel icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4L20 10" /><path d="M5.5 14.5L9.5 10.5" />
                <path d="M3.5 20.5L9.5 14.5" /><path d="M8 8L16 16" />
                <path d="M14 4L10 8" /><path d="M16 16l4 4" />
              </svg>
            </div>
            <div className="wp-title">Welcome to Aucville</div>
            <div className="wp-sub">The premier platform for real-time online auctions</div>
            <button className="wp-close" onClick={close} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="wp-body">
            <div className="wp-steps">

              <div className="wp-step">
                <div className="wp-step-num green">1</div>
                <div>
                  <div className="wp-step-title">Sign up & browse</div>
                  <div className="wp-step-desc">Create your free account to unlock bidding. Browse thousands of live auctions instantly.</div>
                </div>
              </div>

              <div className="wp-step">
                <div className="wp-step-num amber">2</div>
                <div>
                  <div className="wp-step-title">Place your bids</div>
                  <div className="wp-step-desc">Find items you love and bid in real-time. Highest bidder wins when the timer runs out.</div>
                </div>
              </div>

              <div className="wp-step">
                <div className="wp-step-num green">3</div>
                <div>
                  <div className="wp-step-title">Win & check out</div>
                  <div className="wp-step-desc">Pay securely for won items and track your package right to your doorstep.</div>
                </div>
              </div>

            </div>

            <div className="wp-btns">
              <button className="wp-btn-primary" onClick={handleSignIn}>Sign in to start</button>
              <button className="wp-btn-ghost"   onClick={close}>Just browsing</button>
            </div>

            <p className="wp-note">Won't show again after this visit · Cookie expires in 2 days</p>
          </div>

        </div>
      </div>
    </>
  );
}