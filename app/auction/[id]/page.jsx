"use client";
export const dynamic = "force-dynamic";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../../component/Navbar";
import Footer from "../../component/Footer";

function timeLeft(endTime, _tick) {
  const diff = new Date(endTime) - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return { d, h, m, s };
  if (h > 0) return { d: 0, h, m, s };
  return { d: 0, h: 0, m, s };
}

function Countdown({ endTime }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const t = timeLeft(endTime, tick);
  if (!t) return (
    <div className="cd-ended">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Auction Ended
    </div>
  );
  const urgent = t.d === 0 && t.h === 0;
  const units = t.d > 0
    ? [{ v: t.d, l: "Days" }, { v: t.h, l: "Hrs" }, { v: t.m, l: "Min" }, { v: t.s, l: "Sec" }]
    : t.h > 0
    ? [{ v: t.h, l: "Hrs" }, { v: t.m, l: "Min" }, { v: t.s, l: "Sec" }]
    : [{ v: t.m, l: "Min" }, { v: t.s, l: "Sec" }];
  return (
    <div className={`cd-wrap ${urgent ? "cd-urgent" : ""}`}>
      {units.map((u, i) => (
        <React.Fragment key={u.l}>
          <div className="cd-unit">
            <div className="cd-num">{String(u.v).padStart(2, "0")}</div>
            <div className="cd-lbl">{u.l}</div>
          </div>
          {i < units.length - 1 && <div className="cd-sep">:</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [bidAmt,  setBidAmt]  = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidMsg,  setBidMsg]  = useState({ text: "", ok: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

  const fetchAuction = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/auction/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setAuction(data.auction);
      setBidAmt(String((data.auction.currentPrice ?? data.auction.startingPrice) + 10));
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAuction(); }, [fetchAuction]);

  // ── Derive user-specific state from session + auction ──────────────────────
  const userId = session?.user?._id ?? session?.user?.id ?? null;

  // Find the user's highest bid in the bids array
  const myLastBid = auction?.bids
    ?.filter(b => String(b.bidder) === String(userId))
    ?.sort((a, b) => b.amount - a.amount)[0] ?? null;

  // True if the logged-in user owns this auction
  const isOwner = !!userId && !!auction && String(auction.owner) === String(userId);

  // Reason the bid button is blocked (null = allowed)
  const bidBlockReason = !session
    ? "Log in to place a bid"
    : isOwner
    ? "You can't bid on your own listing"
    : null;

  async function handleBid() {
    if (!auction?.isLive || bidBlockReason) return;
    const amount = parseFloat(bidAmt);
    if (isNaN(amount) || amount <= 0) { setBidMsg({ text: "Enter a valid amount", ok: false }); return; }
    setBidding(true); setBidMsg({ text: "", ok: false });
    try {
      const res  = await fetch(`/api/auction/${id}/bid`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount ,userId: userId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBidMsg({ text: `Bid of $${amount.toLocaleString()} placed!`, ok: true });
      setAuction(a => ({
        ...a,
        finalPrice: data.finalPrice,
        currentPrice: data.finalPrice,
        bids: data.bids ?? Array(data.bidsCount).fill({}),
      }));
      setBidAmt(String(data.finalPrice + 10));
    } catch (e) { setBidMsg({ text: e.message || "Bid failed", ok: false }); }
    finally     { setBidding(false); }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString() : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }

        .dp { min-height:100vh; background:#fff; font-family:'DM Sans','Helvetica Neue',sans-serif; font-weight:300; position:relative; overflow-x:hidden; }
        .dp-bg { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .dp-bg-g { position:absolute; top:-10%; right:-8%; width:55%; height:120%;
          background:radial-gradient(ellipse at 80% 50%, rgba(82,183,136,0.13) 0%, rgba(216,240,230,0.09) 40%, rgba(242,250,246,0.05) 65%, transparent 82%); }

        @keyframes barShimmer { 0%,100%{background-position:0% 50%;} 50%{background-position:100% 50%;} }
        .accent-bar { height:3px; background:linear-gradient(90deg,#1B3A2D 0%,#52B788 55%,#a7f3d0 100%); background-size:200% 100%; animation:barShimmer 5s ease infinite; position:relative; z-index:2; }

        @keyframes slideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        .anim { opacity:0; }
        .anim.go { animation:slideUp .5s cubic-bezier(.22,.68,0,1.15) forwards; }
        .anim.go.d1{animation-delay:.05s;} .anim.go.d2{animation-delay:.13s;} .anim.go.d3{animation-delay:.21s;}

        .dp-wrap { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:clamp(28px,5vw,52px) clamp(16px,4vw,40px) 72px; }

        .bc { font-size:12px; color:#9CA3AF; margin-bottom:20px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .bc a { color:#9CA3AF; text-decoration:none; transition:color .15s; }
        .bc a:hover { color:#52B788; }
        .bc-sep { opacity:0.4; }
        .bc-cur { color:#374151; }

        .dp-layout { display:grid; grid-template-columns:1fr 440px; gap:24px; align-items:start; }
        .dp-left  { display:flex; flex-direction:column; gap:16px; }
        .dp-right { display:flex; flex-direction:column; gap:16px; position:sticky; top:88px; }

        .img-card { background:rgba(255,255,255,0.9); border:0.5px solid #E5E7EB; border-radius:18px; overflow:hidden; }
        .img-wrap { position:relative; aspect-ratio:4/3; background:#F9FAFB; overflow:hidden; }
        .dp-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
        .img-card:hover .dp-img { transform:scale(1.02); }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.35;transform:scale(0.75);} }
        .img-live-badge { position:absolute; top:12px; left:12px; display:flex; align-items:center; gap:5px; border-radius:20px; padding:4px 11px; font-size:11px; font-weight:400; backdrop-filter:blur(10px); }
        .img-live-badge.live { background:rgba(27,58,45,0.88); color:#D8F0E6; border:0.5px solid rgba(82,183,136,0.5); }
        .img-live-badge.ended-badge { background:rgba(243,244,246,0.95); color:#6B7280; border:0.5px solid #E5E7EB; }
        .live-dot { width:6px; height:6px; border-radius:50%; background:#52B788; animation:pulse 1.6s ease-in-out infinite; }

        .img-bids-pill { position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.88); border:0.5px solid #E5E7EB; border-radius:20px; padding:4px 11px; font-size:10.5px; color:#374151; backdrop-filter:blur(8px); display:flex; align-items:center; gap:5px; }

        .img-bottom { position:absolute; bottom:0; left:0; right:0; padding:24px 16px 14px; background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 100%); }
        .img-bottom-lbl { font-size:9.5px; color:rgba(255,255,255,0.55); letter-spacing:0.6px; text-transform:uppercase; margin-bottom:6px; }

        .cd-wrap { display:flex; align-items:center; gap:6px; }
        .cd-unit { display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.12); border:0.5px solid rgba(255,255,255,0.2); border-radius:8px; padding:5px 10px; min-width:44px; backdrop-filter:blur(4px); }
        .cd-num { font-size:20px; font-weight:400; color:#fff; letter-spacing:-0.5px; line-height:1; font-variant-numeric:tabular-nums; }
        .cd-lbl { font-size:8.5px; color:rgba(255,255,255,0.55); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }
        .cd-sep { font-size:18px; color:rgba(255,255,255,0.4); font-weight:300; padding-bottom:8px; }
        .cd-urgent .cd-unit { background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.35); }
        .cd-urgent .cd-num { color:#F59E0B; }
        .cd-ended { display:flex; align-items:center; gap:6px; font-size:13px; color:#EF4444; }

        .details-card { background:rgba(255,255,255,0.9); border:0.5px solid #E5E7EB; border-radius:18px; padding:22px; backdrop-filter:blur(6px); }
        .card-hdr { font-size:11px; font-weight:500; color:#374151; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .card-hdr::after { content:''; flex:1; height:0.5px; background:#E5E7EB; }
        .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .detail-cell { background:#F9FAFB; border:0.5px solid #E5E7EB; border-radius:12px; padding:13px 16px; }
        .detail-lbl { font-size:9.5px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px; }
        .detail-val { font-size:14px; font-weight:400; color:#111827; }
        .detail-val.green { color:#1B3A2D; font-weight:500; }

        .title-card { background:rgba(255,255,255,0.9); border:0.5px solid #E5E7EB; border-radius:18px; padding:22px; backdrop-filter:blur(6px); }
        .auction-title { font-size:clamp(17px,2.2vw,24px); font-weight:400; color:#111827; line-height:1.35; margin-bottom:8px; letter-spacing:-0.3px; }
        .cat-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(82,183,136,0.08); border:0.5px solid rgba(82,183,136,0.28); border-radius:20px; padding:4px 11px; font-size:11px; color:#2D6A4F; margin-bottom:18px; }

        .pb-strip { display:grid; grid-template-columns:1fr 1fr; gap:0; border:0.5px solid #E5E7EB; border-radius:14px; overflow:hidden; margin-bottom:16px; background:#F9FAFB; }
        .pb-cell { padding:16px 18px; }
        .pb-cell:first-child { border-right:0.5px solid #E5E7EB; }
        .pb-lbl { font-size:9.5px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
        .pb-val { font-size:clamp(22px,2.8vw,30px); font-weight:300; color:#1B3A2D; letter-spacing:-0.6px; line-height:1; }
        .pb-val .curr { font-size:14px; color:#52B788; font-weight:400; vertical-align:super; margin-right:1px; }
        .pb-bids { font-size:clamp(22px,2.8vw,30px); font-weight:300; color:#374151; letter-spacing:-0.6px; line-height:1; }
        .pb-bids-sub { font-size:10px; color:#9CA3AF; margin-top:4px; }

        .end-row { display:flex; align-items:center; gap:8px; font-size:12.5px; color:#374151; padding:12px 14px; background:#F9FAFB; border:0.5px solid #E5E7EB; border-radius:11px; }
        .end-row svg { color:#52B788; flex-shrink:0; }

        /* ── Your bid banner ── */
        .my-bid-banner {
          display:flex; align-items:center; justify-content:space-between;
          background:rgba(82,183,136,0.08); border:0.5px solid rgba(82,183,136,0.35);
          border-radius:12px; padding:12px 16px; margin-bottom:0;
        }
        .my-bid-left { display:flex; align-items:center; gap:8px; }
        .my-bid-dot { width:7px; height:7px; border-radius:50%; background:#52B788; flex-shrink:0; }
        .my-bid-label { font-size:11.5px; color:#2D6A4F; font-weight:300; }
        .my-bid-amount { font-size:20px; font-weight:400; color:#1B3A2D; letter-spacing:-0.4px; }
        .my-bid-curr { font-size:12px; color:#52B788; vertical-align:super; margin-right:1px; }

        /* ── Owner notice ── */
        .owner-notice {
          display:flex; align-items:center; gap:8px;
          background:rgba(27,58,45,0.05); border:0.5px solid rgba(27,58,45,0.18);
          border-radius:12px; padding:12px 16px;
          font-size:12.5px; color:#1B3A2D; font-weight:300;
        }

        .bid-card { background:rgba(255,255,255,0.9); border:0.5px solid #E5E7EB; border-radius:18px; padding:22px; backdrop-filter:blur(6px); }
        .bid-input-wrap { position:relative; margin-bottom:10px; }
        .bid-prefix { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#52B788; font-weight:400; }
        .bid-input { width:100%; border:1.5px solid #E5E7EB; border-radius:12px; padding:14px 14px 14px 30px; font-size:20px; font-family:inherit; font-weight:300; color:#111827; background:#fff; outline:none; transition:border-color .18s, box-shadow .18s; }
        .bid-input:focus { border-color:#52B788; box-shadow:0 0 0 3px rgba(82,183,136,0.10); }
        .bid-hint { font-size:11.5px; color:#9CA3AF; margin-bottom:14px; display:flex; align-items:center; gap:5px; }
        .bid-btn { width:100%; padding:14px; border-radius:12px; border:none; font-family:inherit; font-size:14px; font-weight:400; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:background .15s, transform .1s; letter-spacing:0.2px; }
        .bid-btn-active { background:linear-gradient(135deg,#1B3A2D,#2D6A4F); color:#fff; }
        .bid-btn-active:hover { opacity:.92; }
        .bid-btn-active:active { transform:scale(0.98); }
        .bid-btn-active:disabled { background:#6B7280; cursor:not-allowed; opacity:1; }
        .bid-btn-blocked { background:#F3F4F6; color:#9CA3AF; border:0.5px solid #E5E7EB; cursor:not-allowed; }
        .bid-btn-ended { background:#F3F4F6; color:#9CA3AF; border:0.5px solid #E5E7EB; cursor:not-allowed; }
        .bid-msg { margin-top:10px; padding:11px 14px; border-radius:11px; font-size:12.5px; font-weight:300; display:flex; align-items:center; gap:7px; }
        .bid-msg-ok  { background:rgba(82,183,136,0.08); border:0.5px solid rgba(82,183,136,0.3); color:#2D6A4F; }
        .bid-msg-err { background:#FEF2F2; border:0.5px solid #FECACA; color:#B91C1C; }
        .ended-box { background:#FEF2F2; border:0.5px solid #FECACA; border-radius:12px; padding:16px; font-size:13px; color:#B91C1C; font-weight:300; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px; }

        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes shimmer { 0%{background-position:-600px 0;} 100%{background-position:600px 0;} }
        .sk { background:linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%); background-size:600px 100%; animation:shimmer 1.4s infinite; border-radius:10px; }
        .err-box { text-align:center; padding:64px 24px; color:#9CA3AF; }

        @media (max-width:860px) { .dp-layout { grid-template-columns:1fr; } .dp-right { position:static; } }
        @media (max-width:480px) { .detail-grid { grid-template-columns:1fr; } .cd-unit { min-width:36px; padding:4px 7px; } .cd-num { font-size:16px; } }
        @media (prefers-reduced-motion:reduce) { .anim { opacity:1; animation:none !important; } .accent-bar,.live-dot { animation:none; } }
      `}</style>

      <div className="dp">
        <Navbar />
        <div className="dp-bg"><div className="dp-bg-g" /></div>
        <div className="accent-bar" />

        <div className="dp-wrap">
          <nav className="bc">
            <a href="/">Home</a><span className="bc-sep">/</span>
            <a href="/auctions">Auctions</a><span className="bc-sep">/</span>
            <span className="bc-cur">{loading ? "Loading…" : auction?.title}</span>
          </nav>

          {loading && (
            <div className="dp-layout">
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div className="sk" style={{ height:360, borderRadius:18 }} />
                <div className="sk" style={{ height:160, borderRadius:18 }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div className="sk" style={{ height:200, borderRadius:18 }} />
                <div className="sk" style={{ height:180, borderRadius:18 }} />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="err-box">
              <svg width="44" height="44" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              <div style={{ fontSize:15, color:"#374151", marginBottom:4 }}>Failed to load</div>
              <div style={{ fontSize:12.5 }}>{error}</div>
            </div>
          )}

          {!loading && auction && (
            <div className="dp-layout">

              {/* LEFT */}
              <div className="dp-left">
                <div className={`img-card anim ${visible ? "go d1" : ""}`}>
                  <div className="img-wrap">
                    <img src={auction.imageUrl} alt={auction.title} className="dp-img"
                      onError={e => { e.target.src = "https://placehold.co/800x600/f3f4f6/9ca3af?text=No+Image"; }} />
                    <span className={`img-live-badge ${auction.isLive ? "live" : "ended-badge"}`}>
                      {auction.isLive && <span className="live-dot" />}
                      {auction.isLive ? "Live" : "Ended"}
                    </span>
                    <div className="img-bids-pill">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {auction.bids?.length ?? 0} bid{auction.bids?.length !== 1 ? "s" : ""}
                    </div>
                    <div className="img-bottom">
                      <div className="img-bottom-lbl">{auction.isLive ? "Time remaining" : "Ended at"}</div>
                      {auction.isLive
                        ? <Countdown endTime={auction.endTime} />
                        : <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>{fmt(auction.endTime)}</div>
                      }
                    </div>
                  </div>
                </div>

                <div className={`details-card anim ${visible ? "go d2" : ""}`}>
                  <div className="card-hdr">Details</div>
                  <div className="detail-grid">
                    <div className="detail-cell"><div className="detail-lbl">Category</div><div className="detail-val">{auction.category}</div></div>
                    <div className="detail-cell"><div className="detail-lbl">Starting Price</div><div className="detail-val">${auction.startingPrice?.toLocaleString()}</div></div>
                    <div className="detail-cell"><div className="detail-lbl">Current Price</div><div className="detail-val green">${auction.currentPrice?.toLocaleString()}</div></div>
                    <div className="detail-cell"><div className="detail-lbl">Ends On</div><div className="detail-val" style={{ fontSize:12.5 }}>{fmt(auction.endTime)}</div></div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="dp-right">

                {/* title card */}
                <div className={`title-card anim ${visible ? "go d1" : ""}`}>
                  <div className="auction-title">{auction.title}</div>
                  <div className="cat-pill">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    {auction.category}
                  </div>

                  <div className="pb-strip">
                    <div className="pb-cell">
                      <div className="pb-lbl">{auction.finalPrice ? "Current bid" : "Starting price"}</div>
                      <div className="pb-val"><span className="curr">$</span>{auction.currentPrice?.toLocaleString()}</div>
                    </div>
                    <div className="pb-cell">
                      <div className="pb-lbl">Total bids</div>
                      <div className="pb-bids">{auction.bids?.length ?? 0}</div>
                      <div className="pb-bids-sub">{auction.bids?.length === 1 ? "bid placed" : "bids placed"}</div>
                    </div>
                  </div>

                  {/* ── Your last bid banner — only when user has bid ── */}
                  {myLastBid && (
                    <div className="my-bid-banner" style={{ marginTop: 0, marginBottom: 14 }}>
                      <div className="my-bid-left">
                        <span className="my-bid-dot" />
                        <span className="my-bid-label">Your last bid</span>
                      </div>
                      <div className="my-bid-amount">
                        <span className="my-bid-curr">$</span>
                        {myLastBid.amount?.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="end-row">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Ends {fmt(auction.endTime)}</span>
                  </div>
                </div>

                {/* bid card */}
                <div className={`bid-card anim ${visible ? "go d2" : ""}`}>
                  <div className="card-hdr">Place a Bid</div>

                  {!auction.isLive ? (
                    <div className="ended-box">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      This auction has ended. No more bids accepted.
                    </div>

                  ) : isOwner ? (
                    /* ── Owner cannot bid ── */
                    <div className="owner-notice">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                      </svg>
                      You listed this auction — owners can't place bids.
                    </div>

                  ) : (
                    /* ── Normal bid UI ── */
                    <>
                      <div className="bid-input-wrap">
                        <span className="bid-prefix">$</span>
                        <input
                          type="number" className="bid-input"
                          value={bidAmt}
                          min={(auction.currentPrice ?? 0) + 1}
                          step="1"
                          onChange={e => setBidAmt(e.target.value)}
                          disabled={!!bidBlockReason}
                        />
                      </div>
                      <div className="bid-hint">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                        </svg>
                        Minimum bid: ${((auction.currentPrice ?? 0) + 1).toLocaleString()}
                      </div>

                      {/* Not logged in → blocked button with message */}
                      {!session ? (
                        <button className="bid-btn bid-btn-blocked" disabled>
                          Log in to place a bid
                        </button>
                      ) : (
                        <button className="bid-btn bid-btn-active" onClick={handleBid} disabled={bidding}>
                          {bidding ? (
                            <>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ animation:"spin 1s linear infinite" }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                              Placing bid…
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="m5 12 5 5L20 7"/>
                              </svg>
                              Place Bid · ${parseFloat(bidAmt || 0).toLocaleString()}
                            </>
                          )}
                        </button>
                      )}

                      {bidMsg.text && (
                        <div className={`bid-msg ${bidMsg.ok ? "bid-msg-ok" : "bid-msg-err"}`}>
                          {bidMsg.ok
                            ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>
                            : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          }
                          {bidMsg.text}
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}