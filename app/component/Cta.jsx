"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

function Counter({ target, prefix = "", suffix = "" }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setStarted(true); },
            { threshold: 0.4 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        const dur = 1400;
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(e * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [started, target]);

    return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Testimonial ticket stack — fanned, spread layout, ticket-style cards ──
function TestimonialTickets({ visible }) {
    const testimonials = [
        {
            quote: "Listed a watch on a Tuesday, had three solid bids by Thursday. Funds hit my account the day after it closed.",
            name: "M. Reyes",
            role: "Verified seller",
            rotate: -4,
        },
        {
            quote: "Shipping label was generated automatically once payment cleared. I didn't have to think about logistics at all.",
            name: "J. Okafor",
            role: "Verified seller",
            rotate: 3,
        },
        {
            quote: "Sold furniture I thought would sit for weeks. Got a fair price in four days, no back-and-forth haggling.",
            name: "S. Whitfield",
            role: "Verified seller",
            rotate: -2,
        },
    ];

    return (
        <div className="cs-tickets">
            {testimonials.map((t, i) => (
                <div
                    key={t.name}
                    className="cs-ticket"
                    style={{
                        transform: visible
                            ? `rotate(${t.rotate}deg) translateY(0)`
                            : `rotate(${t.rotate}deg) translateY(18px)`,
                        opacity: visible ? 1 : 0,
                        transitionDelay: `${0.15 + i * 0.12}s`,
                        zIndex: i === 1 ? 3 : i,
                        marginLeft: i === 0 ? 0 : -38,
                    }}
                >
                    <div className="cs-ticket-quote-mark">“</div>
                    <p className="cs-ticket-quote">{t.quote}</p>
                    <div className="cs-ticket-notch-l" />
                    <div className="cs-ticket-notch-r" />
                    <div className="cs-ticket-foot">
                        <div className="cs-ticket-avatar">{t.name.charAt(0)}</div>
                        <div>
                            <div className="cs-ticket-name">{t.name}</div>
                            <div className="cs-ticket-role">{t.role}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CreateAuctionCTA() {
    const router = useRouter();
    const ref = useRef(null);
    const [vis, setVis] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVis(true); },
            { threshold: 0.08 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const steps = [
       
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&display=swap');

        .cs {
          background: #fff;
          padding: clamp(56px,8vw,104px) clamp(20px,5vw,64px);
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
        }

        /* faint green splash top-right */
        .cs::before {
          content:'';
          position:absolute; top:-80px; right:-80px;
          width:360px; height:360px; border-radius:50%;
          background: radial-gradient(circle, rgba(21,128,61,0.07) 0%, transparent 70%);
          pointer-events:none;
        }

        .cs-inner {
          max-width:1200px; margin:0 auto;
          display:grid; grid-template-columns:1fr 1fr;
          gap: clamp(36px,6vw,80px); align-items:center;
          position:relative; z-index:1;
        }

        /* ── LEFT ── */
       .cs-left { position: relative; }
        .cs-left.v { opacity:1; transform:none; }

        .cs-tag {
          display:inline-block;
          font-size:10.5px; font-weight:700; letter-spacing:1.8px;
          text-transform:uppercase; color:#166534;
          border:1.5px solid #166534; border-radius:20px;
          padding:4px 12px; margin-bottom:20px;
        }

        .cs-h2 {
          font-size: clamp(32px,4.2vw,54px);
          font-weight:700;color:#444444;
          line-height:1.05; letter-spacing:-1.5px;
          margin-bottom:24px;
        }
        .cs-h2 mark {
          background:none;
          color:#15803d;
          position:relative; display:inline-block;
        }
        .cs-h2 mark::after {
          content:'';
          position:absolute; bottom:-2px; left:0;
          height:3px; width:0; border-radius:2px;
          background:#166534;
          transition: width .9s cubic-bezier(.22,.68,0,1.1) .35s;
        }
        .v .cs-h2 mark::after { width:100%; }

        /* feature rows — no icons */
       .cs-pills {
  display: flex; flex-direction: column; gap: 14px;
  margin-bottom: 32px; padding: 4px 0;
}
.cs-pill {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  background: #fff;
  transition: border-color .15s, box-shadow .15s;
}
.cs-pill:hover { border-color: #86efac; box-shadow: 0 4px 14px rgba(22,163,74,0.08); }
.cs-pill-main { font-size: 13.5px; font-weight: 600; color: #0a0a0a; }
.cs-pill-sub  { font-size: 11.5px; color: #6b7280; margin-top: 1px; }
.cs-pill-arrow {
  position: absolute; left: 50%; bottom: -16px; transform: translateX(-50%);
  font-size: 12px; color: #9ca3af; z-index: 1;
}
        .cs-pill:last-child { border-bottom:none; }
        .cs-pill:hover { background:#f9fafb; }
        .cs-btn-glass {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 13px 22px;
  background: rgba(255,255,255,0.5);
  color: #0a0a0a;
  border: 1px solid rgba(10,31,20,0.12);
  border-radius: 14px;
  font-size: 14px; font-weight: 500; font-family: inherit;
  cursor: pointer;
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  box-shadow: 0 4px 16px rgba(10,31,20,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
  transition: box-shadow .18s, transform .12s, border-color .18s;
}
.cs-btn-glass:hover { border-color: rgba(22,101,52,0.3); box-shadow: 0 6px 20px rgba(10,31,20,0.1); transform: translateY(-1px); }
.cs-btn-glass:active { transform: scale(0.98); }
        .cs-pill-main { font-size:13.5px; font-weight:600; color:#0a0a0a; }
        .cs-pill-sub  { font-size:11.5px; color:#6b7280; margin-top:1px; }

        /* buttons */
        .cs-btns { display:flex; gap:10px; flex-wrap:wrap; }

        .cs-btn-p {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 26px;
          background:#166534; color:#fff;
          border:none; border-radius:11px;
          font-size:14px; font-weight:600; font-family:inherit;
          cursor:pointer; letter-spacing:0.2px;
          transition: background .16s, transform .12s, box-shadow .16s;
        }
        .cs-btn-p:hover { background:#14532d; transform:translateY(-2px); box-shadow:0 8px 24px rgba(22,101,52,0.28); }

        .cs-btn-s {
          display:inline-flex; align-items:center; gap:6px;
          padding:13px 20px;
          background:transparent; color:#0a0a0a;
          border:1.5px solid #d1d5db; border-radius:11px;
          font-size:14px; font-weight:500; font-family:inherit;
          cursor:pointer;
          transition: background .16s, border-color .16s;
        }
        .cs-btn-s:hover { background:#f9fafb; border-color:#9ca3af; }

        /* ── RIGHT ── */
        .cs-right {
          opacity:0; transform:translateY(20px);
          transition: opacity .55s ease .12s, transform .55s ease .12s;
        }
        .cs-right.v { opacity:1; transform:none; }

        /* ════════ Testimonial ticket stack (replaces stats row) ════════ */
        .cs-tickets {
          display: flex;
          align-items: flex-start;
          padding: 18px 0 30px 40px;
          margin-bottom: 4px;
        }

        .cs-ticket {
          position: relative;
          background: #ffffff;
          border: 1px solid rgba(10,31,20,0.12);
          border-radius: 16px;
          width: 198px;
          flex-shrink: 0;
          padding: 18px 18px 16px;
          box-shadow: 0 14px 34px rgba(10,31,20,0.09), 0 2px 8px rgba(10,31,20,0.05);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.22,.68,0,1.1);
        }
        .cs-ticket:hover { z-index: 5 !important; transform: translateY(-6px) rotate(0deg) !important; }

        .cs-ticket::before {
          content: '';
          position: absolute; left: -1px; right: -1px; bottom: 56px;
          border-bottom: 1.5px dashed rgba(10,31,20,0.14);
        }
        .cs-ticket-notch-l, .cs-ticket-notch-r {
          position: absolute; bottom: 49px;
          width: 12px; height: 12px;
          background: #ffffff;
          border-radius: 50%;
          border: 1px solid rgba(10,31,20,0.12);
        }
        .cs-ticket-notch-l { left: -6px; }
        .cs-ticket-notch-r { right: -6px; }

        .cs-ticket-quote-mark {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 32px; color: #c9dccf;
          line-height: 1; margin-bottom: 2px;
        }
        .cs-ticket-quote {
          font-size: 12.5px; color: #1f2d24; font-weight: 500;
          line-height: 1.55; margin-bottom: 18px;
          display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cs-ticket-foot {
          display: flex; align-items: center; gap: 9px;
          padding-top: 14px;
        }
        .cs-ticket-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: #166534; color: #d1fae5;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cs-ticket-name { font-size: 11.5px; font-weight: 700; color: #0a0a0a; }
        .cs-ticket-role { font-size: 10px; color: #16a34a; font-weight: 500; }

        /* steps */
        .cs-steps-wrap {
          border:1.5px solid #e5e7eb; border-radius:16px;
          overflow:hidden;
        }
        .cs-step {
          display:flex; align-items:center; gap:16px;
          padding:16px 20px;
          border-bottom:1px solid #f3f4f6;
          transition: background .15s;
        }
        .cs-step:last-child { border-bottom:none; }
        .cs-step:hover { background:#f9fafb; }

        .cs-step-n {
          width:30px; height:30px; flex-shrink:0;
          border-radius:8px;
          border:1.5px solid #166534;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; color:#166534; letter-spacing:0.5px;
        }
        .cs-step-title { font-size:14px; font-weight:700; color:#0a0a0a; }
        .cs-step-sub   { font-size:12px; color:#6b7280; margin-top:1px; }

        /* connector arrow between testimonials & steps */
        .cs-connector {
          display:flex; align-items:center; justify-content:center;
          padding:6px 0; color:#9ca3af; font-size:14px;
        }

        @media (max-width: 768px) {
          .cs-inner { grid-template-columns:1fr; }
          .cs-left, .cs-right { opacity:1 !important; transform:none !important; }
        }
        @media (max-width: 480px) {
          .cs-pills { gap:8px; }
          .cs-tickets { padding-left: 20px; justify-content: center; flex-wrap: wrap; row-gap: 24px; }
          .cs-ticket { width: 168px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .cs-left,.cs-right,.cs-h2 mark::after,.cs-ticket { transition:none !important; opacity:1 !important; }
        }
      `}</style>

            <section className="cs" ref={ref}>
                <div className="cs-inner">

                   {/* LEFT */}
<motion.div
    className="cs-left"
    initial={{ opacity: 0, y: 20 }}
    animate={vis ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.55, ease: [0.22, 0.68, 0, 1.1] }}
>
    <div className="cs-tag">Sell on BidFlow</div>

    <h2 className="cs-h2">
        List today.<br />
        Get <mark>real bids</mark>.
    </h2>

    <div className="cs-pills">
        {[
            { main: "Live in 3 minutes", sub: "No lengthy setup" },
            { main: "Secure payments", sub: "Every transaction covered" },
            { main: "Secure shipping", sub: "Door to Door delivery" },
        ].map((p, i) => (
            <motion.div
                key={p.main}
                className="cs-pill"
                style={{ transform: `translateX(${i % 2 === 0 ? -10 : 10}px)` }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                animate={vis ? { opacity: 1, x: i % 2 === 0 ? -10 : 10 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 0.68, 0, 1.1] }}
            >
                <div>
                    <div className="cs-pill-main">{p.main}</div>
                    <div className="cs-pill-sub">{p.sub}</div>
                </div>
                {i < 2 && <span className="cs-pill-arrow">↓</span>}
            </motion.div>
        ))}
    </div>

    <div className="cs-btns">
        <button className="cs-btn-p" onClick={() => router.push("/create-auction")}>
            Start auction →
        </button>
        <button className="cs-btn-glass" onClick={() => router.push("/auction")}>
            View live auctions
        </button>
    </div>
</motion.div>
                    {/* RIGHT */}
                    <div className={`cs-right ${vis ? "v" : ""}`}>
                        {/* testimonial ticket stack */}
                        <TestimonialTickets visible={vis} />

                      
                    </div>

                </div>
            </section>
        </>
    );
}