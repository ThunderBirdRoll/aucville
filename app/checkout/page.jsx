"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../component/Checkout";
import convertToSubcurrency from "../lib/convert";
import Navbar from "../component/Navbar";

// Don't throw at module scope — that crashes the whole build if the env
// var isn't present at build time. Guard it instead and handle gracefully.
const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const STATUS_META = {
  pending_payment: { label: "Awaiting Payment", color: "#d97706", bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  paid:         { label: "Confirmed",         color: "#1a7a48", bg: "rgba(26,122,72,0.10)",  dot: "#1a7a48" },
  shipped:         { label: "Shipped",           color: "#0369a1", bg: "rgba(14,165,233,0.10)", dot: "#0ea5e9" },
  delivered:       { label: "Delivered",         color: "#0f4527", bg: "rgba(15,69,39,0.10)",   dot: "#145c35" },
  cancelled:       { label: "Cancelled",         color: "#dc2626", bg: "rgba(220,38,38,0.08)",  dot: "#ef4444" },
};

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: m.bg, color: m.color,
      border: `1px solid ${m.color}33`,
      borderRadius: 20, padding: "4px 12px",
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function AddressBlock({ label, address }) {
  if (!address) return null;
  const { addressline1, addressline2, city, state, zip, country } = address;
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#8fada0", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 13, color: "#3d5246", lineHeight: 1.7 }}>
        {addressline1}{addressline2 && `, ${addressline2}`}<br />
        {city}, {state} {zip}<br />
        {country}
      </p>
    </div>
  );
}

