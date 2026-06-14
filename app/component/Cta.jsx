"use client";
import React, { useEffect, useRef, useState } from "react";
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

    const stats = [
        { prefix: "", target: 12400, suffix: "+", label: "Bidders" },
        { prefix: "", target: 98, suffix: "%", label: "Satisfaction" },
        { prefix: "$", target: 2400000, suffix: "", label: "Auctioned" },
    ];

    const steps = [
        { n: "01", title: "List it", sub: "Photo + price in minutes" },
        { n: "02", title: "Go live", sub: "Instant reach to buyers" },
        { n: "03", title: "Get paid", sub: "Funds in 24 h" },
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');

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
        .cs-left {
          opacity:0; transform:translateY(20px);
          transition: opacity .55s ease, transform .55s ease;
        }
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
          display:flex; flex-direction:column; gap:0;
          margin-bottom:32px;
          border:1.5px solid #e5e7eb; border-radius:14px;
          overflow:hidden;
        }
        .cs-pill {
          display:flex; align-items:center; gap:14px;
          padding:14px 18px;
          border-bottom:1px solid #f3f4f6;
          transition: background .15s;
        }
        .cs-pill:last-child { border-bottom:none; }
        .cs-pill:hover { background:#f9fafb; }
        /* green left accent bar */
        .cs-pill-bar {
          width:3px; height:32px; flex-shrink:0;
          border-radius:2px; background:#166534;
        }
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

        /* stats row */
        .cs-stats {
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:0;
          border:1.5px solid #e5e7eb; border-radius:16px;
          overflow:hidden; margin-bottom:16px;
          background:#fff;
        }
        .cs-stat {
          padding:22px 18px;
          border-right:1px solid #e5e7eb;
          transition: background .18s;
        }
        .cs-stat:last-child { border-right:none; }
        .cs-stat:hover { background:#f0fdf4; }
        .cs-stat-val {
          font-size:clamp(22px,2.8vw,32px); font-weight:700;
          color:#166534; letter-spacing:-1px; line-height:1;
        }
        .cs-stat-lbl {
          font-size:10.5px; color:#6b7280; margin-top:5px;
          text-transform:uppercase; letter-spacing:0.5px; font-weight:500;
        }

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

        /* connector arrow between stat & steps */
        .cs-connector {
          display:flex; align-items:center; justify-content:center;
          padding:6px 0; color:#9ca3af; font-size:14px;
        }

        @media (max-width: 768px) {
          .cs-inner { grid-template-columns:1fr; }
          .cs-left, .cs-right { opacity:1 !important; transform:none !important; }
          .cs-stats { grid-template-columns:repeat(3,1fr); }
        }
        @media (max-width: 480px) {
          .cs-pills { gap:8px; }
          .cs-stats  { grid-template-columns:1fr 1fr; }
        }
        @media (prefers-reduced-motion:reduce) {
          .cs-left,.cs-right,.cs-h2 mark::after { transition:none !important; opacity:1 !important; }
        }
      `}</style>

            <section className="cs" ref={ref}>
                <div className="cs-inner">

                    {/* LEFT */}
                    <div className={`cs-left ${vis ? "v" : ""}`}>
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
                            ].map(p => (
                                <div key={p.main} className="cs-pill">
                                    <div className="cs-pill-bar" />
                                    <div>
                                        <div className="cs-pill-main">{p.main}</div>
                                        <div className="cs-pill-sub">{p.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cs-btns">
                            <button className="cs-btn-p" onClick={() => router.push("/create-auction")}>
                                Start auction →
                            </button>

                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className={`cs-right ${vis ? "v" : ""}`}>
                        {/* stats */}
                        <div className="cs-stats">
                            {stats.map(s => (
                                <div key={s.label} className="cs-stat">
                                    <div className="cs-stat-val">
                                        <Counter prefix={s.prefix} target={s.target} suffix={s.suffix} />
                                    </div>
                                    <div className="cs-stat-lbl">{s.label}</div>
                                </div>
                            ))}
                        </div>


                        <div className="cs-connector">↓</div>

                        {/* steps */}
                        <div className="cs-steps-wrap">
                            {steps.map(s => (
                                <div key={s.n} className="cs-step">
                                    <div className="cs-step-n">{s.n}</div>
                                    <div>
                                        <div className="cs-step-title">{s.title}</div>
                                        <div className="cs-step-sub">{s.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
}