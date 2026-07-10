"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import {
  Mail, MapPin, Package, Truck, CheckCircle, Clock,
  Loader2, AlertCircle, ChevronRight, X, ArrowUpRight, ArrowDownLeft,
  Hash, CreditCard
} from "lucide-react";

const STATUS_FLOW = ["pending_payment", "paid", "labelled", "pickup_scheduled", "shipped", "delivered"];

const STATUS_META = {
  pending_payment: { label: "Pending Payment", icon: Clock, color: "#B45309", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  paid: { label: "Paid", icon: CreditCard, color: "#1D4ED8", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
  labelled: { label: "Labelled", icon: Package, color: "#0369A1", bg: "rgba(3,105,161,0.08)", border: "rgba(3,105,161,0.25)" },
  pickup_scheduled: { label: "Pickup Scheduled", icon: Truck, color: "#6D28D9", bg: "rgba(109,40,217,0.08)", border: "rgba(109,40,217,0.25)" },
  shipped: { label: "Shipped", icon: Truck, color: "#1D4ED8", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "#1B3A2D", bg: "rgba(82,183,136,0.1)", border: "rgba(82,183,136,0.3)" },
  cancelled: { label: "Cancelled", icon: X, color: "#B91C1C", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending_payment;
  const Icon = meta.icon;
  return (
    <span className="status-badge" style={{ color: meta.color, background: meta.bg, border: `0.5px solid ${meta.border}` }}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function AddressBlock({ address }) {
  if (!address || (!address.addressline1 && !address.city)) {
    return <div className="addr-empty">No address on file</div>;
  }
  return (
    <div className="addr-text">
      {address.addressline1 && <div>{address.addressline1}</div>}
      {address.addressline2 && <div>{address.addressline2}</div>}
      <div>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</div>
      {address.country && <div>{address.country}</div>}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="info-row-label"><Icon size={11} />{label}</span>
      <span className={`info-row-value ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function OrderCard({ order, role }) {
  const auction = order.auctionId;
  const isSender = role === "sender";

  async function downloadLabel() {
    try {
      const res = await fetch(`/api/orders/${order._id}/label`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to download label");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shipping-label-${order._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading label");
    }
  }

  return (
    <div className="order-card">
      {/* ── Head ── */}
      <div className="order-head">
        <div className="order-head-left">
          <img
            src={auction?.imageUrl}
            alt={auction?.title}
            className="order-img"
            onError={e => { e.target.src = "https://placehold.co/64x64/f3f4f6/9ca3af?text=—"; }}
          />
          <div>
            <div className="order-title">{auction?.title ?? "Untitled item"}</div>
            <div className="order-sub">
              {isSender ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
              {isSender ? "You are shipping this" : "Shipping to you"}
            </div>
          </div>
        </div>
        <div className="order-head-right">
          <div className="order-amount">${order.amount?.toLocaleString()}</div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* ── Transaction info ── */}
      <div className="info-block">

        <InfoRow icon={Hash} label="Tracking No." value={order.trackingNumber} mono />
        <InfoRow icon={Package} label="Order amount" value={order.amount != null ? `$${order.amount.toLocaleString()}` : null} />
        {order.shippingAmount != null && (
          <InfoRow icon={Truck} label="Shipping" value={`$${order.shippingAmount.toLocaleString()}`} />
        )}
        {order.totalAmount != null && (
          <InfoRow icon={CreditCard} label="Total" value={`$${order.totalAmount.toLocaleString()}`} />
        )}
      </div>

      {/* ── Addresses (read-only for both sides) ── */}
      <div className="order-body">
        <div className="addr-col">
          <div className="addr-col-hdr"><MapPin size={12} />
            {isSender ? "Ship from (your address)" : "Ship from (seller)"}
          </div>
          <AddressBlock address={order.senderAddress} />
        </div>
        <div className="addr-col">
          <div className="addr-col-hdr"><MapPin size={12} />
            {isSender ? "Ship to (buyer)" : "Ship to (your address)"}
          </div>
          <AddressBlock address={order.receiverAddress} />
        </div>
      </div>

      {/* ── Buyer notice ── */}
      {isSender && order.hasLabel && (
        <button className="download-label-btn" onClick={downloadLabel}>
          <Package size={12} /> Download shipping label (PDF)
        </button>
      )}
      {!isSender && (
        <div className="order-locked">
          <Package size={12} /> This order is managed by the seller
        </div>
      )}



    </div>
  );
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();


  const [sentOrders, setSentOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("sender");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    fetch("/api/orders/mine")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErr(d.error); }
        else {
          setSentOrders(d.sentOrders ?? []);
          setReceivedOrders(d.receivedOrders ?? []);
        }
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      })
      .catch(() => { setErr("Failed to load orders."); setLoading(false); });
  }, [session, status]);

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <Loader2 size={28} stroke="#52B788" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#fff}

        .ord-page{min-height:100vh;background:#fff;font-family:'DM Sans','Helvetica Neue',sans-serif;font-weight:300;position:relative;overflow-x:hidden}
        .ord-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
        .ord-bg-blob{position:absolute;top:-10%;right:-8%;width:55%;height:120%;
          background:radial-gradient(ellipse at 80% 50%,rgba(82,183,136,0.14) 0%,rgba(216,240,230,0.09) 40%,rgba(242,250,246,0.05) 65%,transparent 82%)}

        @keyframes barShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .accent-bar{height:3px;background:linear-gradient(90deg,#1B3A2D 0%,#52B788 55%,#a7f3d0 100%);background-size:200% 100%;animation:barShimmer 5s ease infinite;position:relative;z-index:2}

        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .anim{opacity:0}
        .anim.go{animation:slideUp .48s cubic-bezier(.22,.68,0,1.15) forwards}
        .anim.go.d1{animation-delay:.05s}
.download-label-btn {
  display: flex; align-items: center; gap: 6px;
  width: 100%; margin-top: 14px;
  background: #1B3A2D; color: #fff; border: none;
  border-radius: 10px; padding: 10px 16px;
  font-size: 12.5px; font-weight: 400; font-family: inherit;
  cursor: pointer; justify-content: center;
  transition: background .15s;
}
.download-label-btn:hover { background: #2D6A4F; }
        .ord-wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:clamp(28px,5vw,52px) clamp(16px,4vw,40px) 80px}
        .ord-eyebrow{font-size:11px;font-weight:400;color:#52B788;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .ord-title{font-size:clamp(22px,3.5vw,34px);font-weight:400;color:#111827;letter-spacing:-0.4px;line-height:1.1;margin-bottom:28px}

        .tabs-wrap{display:flex;gap:6px;border-bottom:0.5px solid #E5E7EB;margin-bottom:20px}
        .tab-btn{padding:9px 18px;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:300;color:#6B6B6B;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-0.5px;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:#1B3A2D;border-bottom-color:#1B3A2D;font-weight:400}
        .tab-count{font-size:10px;background:#F3F4F6;border-radius:20px;padding:1px 7px;color:#6B6B6B}
        .tab-btn.active .tab-count{background:rgba(82,183,136,0.12);color:#2D6A4F}

        .order-list{display:flex;flex-direction:column;gap:14px}
        .order-card{background:rgba(255,255,255,0.9);border:0.5px solid #E5E7EB;border-radius:18px;padding:20px 22px;backdrop-filter:blur(6px)}

        .order-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;flex-wrap:wrap}
        .order-head-left{display:flex;align-items:center;gap:12px;min-width:0}
        .order-img{width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0;background:#F9FAFB}
        .order-title{font-size:14.5px;color:#111827;font-weight:400;margin-bottom:3px}
        .order-sub{font-size:11px;color:#8A8A8A;font-weight:300;display:flex;align-items:center;gap:4px}
        .order-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
        .order-amount{font-size:16px;color:#1B3A2D;font-weight:400}
        .status-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:400;border-radius:20px;padding:3px 10px}

        /* ── Transaction info block ── */
        .info-block{display:flex;flex-direction:column;gap:7px;padding:13px 0;border-top:0.5px solid #F3F4F6}
        .info-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .info-row-label{display:flex;align-items:center;gap:5px;font-size:11.5px;color:#9CA3AF;font-weight:400;white-space:nowrap}
        .info-row-value{font-size:12px;color:#374151;font-weight:300;text-align:right;word-break:break-all}
        .info-row-value.mono{font-family:'Courier New',monospace;font-size:11.5px;color:#1B3A2D}

        .order-body{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:14px 0;border-top:0.5px solid #F3F4F6}
        .addr-col-hdr{font-size:10.5px;font-weight:500;color:#374151;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px}
        .addr-text{font-size:13px;color:#374151;font-weight:300;line-height:1.7}
        .addr-empty{font-size:12.5px;color:#9CA3AF;font-weight:300;font-style:italic}

        .order-locked{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#9CA3AF;font-weight:300;padding-top:14px}

        .empty-state{text-align:center;padding:50px 20px;color:#6B6B6B}
        .empty-icon{margin:0 auto 12px;opacity:0.3}
        .empty-text{font-size:13.5px;font-weight:300}

        .err-banner{display:flex;align-items:center;gap:8px;background:#FEF2F2;border:0.5px solid #FECACA;border-radius:12px;padding:14px 16px;font-size:13px;color:#B91C1C;font-weight:300;margin-bottom:20px}

        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:560px){
          .order-body{grid-template-columns:1fr}
          .order-head-right{align-items:flex-start;flex-direction:row;width:100%;justify-content:space-between}
          .info-row-value{max-width:60%}
        }
        @media(prefers-reduced-motion:reduce){
          .anim{opacity:1;animation:none!important}
          .accent-bar{animation:none}
        }
      `}</style>

      <div className="ord-page">
        <Navbar />
        <div className="ord-bg"><div className="ord-bg-blob" /></div>
        <div className="accent-bar" />

        <div className="ord-wrap">
          <div className="ord-eyebrow">Account</div>
          <h1 className="ord-title">Orders</h1>

          {err && <div className="err-banner"><AlertCircle size={15} />{err}</div>}

          <div className={`anim ${visible ? "go d1" : ""}`}>
            <div className="tabs-wrap">
              <button className={`tab-btn ${tab === "sender" ? "active" : ""}`} onClick={() => setTab("sender")}>
                <ArrowUpRight size={12} /> Selling
                <span className="tab-count">{sentOrders.length}</span>
              </button>
              <button className={`tab-btn ${tab === "buyer" ? "active" : ""}`} onClick={() => setTab("buyer")}>
                <ArrowDownLeft size={12} /> Buying
                <span className="tab-count">{receivedOrders.length}</span>
              </button>
            </div>

            {tab === "sender" && (
              <div className="order-list">
                {sentOrders.length === 0
                  ? <div className="empty-state"><Package size={32} className="empty-icon" /><div className="empty-text">No orders to ship yet.</div></div>
                  : sentOrders.map(o => <OrderCard key={o._id} order={o} role="sender" />)
                }
              </div>
            )}

            {tab === "buyer" && (
              <div className="order-list">
                {receivedOrders.length === 0
                  ? <div className="empty-state"><Package size={32} className="empty-icon" /><div className="empty-text">No orders placed yet.</div></div>
                  : receivedOrders.map(o => <OrderCard key={o._id} order={o} role="buyer" />)
                }
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}