function DeliveryEstimateCard({ receiverAddress }) {
  const today = new Date();
  const earliest = new Date(today); earliest.setDate(today.getDate() + 3);
  const latest = new Date(today); latest.setDate(today.getDate() + 5);
  const fmt = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="co-card">
      <div className="co-card-header">
        <h2>Delivery Estimate</h2>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a7a48" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="1.5" />
          <circle cx="18.5" cy="18.5" r="1.5" />
        </svg>
      </div>
      <div className="co-card-body">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: "rgba(26,122,72,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7a48" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0a1f14" }}>
              Estimated 3–5 business days
            </div>
            <div style={{ fontSize: 12.5, color: "#4d7060" }}>
              Arrives between {fmt(earliest)} – {fmt(latest)}
            </div>
          </div>
        </div>

        <hr className="co-divider" />

        <p style={{ fontSize: 12, color: "#6b8a78", lineHeight: 1.65 }}>
          Shipped door-to-door via FedEx Ground{receiverAddress?.city ? ` to ${receiverAddress.city}, ${receiverAddress.state}` : ""}.
          FedEx will pick up from the seller and deliver directly to your address — no need to visit a depot.
          This is an estimate; exact delivery time can vary once the carrier picks up the package.
        </p>
      </div>
    </div>
  );
}

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [shippingPrice, setShippingPrice] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  useEffect(() => {
    if (!orderId) { setError("No order ID provided."); setLoading(false); return; }
    fetch(`/api/orders/info/${orderId}`)
      .then(async (r) => {  const data = await r.json(); if (!r.ok)   throw new Error(data.error || "Something went wrong");; return data; })
      .then(data => { setOrder(data.order); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [orderId]);

  useEffect(() => {
    if (!order?._id) return;
    fetchShippingRate();
  }, [order?._id]);

  function fetchShippingRate() {
    setShippingLoading(true);
    setShippingError(null);
    fetch("/api/fedex/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order._id }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.success) throw new Error(data.error || "Could not calculate shipping.");
        setShippingPrice(Number(data.price));
      })
      .catch((err) => {
        setShippingError(err.message || "Failed to calculate shipping.");
      })
      .finally(() => setShippingLoading(false));
  }

  const itemAmount = order ? Number(order.amount) : 0;
  const totalAmount = shippingPrice != null ? itemAmount + shippingPrice : itemAmount;
  const readyForPayment = !!order && shippingPrice != null && !!stripePromise;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .co-root {
          min-height: 100vh;
          background: #f8fdfb;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          color: #0a1f14;
          position: relative;
          overflow-x: hidden;
        }

        .co-root::before {
          content: '';
          position: fixed; top: -20%; right: -15%;
          width: 70%; height: 80%;
          background: radial-gradient(ellipse at 80% 20%,
            rgba(52,150,100,0.18) 0%,
            rgba(187,237,212,0.07) 55%,
            transparent 72%);
          pointer-events: none; z-index: 0;
        }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #0f4527 0%, #1a7a48 50%, #52B788 100%);
          background-size: 200% 100%;
          animation: barShimmer 5s ease infinite;
          position: relative; z-index: 2;
        }
        @keyframes barShimmer {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        .co-wrap {
          position: relative; z-index: 1;
          max-width: 1040px; margin: 0 auto;
          padding: clamp(28px, 5vw, 52px) clamp(18px, 5vw, 40px);
        }

        .co-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: #1a7a48; font-weight: 500;
          background: none; border: none; cursor: pointer;
          margin-bottom: 28px; padding: 0; font-family: inherit;
          transition: color .15s;
        }
        .co-back:hover { color: #0f4527; }
        .co-back svg { flex-shrink: 0; }

        .co-heading { margin-bottom: 28px; }
        .co-heading h1 {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 700; letter-spacing: -0.5px;
          color: #0a1f14; line-height: 1.1; margin-bottom: 8px;
        }
        .co-heading .sub {
          font-size: 14px; color: #4d7060; font-weight: 400;
        }
        .co-heading .sub span { color: #1a7a48; font-weight: 600; }

        .co-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 720px) { .co-grid { grid-template-columns: 1fr; } }

        .co-card {
          background: #fff;
          border: 1px solid rgba(181,212,195,0.55);
          border-radius: 16px;
          overflow: hidden;
        }
        .co-card-header {
          padding: 18px 22px 14px;
          border-bottom: 1px solid rgba(181,212,195,0.45);
          display: flex; justify-content: space-between; align-items: center;
        }
        .co-card-header h2 {
          font-size: 13px; font-weight: 600;
          color: #0f4527; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .co-card-body { padding: 20px 22px; }

        .co-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 0; }
        .co-row + .co-row { border-top: 1px solid rgba(181,212,195,0.4); }
        .co-row .key { font-size: 13px; color: #4d7060; }
        .co-row .val { font-size: 13px; color: #0a1f14; font-weight: 500; text-align: right; }
        .co-row.total .key { font-size: 15px; font-weight: 700; color: #0a1f14; }
        .co-row.total .val { font-size: 20px; font-weight: 700; color: #145c35; letter-spacing: -0.3px; }

        .co-ship-val { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #0a1f14; font-weight: 500; }
        .co-ship-err { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #dc2626; }
        .co-retry { background: none; border: none; color: #1a7a48; font-size: 11.5px; font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; font-family: inherit; }

        .co-addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 480px) { .co-addr-grid { grid-template-columns: 1fr; } }
        .co-divider { border: none; border-top: 1px solid rgba(181,212,195,0.45); margin: 14px 0; }

        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skel {
          background: linear-gradient(90deg, #eef7f2 25%, #dff0e8 50%, #eef7f2 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .co-spin { animation: spin 1s linear infinite; }

        .co-error {
          text-align: center; padding: 60px 20px;
        }
        .co-error .icon { font-size: 40px; margin-bottom: 12px; }
        .co-error h2 { font-size: 20px; font-weight: 600; color: #0a1f14; margin-bottom: 6px; }
        .co-error p  { font-size: 14px; color: #4d7060; }

        .co-payment-pending {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 48px 20px; text-align: center;
        }
        .co-payment-pending p { font-size: 13px; color: #4d7060; }
      `}</style>

      <div className="co-root">
        <Navbar/>
        <div className="accent-bar" />
        <div className="co-wrap">

          <button className="co-back" onClick={() => router.back()}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to auction
          </button>

          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <div className="co-error">
              <div className="icon">⚠️</div>
              <h2>Couldn't load order</h2>
              <p>{error}</p>
            </div>
          )}

          {order && !loading && (
            <>
              <div className="co-heading">
                <h1>Complete your purchase</h1>
                <p className="sub">
                  Order <span>#{String(order._id).slice(-8).toUpperCase()}</span>
                </p>
              </div>

              <div className="co-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div className="co-card">
                    <div className="co-card-header">
                      <h2>Order Summary</h2>
                      <StatusPill status={order.status} />
                    </div>
                    <div className="co-card-body">
                      <div className="co-row">
                        <span className="key">Item</span>
                        <span className="val">{order.auctionId?.title ?? "Auction item"}</span>
                      </div>
                      <div className="co-row">
                        <span className="key">Winning bid</span>
                        <span className="val">${itemAmount.toFixed(2)}</span>
                      </div>
                     <div className="co-row">
  <span className="key">Shipping</span>
  {shippingLoading ? (
    <span className="co-ship-val">
      <svg className="co-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a7a48" strokeWidth="3">
        <circle cx="12" cy="12" r="10" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      Calculating…
    </span>
  ) : shippingError ? (
    <span className="co-ship-err">
      Unavailable
      <button className="co-retry" onClick={fetchShippingRate}>Retry</button>
    </span>
  ) : shippingPrice != null ? (
    <span className="val">${shippingPrice.toFixed(2)}</span>
  ) : (
    <span className="val">—</span>
  )}
</div>
                      <div className="co-row total">
                        <span className="key">Total due</span>
                        <span className="val">
                          {shippingPrice != null ? `$${totalAmount.toFixed(2)}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DeliveryEstimateCard receiverAddress={order.receiverAddress} />

                  <div className="co-card">
                    <div className="co-card-header">
                      <h2>Addresses</h2>
                    </div>
                    <div className="co-card-body">
                      <div className="co-addr-grid">
                        <AddressBlock label="Ship to"    address={order.receiverAddress} />
                      
                      </div>
                    </div>
                  </div>

                </div>

                <div className="co-card">
                  <div className="co-card-header">
                    <h2>Payment</h2>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a7a48" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="co-card-body">
                    {!stripePromise && (
                      <div className="co-payment-pending">
                        <p style={{ color: "#dc2626" }}>
                          Payments aren't configured (missing Stripe public key). Contact support.
                        </p>
                      </div>
                    )}

                    {stripePromise && !readyForPayment && !shippingError && (
                      <div className="co-payment-pending">
                        <svg className="co-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7a48" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" opacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        <p>Calculating shipping before payment can start…</p>
                      </div>
                    )}

                    {stripePromise && !readyForPayment && shippingError && (
                      <div className="co-payment-pending">
                        <p style={{ color: "#dc2626" }}>{shippingError}</p>
                        <button className="co-retry" onClick={fetchShippingRate}>Try again</button>
                      </div>
                    )}

                    {readyForPayment && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          mode: "payment",
                          amount: convertToSubcurrency(totalAmount),
                          currency: "usd",
                          appearance: {
                            theme: "stripe",
                            variables: {
                              colorPrimary: "#145c35",
                              colorBackground: "#ffffff",
                              colorText: "#0a1f14",
                              colorDanger: "#dc2626",
                              fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
                              borderRadius: "10px",
                              focusBoxShadow: "0 0 0 3px rgba(26,122,72,0.15)",
                            },
                            rules: {
                              ".Input": { border: "1.5px solid #b5d4c3", padding: "12px 14px" },
                              ".Input:focus": { border: "1.5px solid #1a7a48" },
                              ".Label": { color: "#3d5246", fontWeight: "500", fontSize: "13px" },
                            },
                          },
                        }}
                      >
                        <CheckoutForm amount={totalAmount} orderId={order._id} />
                      </Elements>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function LoadingSkeleton() {
  const b = (w, h, mb = 0) => (
    <div className="skel" style={{ width: w, height: h, marginBottom: mb }} />
  );
  return (
    <div>
      {b("180px", "20px", 8)}
      {b("280px", "36px", 28)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="co-card" style={{ padding: 22 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ marginBottom: 14 }}>{b("100%", "18px")}</div>)}
          </div>
          <div className="co-card" style={{ padding: 22 }}>
            {b("100%", "80px")}
          </div>
        </div>
        <div className="co-card" style={{ padding: 22 }}>
          {b("100%", "260px")}
        </div>
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position: 600px 0; }
      }
      .skel {
        background: linear-gradient(90deg, #eef7f2 25%, #dff0e8 50%, #eef7f2 75%);
        background-size: 600px 100%;
        animation: shimmer 1.4s infinite linear;
        border-radius: 8px;
      }
      .co-card {
        background: #fff;
        border: 1px solid rgba(181,212,195,0.55);
        border-radius: 16px;
        overflow: hidden;
      }
    `}</style>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <GlobalStyles />
      <Suspense fallback={<LoadingSkeleton />}>
        <CheckoutPageInner />
      </Suspense>
    </>
  );
}