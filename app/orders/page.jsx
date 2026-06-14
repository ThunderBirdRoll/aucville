"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import {
  Mail, MapPin, Package, Truck, CheckCircle, Clock,
  Loader2, AlertCircle, ChevronRight, Edit2, X, ArrowUpRight, ArrowDownLeft
} from "lucide-react";

const STATUS_FLOW = ["pending", "shipped", "delivered"];

const STATUS_META = {
  pending:   { label: "Pending",   icon: Clock,       color: "#B45309", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)" },
  shipped:   { label: "Shipped",   icon: Truck,       color: "#1D4ED8", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "#1B3A2D", bg: "rgba(82,183,136,0.1)",  border: "rgba(82,183,136,0.3)" },
  cancelled: { label: "Cancelled", icon: X,           color: "#B91C1C", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className="status-badge" style={{ color: meta.color, background: meta.bg, border: `0.5px solid ${meta.border}` }}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function AddressBlock({ address, empty }) {
  if (empty || !address || (!address.addressline1 && !address.city)) {
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

function AddressEditForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    addressline1: initial?.addressline1 ?? "",
    addressline2: initial?.addressline2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zip: initial?.zip ?? "",
    country: initial?.country ?? "",
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="addr-edit-form">
      <input className="addr-input" placeholder="Address line 1" value={form.addressline1} onChange={e => update("addressline1", e.target.value)} />
      <input className="addr-input" placeholder="Address line 2 (optional)" value={form.addressline2} onChange={e => update("addressline2", e.target.value)} />
      <div className="addr-input-row">
        <input className="addr-input" placeholder="City" value={form.city} onChange={e => update("city", e.target.value)} />
        <input className="addr-input" placeholder="State" value={form.state} onChange={e => update("state", e.target.value)} />
      </div>
      <div className="addr-input-row">
        <input className="addr-input" placeholder="ZIP / postal code" value={form.zip} onChange={e => update("zip", e.target.value)} />
        <input className="addr-input" placeholder="Country" value={form.country} onChange={e => update("country", e.target.value)} />
      </div>
      <div className="addr-edit-actions">
        <button className="ord-btn ord-btn-primary" disabled={saving} onClick={() => onSave(form)}>
          {saving ? "Saving..." : "Save address"}
        </button>
        <button className="ord-btn ord-btn-ghost" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, role, onUpdate }) {
  const [editingAddr, setEditingAddr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const auction = order.auctionId;
  const isSender = role === "sender";

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  const canEditAddress = isSender && order.status === "pending";
  const canAdvanceStatus = isSender && order.status !== "delivered" && order.status !== "cancelled" && nextStatus;

  const patchOrder = async (body) => {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Update failed.");
        return false;
      }
      onUpdate(data.order);
      return true;
    } catch {
      setErr("Update failed.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = () => {
    if (!nextStatus) return;
    patchOrder({ status: nextStatus });
  };

  const handleAddressSave = async (form) => {
    const ok = await patchOrder({ senderAddress: form });
    if (ok) setEditingAddr(false);
  };

  return (
    <div className="order-card">
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

      <div className="order-body">
        <div className="addr-col">
          <div className="addr-col-hdr">
            <MapPin size={12} />
            {isSender ? "Ship from (your address)" : "Ship to (your address)"}
          </div>
          {editingAddr ? (
            <AddressEditForm
              initial={order.senderAddress}
              saving={saving}
              onCancel={() => setEditingAddr(false)}
              onSave={handleAddressSave}
            />
          ) : (
            <>
              <AddressBlock address={isSender ? order.senderAddress : order.receiverAddress} />
              {canEditAddress && (
                <button className="addr-edit-link" onClick={() => setEditingAddr(true)}>
                  <Edit2 size={11} /> Edit address
                </button>
              )}
            </>
          )}
        </div>

        <div className="addr-col">
          <div className="addr-col-hdr">
            <MapPin size={12} />
            {isSender ? "Ship to (buyer)" : "Ship from (seller)"}
          </div>
          <AddressBlock address={isSender ? order.receiverAddress : order.senderAddress} />
        </div>
      </div>

      {err && <div className="order-err"><AlertCircle size={12} />{err}</div>}

      {canAdvanceStatus && !editingAddr && (
        <div className="order-actions">
          <button className="ord-btn ord-btn-primary" disabled={saving} onClick={handleAdvance}>
            {saving ? "Updating..." : `Mark as ${STATUS_META[nextStatus].label.toLowerCase()}`}
          </button>
        </div>
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
  const [tab, setTab] = useState("sender"); // "sender" | "buyer"
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

  const updateSentOrder = (updated) => {
    setSentOrders(prev => prev.map(o => o._id === updated._id ? { ...o, ...updated } : o));
  };

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
        .anim.go.d1{animation-delay:.05s}.anim.go.d2{animation-delay:.12s}

        .ord-wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:clamp(28px,5vw,52px) clamp(16px,4vw,40px) 80px}

        .ord-eyebrow{font-size:11px;font-weight:400;color:#52B788;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .ord-title{font-size:clamp(22px,3.5vw,34px);font-weight:400;color:#111827;letter-spacing:-0.4px;line-height:1.1;margin-bottom:28px}

        /* ── Tabs ── */
        .tabs-wrap{display:flex;gap:6px;border-bottom:0.5px solid #E5E7EB;padding-bottom:0;margin-bottom:20px}
        .tab-btn{padding:9px 18px;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:300;color:#6B6B6B;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-0.5px;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:#1B3A2D;border-bottom-color:#1B3A2D;font-weight:400}
        .tab-count{font-size:10px;background:#F3F4F6;border-radius:20px;padding:1px 7px;color:#6B6B6B}
        .tab-btn.active .tab-count{background:rgba(82,183,136,0.12);color:#2D6A4F}

        /* ── Order card ── */
        .order-list{display:flex;flex-direction:column;gap:14px}
        .order-card{background:rgba(255,255,255,0.9);border:0.5px solid #E5E7EB;border-radius:18px;padding:20px 22px;backdrop-filter:blur(6px)}

        .order-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;flex-wrap:wrap}
        .order-head-left{display:flex;align-items:center;gap:12px;min-width:0}
        .order-img{width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0;background:#F9FAFB}
        .order-title{font-size:14.5px;color:#111827;font-weight:400;margin-bottom:3px}
        .order-sub{font-size:11px;color:#8A8A8A;font-weight:300;display:flex;align-items:center;gap:4px}
        .order-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
        .order-amount{font-size:16px;color:#1B3A2D;font-weight:400}

        .status-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:400;border-radius:20px;padding:3px 10px}

        .order-body{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px 0;border-top:0.5px solid #F3F4F6;border-bottom:0.5px solid #F3F4F6}
        .addr-col-hdr{font-size:10.5px;font-weight:500;color:#374151;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px}
        .addr-text{font-size:13px;color:#374151;font-weight:300;line-height:1.7}
        .addr-empty{font-size:12.5px;color:#9CA3AF;font-weight:300;font-style:italic}

        .addr-edit-link{display:inline-flex;align-items:center;gap:5px;background:transparent;border:none;color:#52B788;font-size:11.5px;font-weight:400;cursor:pointer;font-family:inherit;margin-top:8px;padding:0}
        .addr-edit-link:hover{color:#1B3A2D}

        .addr-edit-form{display:flex;flex-direction:column;gap:8px}
        .addr-input{font-family:inherit;font-size:12.5px;font-weight:300;padding:8px 10px;border:0.5px solid #E5E7EB;border-radius:8px;background:#fff;color:#111827;width:100%;outline:none;transition:border-color .15s}
        .addr-input:focus{border-color:#52B788}
        .addr-input-row{display:flex;gap:8px}
        .addr-input-row .addr-input{flex:1}
        .addr-edit-actions{display:flex;gap:8px;margin-top:4px}

        .ord-btn{font-family:inherit;font-size:12.5px;font-weight:400;border-radius:9px;padding:8px 16px;cursor:pointer;transition:background .15s,border-color .15s;border:none}
        .ord-btn-primary{background:#1B3A2D;color:#fff}
        .ord-btn-primary:hover{background:#2D6A4F}
        .ord-btn-primary:disabled{opacity:0.6;cursor:default}
        .ord-btn-ghost{background:transparent;color:#6B6B6B;border:0.5px solid #E5E7EB}
        .ord-btn-ghost:hover{color:#374151;border-color:#D1D5DB}

        .order-actions{display:flex;justify-content:flex-end;padding-top:14px}
        .order-locked{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#9CA3AF;font-weight:300;padding-top:14px}

        .order-err{display:flex;align-items:center;gap:6px;font-size:12px;color:#B91C1C;font-weight:300;padding-top:12px}

        .empty-state{text-align:center;padding:50px 20px;color:#6B6B6B}
        .empty-icon{margin:0 auto 12px;opacity:0.3}
        .empty-text{font-size:13.5px;font-weight:300}

        .err-banner{display:flex;align-items:center;gap:8px;background:#FEF2F2;border:0.5px solid #FECACA;border-radius:12px;padding:14px 16px;font-size:13px;color:#B91C1C;font-weight:300;margin-bottom:20px}

        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:560px){
          .order-body{grid-template-columns:1fr}
          .order-head-right{align-items:flex-start;flex-direction:row;width:100%;justify-content:space-between}
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

          {err && (
            <div className="err-banner"><AlertCircle size={15} />{err}</div>
          )}

          <div className={`anim ${visible ? "go d1" : ""}`}>
            <div className="tabs-wrap">
              <button
                className={`tab-btn ${tab === "sender" ? "active" : ""}`}
                onClick={() => setTab("sender")}
              >
                <ArrowUpRight size={12} /> Selling
                <span className="tab-count">{sentOrders.length}</span>
              </button>
              <button
                className={`tab-btn ${tab === "buyer" ? "active" : ""}`}
                onClick={() => setTab("buyer")}
              >
                <ArrowDownLeft size={12} /> Buying
                <span className="tab-count">{receivedOrders.length}</span>
              </button>
            </div>

            {tab === "sender" && (
              <div className="order-list">
                {sentOrders.length === 0 ? (
                  <div className="empty-state">
                    <Package size={32} className="empty-icon" />
                    <div className="empty-text">No orders to ship yet.</div>
                  </div>
                ) : (
                  sentOrders.map(o => (
                    <OrderCard key={o._id} order={o} role="sender" onUpdate={updateSentOrder} />
                  ))
                )}
              </div>
            )}

            {tab === "buyer" && (
              <div className="order-list">
                {receivedOrders.length === 0 ? (
                  <div className="empty-state">
                    <Package size={32} className="empty-icon" />
                    <div className="empty-text">No orders placed yet.</div>
                  </div>
                ) : (
                  receivedOrders.map(o => (
                    <OrderCard key={o._id} order={o} role="buyer" onUpdate={() => {}} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}