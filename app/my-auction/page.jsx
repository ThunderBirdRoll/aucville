"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import {
  User, Mail, MapPin, Plus, Gavel, Trophy,
  Clock, CheckCircle, BarChart2, Loader2, AlertCircle,
  ChevronRight, Package, Edit2, Upload, Link, X, ImageIcon
} from "lucide-react";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Real Estate"];

function PlaceOrderButton({ auction }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(auction.orderPlaced ?? false);

  const checkAddressAndOpen = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      const addr = data.address;
      const hasAddress = addr && (addr.addressline1 || addr.city);
      if (!hasAddress) {
        router.push("/address");
        return;
      }
      setAddress(addr);
      setShowConfirm(true);
    } catch {
      alert("Failed to check address.");
    } finally {
      setLoading(false);
    }
  };

 const confirmPlaceOrder = async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId: auction._id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to place order.");
      return;
    }
    setOrdered(true);
    setShowConfirm(false);
    router.push(`/checkout?orderId=${data.order._id}`);
  } catch {
    alert("Failed to place order.");
  } finally {
    setLoading(false);
  }
};

  const goChangeAddress = () => {
    setShowConfirm(false);
    router.push("/address");
  };

  if (ordered) {
    return (
      <button className="addr-btn" disabled style={{ background: "#9CA3AF", cursor: "default" }}>
        Order placed
      </button>
    );
  }

  return (
    <>
      <button className="addr-btn" onClick={checkAddressAndOpen} disabled={loading}>
        {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Place order"}
      </button>
      {showConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
            padding: 16
          }}
          onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
        >
          <div
            style={{
              background: "#ffffff", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%",
              fontFamily: "'DM Sans', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              border: "1px solid #E5E7EB"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "#E7F5EF",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
            }}>
              <MapPin size={20} stroke="#1B3A2D" />
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: "#111827" }}>
              Confirm delivery address
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 400, marginBottom: 18 }}>
              Your order will be shipped to:
            </p>

            <div style={{
              background: "#F9FAFB", borderRadius: 12, padding: "14px 16px",
              fontSize: 13.5, color: "#1F2937", lineHeight: 1.7, marginBottom: 22,
              border: "1px solid #E5E7EB"
            }}>
              {address?.addressline1 && <div>{address.addressline1}</div>}
              {address?.addressline2 && <div>{address.addressline2}</div>}
              <div>{[address?.city, address?.state, address?.zip].filter(Boolean).join(", ")}</div>
              {address?.country && <div>{address.country}</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="addr-btn"
                onClick={confirmPlaceOrder}
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 13.5, color: "#fff", background: "#1B3A2D" }}
              >
                {loading ? "Placing order..." : "Confirm and place order"}
              </button>
              <button
                className="addr-btn addr-btn-edit"
                onClick={goChangeAddress}
                style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 13.5, color: "#374151", background: "#fff", border: "1px solid #D1D5DB" }}
              >
                Use a different address
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  width: "100%", padding: "10px 16px", fontSize: 13, color: "#9CA3AF",
                  background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditAuctionModal({ auction, onClose, onSaved }) {
  const fileRef = useRef(null);
  const toLocalInput = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: auction.title ?? "",
    category: auction.category ?? CATEGORIES[0],
    startingPrice: auction.startingPrice ?? 0,
    endTime: toLocalInput(auction.endTime),
    imageUrl: auction.imageUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [preview, setPreview] = useState(auction.imageUrl ?? "");
  const [imgMode, setImgMode] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function uploadToCloudinary(file) {
    if (!file) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) { setUploadErr("Cloudinary config is missing"); return; }
    if (!file.type.startsWith("image/")) { setUploadErr("Only image files are allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadErr("File size must be under 10MB"); return; }

    setUploading(true); setUploadErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || "Upload failed");
      if (!data.secure_url) throw new Error("No image URL returned from Cloudinary");
      update("imageUrl", data.secure_url);
      setPreview(data.secure_url);
    } catch (e) {
      setUploadErr(e.message || "Network error during upload");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) { setUploadErr("Please select an image file."); return; }
    setPreview(URL.createObjectURL(file));
    uploadToCloudinary(file);
  }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }
  function applyUrl() {
    const url = urlInput.trim(); if (!url) return;
    update("imageUrl", url); setPreview(url); setUrlInput("");
  }
  function clearImage() { setPreview(""); setUrlInput(""); update("imageUrl", ""); }

  const handleSave = async () => {
    if (uploading) { setErr("Please wait for the image upload to finish."); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/auction/edit/${auction._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          startingPrice: Number(form.startingPrice),
          endTime: new Date(form.endTime).toISOString(),
          imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to update auction.");
        return;
      }
      onSaved(data.auction);
      onClose();
    } catch {
      setErr("Failed to update auction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        padding: 16
      }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%",
          fontFamily: "'DM Sans', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid #E5E7EB"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: "#E7F5EF",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
        }}>
          <Gavel size={20} stroke="#1B3A2D" />
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: "#111827" }}>
          Edit auction
        </h3>
        <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 400, marginBottom: 18 }}>
          You can update these details until the auction ends.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Image
            </label>

            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setImgMode("upload")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                  fontSize: 12, fontFamily: "inherit", fontWeight: 400, cursor: "pointer",
                  border: "1px solid #D1D5DB",
                  background: imgMode === "upload" ? "#1B3A2D" : "transparent",
                  color: imgMode === "upload" ? "#D8F0E6" : "#374151",
                  borderColor: imgMode === "upload" ? "#1B3A2D" : "#D1D5DB",
                }}
              >
                <Upload size={12} /> Upload file
              </button>
              <button
                type="button"
                onClick={() => setImgMode("url")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                  fontSize: 12, fontFamily: "inherit", fontWeight: 400, cursor: "pointer",
                  border: "1px solid #D1D5DB",
                  background: imgMode === "url" ? "#1B3A2D" : "transparent",
                  color: imgMode === "url" ? "#D8F0E6" : "#374151",
                  borderColor: imgMode === "url" ? "#1B3A2D" : "#D1D5DB",
                }}
              >
                <Link size={12} /> Paste URL
              </button>
            </div>

            {preview ? (
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#F9FAFB" }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
                  onError={() => { setPreview(""); setUploadErr("Could not load image."); }}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  style={{
                    position: "absolute", top: 8, right: 8, background: "#fff", border: "none",
                    borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : imgMode === "upload" ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `1.5px dashed ${dragOver ? "#52B788" : "#D1D5DB"}`, borderRadius: 12,
                  padding: "20px 16px", textAlign: "center", cursor: "pointer",
                  background: dragOver ? "rgba(82,183,136,0.04)" : "rgba(255,255,255,0.6)",
                }}
              >
                <ImageIcon size={22} stroke="#9CA3AF" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 300 }}>
                  <strong style={{ color: "#52B788", fontWeight: 400 }}>Click to upload</strong> or drag &amp; drop
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && applyUrl()}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    flex: 1, fontFamily: "inherit", fontSize: 13.5, fontWeight: 300,
                    padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                    color: "#111827", outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={applyUrl}
                  style={{
                    background: "#1B3A2D", color: "#fff", border: "none", borderRadius: 10,
                    padding: "0 16px", fontSize: 13, fontWeight: 400, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Apply
                </button>
              </div>
            )}

            {uploading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#52B788", marginTop: 6 }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Uploading…
              </div>
            )}
            {uploadErr && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#EF4444", marginTop: 6 }}>
                <AlertCircle size={12} />{uploadErr}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => update("title", e.target.value)}
              style={{
                width: "100%", fontFamily: "inherit", fontSize: 13.5, fontWeight: 300,
                padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                color: "#111827", outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Category
            </label>
            <select
              value={form.category}
              onChange={e => update("category", e.target.value)}
              style={{
                width: "100%", fontFamily: "inherit", fontSize: 13.5, fontWeight: 300,
                padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                color: "#111827", outline: "none", background: "#fff"
              }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Starting price ($)
            </label>
            <input
              type="number"
              min="1"
              value={form.startingPrice}
              onChange={e => update("startingPrice", e.target.value)}
              style={{
                width: "100%", fontFamily: "inherit", fontSize: 13.5, fontWeight: 300,
                padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                color: "#111827", outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              End time
            </label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={e => update("endTime", e.target.value)}
              style={{
                width: "100%", fontFamily: "inherit", fontSize: 13.5, fontWeight: 300,
                padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10,
                color: "#111827", outline: "none"
              }}
            />
          </div>
        </div>

        {err && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#B91C1C",
            background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px",
            marginBottom: 14
          }}>
            <AlertCircle size={13} /> {err}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            className="addr-btn"
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 13.5, color: "#fff", background: "#1B3A2D" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              width: "100%", padding: "10px 16px", fontSize: 13, color: "#9CA3AF",
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderColor: "rgba(82,183,136,0.4)", background: "rgba(82,183,136,0.04)" } : {}}>
      <div className="stat-icon" style={accent ? { color: "#52B788" } : {}}>{icon}</div>
      <div className="stat-val" style={accent ? { color: "#1B3A2D" } : {}}>{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

function AuctionRow({ auction, type, onAuctionUpdated }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const isLive = type === "owned" ? auction.isLive : false;
  const canEdit = type === "owned" && (isLive || (!isLive && auction.bidsCount === 0));

  return (
    <div className="a-row" onClick={() => router.push(`/auction/${auction._id}`)}>
      <div className="a-img-wrap">
        <img src={auction.imageUrl} alt={auction.title} className="a-img"
          onError={e => { e.target.src = "https://placehold.co/80x80/f3f4f6/9ca3af?text=—"; }} />
        {type === "owned" && (
          <span className={`a-badge ${isLive ? "a-badge-live" : "a-badge-ended"}`}>
            {isLive ? "Live" : "Ended"}
          </span>
        )}
        {type === "won" && (
          <span className="a-badge a-badge-won">Won</span>
        )}
      </div>
      <div className="a-info">
        <div className="a-title">{auction.title}</div>
        <div className="a-meta">
          <span className="a-cat">{auction.category}</span>
          {type === "owned" && (
            <>
              <span className="a-dot" />
              <span className="a-price">${auction.currentPrice?.toLocaleString()}</span>
              <span className="a-dot" />
              <span className="a-bids">{auction.bidsCount} bid{auction.bidsCount !== 1 ? "s" : ""}</span>
            </>
          )}
          {type === "won" && (
            <>
              <span className="a-dot" />
              <span className="a-price" style={{ color: "#1B3A2D" }}>
                Won for ${auction.myWinningAmount?.toLocaleString()}
              </span>
            </>
          )}
        </div>
        <div className="a-end">
          <Clock size={10} />
          {type === "owned" && isLive
            ? `Ends ${new Date(auction.endTime).toLocaleDateString()}`
            : `Ended ${new Date(auction.endTime).toLocaleDateString()}`}
        </div>
      </div>
      {canEdit && (
        <button
          className="addr-btn addr-btn-edit"
          onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
          style={{ flexShrink: 0 }}
        >
          <Edit2 size={12} /> Edit
        </button>
      )}
      {type === "won" && (
        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <PlaceOrderButton auction={auction} />
        </div>
      )}
      <ChevronRight size={14} className="a-arrow" />

      {showEdit && (
        <EditAuctionModal
          auction={auction}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => onAuctionUpdated?.(updated)}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("owned");   // "owned" | "won"
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setTimeout(() => setVisible(true), 60); })
      .catch(() => { setErr("Failed to load profile."); setLoading(false); });
  }, [session, status]);

  const hasAddress = data?.user?.address &&
    (data.user.address.addressline1 || data.user.address.city);

  const handleAuctionUpdated = (updated) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ownedAuctions: prev.ownedAuctions.map(a =>
          String(a._id) === String(updated._id)
            ? {
                ...a,
                title: updated.title,
                category: updated.category,
                startingPrice: updated.startingPrice,
                currentPrice: updated.finalPrice ?? updated.startingPrice,
                endTime: updated.endTime,
                imageUrl: updated.imageUrl ?? a.imageUrl,
                isLive: new Date(updated.endTime) > new Date(),
              }
            : a
        ),
      };
    });
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

        .pf-page{min-height:100vh;background:#fff;font-family:'DM Sans','Helvetica Neue',sans-serif;font-weight:300;position:relative;overflow-x:hidden}
        .pf-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
        .pf-bg-blob{position:absolute;top:-10%;right:-8%;width:55%;height:120%;
          background:radial-gradient(ellipse at 80% 50%,rgba(82,183,136,0.14) 0%,rgba(216,240,230,0.09) 40%,rgba(242,250,246,0.05) 65%,transparent 82%)}

        @keyframes barShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .accent-bar{height:3px;background:linear-gradient(90deg,#1B3A2D 0%,#52B788 55%,#a7f3d0 100%);background-size:200% 100%;animation:barShimmer 5s ease infinite;position:relative;z-index:2}

        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .anim{opacity:0}
        .anim.go{animation:slideUp .48s cubic-bezier(.22,.68,0,1.15) forwards}
        .anim.go.d1{animation-delay:.05s}.anim.go.d2{animation-delay:.12s}.anim.go.d3{animation-delay:.19s}.anim.go.d4{animation-delay:.26s}

        .pf-wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:clamp(28px,5vw,52px) clamp(16px,4vw,40px) 80px}

        .pf-eyebrow{font-size:11px;font-weight:400;color:#52B788;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .pf-title{font-size:clamp(22px,3.5vw,34px);font-weight:400;color:#111827;letter-spacing:-0.4px;line-height:1.1;margin-bottom:28px}

        /* ── Identity card ── */
        .id-card{background:rgba(255,255,255,0.9);border:0.5px solid #E5E7EB;border-radius:18px;padding:22px 24px;backdrop-filter:blur(6px);display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .id-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1B3A2D,#52B788);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .id-avatar-letter{font-size:22px;font-weight:400;color:#fff}
        .id-info{flex:1;min-width:160px}
        .id-name{font-size:18px;font-weight:400;color:#111827;margin-bottom:4px;letter-spacing:-0.2px}
        .id-email{font-size:13px;color:#8A8A8A;display:flex;align-items:center;gap:5px;font-weight:300}

        /* ── Stats row ── */
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .stat-card{background:rgba(255,255,255,0.9);border:0.5px solid #E5E7EB;border-radius:14px;padding:18px 16px;backdrop-filter:blur(6px);text-align:center}
        .stat-icon{color:#6B6B6B;margin-bottom:8px;display:flex;justify-content:center}
        .stat-val{font-size:28px;font-weight:300;color:#111827;letter-spacing:-0.8px;line-height:1;margin-bottom:4px}
        .stat-lbl{font-size:10.5px;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px}

        /* ── Section card ── */
        .section-card{background:rgba(255,255,255,0.9);border:0.5px solid #E5E7EB;border-radius:18px;padding:22px 24px;backdrop-filter:blur(6px)}
        .section-hdr{font-size:11px;font-weight:500;color:#374151;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .section-hdr::after{content:'';flex:1;height:0.5px;background:#E5E7EB}

        /* ── Address block ── */
        .addr-block{display:flex;align-items:flex-start;gap:14px}
        .addr-icon-wrap{width:38px;height:38px;border-radius:10px;background:rgba(82,183,136,0.08);border:0.5px solid rgba(82,183,136,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .addr-text{flex:1}
        .addr-line{font-size:13.5px;color:#111827;font-weight:300;line-height:1.7}
        .addr-missing{font-size:13px;color:#6B6B6B;font-weight:300}
        .addr-btn{display:flex;align-items:center;gap:6px;background:#1B3A2D;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12.5px;font-weight:400;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap;flex-shrink:0}
        .addr-btn:hover{background:#2D6A4F}
        .addr-btn-edit{background:transparent;color:#374151;border:1px solid #2A2A2A}
        .addr-btn-edit:hover{border-color:#8A8A8A;color:#111827;background:transparent}

        /* ── Quick actions ── */
        .quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .quick-btn{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:13px;border:0.5px solid #E5E7EB;background:rgba(255,255,255,0.8);cursor:pointer;font-family:inherit;transition:border-color .15s,box-shadow .15s;text-align:left;text-decoration:none}
        .quick-btn:hover{border-color:#52B788;box-shadow:0 2px 12px rgba(82,183,136,0.1)}
        .quick-btn-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .quick-btn-text{font-size:13.5px;font-weight:400;color:#111827}
        .quick-btn-sub{font-size:11px;color:#6B6B6B;font-weight:300;margin-top:2px}

        /* ── Tabs ── */
        .tabs-wrap{display:flex;gap:6px;border-bottom:0.5px solid #E5E7EB;padding-bottom:0;margin-bottom:16px}
        .tab-btn{padding:9px 18px;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:300;color:#6B6B6B;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-0.5px;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:#1B3A2D;border-bottom-color:#1B3A2D;font-weight:400}
        .tab-count{font-size:10px;background:#F3F4F6;border-radius:20px;padding:1px 7px;color:#6B6B6B}
        .tab-btn.active .tab-count{background:rgba(82,183,136,0.12);color:#2D6A4F}

        /* ── Auction rows ── */
        .a-list{display:flex;flex-direction:column;gap:0}
        .a-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:0.5px solid #F3F4F6;cursor:pointer;transition:background .15s;border-radius:4px}
        .a-row:last-child{border-bottom:none}
        .a-row:hover{background:rgba(82,183,136,0.03)}
        .a-img-wrap{position:relative;flex-shrink:0}
        .a-img{width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;background:#F9FAFB}
        .a-badge{position:absolute;top:-5px;left:-5px;font-size:9px;font-weight:500;border-radius:20px;padding:2px 6px;letter-spacing:0.3px}
        .a-badge-live{background:#1B3A2D;color:#D8F0E6}
        .a-badge-ended{background:#F3F4F6;color:#8A8A8A;border:0.5px solid #E5E7EB}
        .a-badge-won{background:rgba(245,158,11,0.12);color:#B45309;border:0.5px solid rgba(245,158,11,0.3)}
        .a-info{flex:1;min-width:0}
        .a-title{font-size:14px;color:#111827;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
        .a-meta{display:flex;align-items:center;gap:6px;font-size:12px;color:#8A8A8A;flex-wrap:wrap}
        .a-cat{background:#F3F4F6;border-radius:20px;padding:1px 8px;font-size:10.5px;color:#374151}
        .a-dot{width:3px;height:3px;border-radius:50%;background:#2A2A2A}
        .a-price{color:#1B3A2D;font-weight:400}
        .a-bids{color:#6B6B6B}
        .a-end{font-size:10.5px;color:#6B6B6B;display:flex;align-items:center;gap:4px;margin-top:3px}
        .a-arrow{color:#2A2A2A;flex-shrink:0;transition:color .15s}
        .a-row:hover .a-arrow{color:#52B788}

        .empty-state{text-align:center;padding:40px 20px;color:#6B6B6B}
        .empty-icon{margin:0 auto 12px;opacity:0.3}
        .empty-text{font-size:13.5px;font-weight:300}

        .err-banner{display:flex;align-items:center;gap:8px;background:#FEF2F2;border:0.5px solid #FECACA;border-radius:12px;padding:14px 16px;font-size:13px;color:#B91C1C;font-weight:300;margin-bottom:20px}

        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        .sk{background:linear-gradient(90deg,#F3F4F6 25%,#EAECEE 50%,#F3F4F6 75%);background-size:600px 100%;animation:shimmer 1.4s infinite;border-radius:12px}

        @media(max-width:560px){
          .stats-row{grid-template-columns:1fr 1fr}
          .quick-grid{grid-template-columns:1fr}
          .id-card{gap:14px}
        }
        @media(max-width:380px){
          .stats-row{grid-template-columns:1fr}
        }
        @media(prefers-reduced-motion:reduce){
          .anim{opacity:1;animation:none!important}
          .accent-bar{animation:none}
        }
      `}</style>

      <div className="pf-page">
        <Navbar />
        <div className="pf-bg"><div className="pf-bg-blob" /></div>
        <div className="accent-bar" />

        <div className="pf-wrap">
          <div className="pf-eyebrow">Account</div>
          <h1 className="pf-title">My profile</h1>

          {err && (
            <div className="err-banner"><AlertCircle size={15} />{err}</div>
          )}

          {data && (
            <>
              {/* ── Identity ──────────────────────────────────────────────── */}
              <div className={`id-card anim ${visible ? "go d1" : ""}`} style={{ marginBottom: 14 }}>
                <div className="id-avatar">
                  <span className="id-avatar-letter">
                    {data.user.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="id-info">
                  <div className="id-name">{data.user.name}</div>
                  <div className="id-email"><Mail size={12} />{data.user.email}</div>
                </div>
              </div>

              {/* ── Stats ─────────────────────────────────────────────────── */}
              <div className={`stats-row anim ${visible ? "go d2" : ""}`} style={{ marginBottom: 14 }}>
                <StatCard icon={<BarChart2 size={18} />} label="Total Listed" value={data.stats.totalOwned} />
                <StatCard icon={<Clock size={18} />} label="Live" value={data.stats.liveOwned} accent />
                <StatCard icon={<CheckCircle size={18} />} label="Ended" value={data.stats.endedOwned} />
              </div>

              {/* ── Shipping address ──────────────────────────────────────── */}
              <div className={`section-card anim ${visible ? "go d2" : ""}`} style={{ marginBottom: 14 }}>
                <div className="section-hdr"><MapPin size={12} /> Shipping address</div>
                <div className="addr-block">
                  <div className="addr-icon-wrap">
                    <MapPin size={16} stroke="#52B788" />
                  </div>
                  <div className="addr-text">
                    {hasAddress ? (
                      <>
                        {data.user.address.addressline1 && <div className="addr-line">{data.user.address.addressline1}</div>}
                        {data.user.address.addressline2 && <div className="addr-line">{data.user.address.addressline2}</div>}
                        <div className="addr-line">
                          {[data.user.address.city, data.user.address.state, data.user.address.zip].filter(Boolean).join(", ")}
                        </div>
                        {data.user.address.country && <div className="addr-line">{data.user.address.country}</div>}
                      </>
                    ) : (
                      <div className="addr-missing">No shipping address saved yet.</div>
                    )}
                  </div>
                  <button
                    className={`addr-btn ${hasAddress ? "addr-btn-edit" : ""}`}
                    onClick={() => router.push("/address")}
                  >
                    {hasAddress ? "Edit" : <><Plus size={12} /> Add address</>}
                  </button>
                </div>
              </div>

              {/* ── Quick actions ─────────────────────────────────────────── */}
              <div className={`section-card anim ${visible ? "go d3" : ""}`} style={{ marginBottom: 14 }}>
                <div className="section-hdr"><Gavel size={12} /> Quick actions</div>
                <div className="quick-grid">
                  <button className="quick-btn" onClick={() => router.push("/create-auction")}>
                    <div className="quick-btn-icon" style={{ background: "rgba(27,58,45,0.08)" }}>
                      <Plus size={18} stroke="#1B3A2D" />
                    </div>
                    <div>
                      <div className="quick-btn-text">Create auction</div>
                      <div className="quick-btn-sub">List a new item for bidding</div>
                    </div>
                  </button>
                  <button className="quick-btn" onClick={() => router.push("/address")}>
                    <div className="quick-btn-icon" style={{ background: "rgba(82,183,136,0.08)" }}>
                      <Package size={18} stroke="#52B788" />
                    </div>
                    <div>
                      <div className="quick-btn-text">Shipping address</div>
                      <div className="quick-btn-sub">{hasAddress ? "Update your address" : "Add your delivery address"}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Auction tabs ──────────────────────────────────────────── */}
              <div className={`section-card anim ${visible ? "go d4" : ""}`}>
                <div className="tabs-wrap">
                  <button
                    className={`tab-btn ${tab === "owned" ? "active" : ""}`}
                    onClick={() => setTab("owned")}
                  >
                    <Gavel size={12} /> My auctions
                    <span className="tab-count">{data.ownedAuctions.length}</span>
                  </button>
                  <button
                    className={`tab-btn ${tab === "won" ? "active" : ""}`}
                    onClick={() => setTab("won")}
                  >
                    <Trophy size={12} /> Wins
                    <span className="tab-count">{data.wonAuctions.length}</span>
                  </button>
                </div>

                {tab === "owned" && (
                  <div className="a-list">
                    {data.ownedAuctions.length === 0 ? (
                      <div className="empty-state">
                        <Gavel size={32} className="empty-icon" />
                        <div className="empty-text">You haven't listed any auctions yet.</div>
                      </div>
                    ) : (
                      data.ownedAuctions.map(a => (
                        <AuctionRow key={a._id} auction={a} type="owned" onAuctionUpdated={handleAuctionUpdated} />
                      ))
                    )}
                  </div>
                )}

                {tab === "won" && (
                  <div className="a-list">
                    {data.wonAuctions.length === 0 ? (
                      <div className="empty-state">
                        <Trophy size={32} className="empty-icon" />
                        <div className="empty-text">No wins yet — go place some bids!</div>
                      </div>
                    ) : (
                      data.wonAuctions.map(a => (
                        <AuctionRow key={a._id} auction={a} type="won" />
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}