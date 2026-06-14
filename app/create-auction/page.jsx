"use client";
import React, { useState, useRef, useEffect } from "react";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Upload, Link, X, ImageIcon, Package, Clock, Tag,
    DollarSign, Type, ChevronDown, CheckCircle, Loader2,
    AlertCircle, MapPin
} from "lucide-react";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Real Estate", "Vehicles"];

// ── Blocker modal ──────────────────────────────────────────────────────────────
function BlockerModal({ reason, onLogin, onAddAddress }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.40)", backdropFilter: "blur(5px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, fontFamily: "'DM Sans', sans-serif",
        }}>
            <div style={{
                background: "#fff",
                border: "0.5px solid #D1D5DB",
                borderRadius: 20,
                padding: "40px 32px",
                maxWidth: 400, width: "100%",
                textAlign: "center",
                boxShadow: "0 32px 80px rgba(0,0,0,0.14)",
            }}>
                {/* Icon */}
                <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(82,183,136,0.12)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 20px",
                }}>
                    <MapPin size={26} stroke="#52B788" />
                </div>

                {/* Heading */}
                <div style={{ fontSize: 20, fontWeight: 400, color: "#111827", marginBottom: 8 }}>
                    {reason === "not-logged-in"
                        ? "Sign in required"
                        : "Shipping address missing"}
                </div>

                {/* Body */}
                <div style={{ fontSize: 13.5, color: "#6B7280", fontWeight: 300, lineHeight: 1.65, marginBottom: 28 }}>
                    {reason === "not-logged-in"
                        ? "Please log in to create an auction listing."
                        : "You need a shipping address on your account before you can list an item for sale."}
                </div>

                {/* CTA(s) */}
                {reason === "not-logged-in" ? (
                    <button onClick={onLogin} style={{
                        width: "100%", background: "#1B3A2D", color: "#fff",
                        border: "none", borderRadius: 12, padding: "13px 0",
                        fontSize: 14, fontWeight: 400, cursor: "pointer",
                        fontFamily: "inherit", transition: "background .15s",
                    }}>
                        Go to login
                    </button>
                ) : (
                    <>
                        <button onClick={onAddAddress} style={{
                            width: "100%", background: "#1B3A2D", color: "#fff",
                            border: "none", borderRadius: 12, padding: "13px 0",
                            fontSize: 14, fontWeight: 400, cursor: "pointer",
                            fontFamily: "inherit", marginBottom: 10,
                        }}>
                            Add shipping address
                        </button>
                        <button onClick={onLogin} style={{
                            width: "100%", background: "transparent", color: "#374151",
                            border: "1px solid #D1D5DB", borderRadius: 12, padding: "12px 0",
                            fontSize: 13.5, fontWeight: 300, cursor: "pointer",
                            fontFamily: "inherit",
                        }}>
                            Log in with a different account
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CreateAuction() {
    const fileRef = useRef(null);
    const router = useRouter();
    const { data: session, status } = useSession();
   


    // "not-logged-in" | "no-address" | null
    const [blocker, setBlocker] = useState(null);
    const [checkingAddress, setCheckingAddress] = useState(true);

    const [form, setForm] = useState({
        title: "", imageUrl: "", price: "", category: "",
        endTime: "", weight: "", length: "", width: "", height: "",
    });
    const [endDate, setEndDate] = useState("");
    const [endTimeOfDay, setEndTimeOfDay] = useState("");
    const [imgMode, setImgMode] = useState("upload");
    const [urlInput, setUrlInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadErr, setUploadErr] = useState("");
    const [preview, setPreview] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Session + address check ──────────────────────────────────────────────
    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            setBlocker("not-logged-in");
            setCheckingAddress(false);
            return;
        }

        async function checkAddress() {
            try {
                const res = await fetch("/api/user/me");
                const data = await res.json();
                const addr = data.address;
                const hasAddress = addr && (addr.addressline1 || addr.city || addr.zip);
                if (!hasAddress) setBlocker("no-address");
            } catch {
                setBlocker("no-address");   // fail safe
            } finally {
                setCheckingAddress(false);
            }
        }
        checkAddress();
    }, [session, status]);

    // ── Cloudinary upload ────────────────────────────────────────────────────
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
            setForm(f => ({ ...f, imageUrl: data.secure_url }));
            setPreview(data.secure_url);
        } catch (err) {
            setUploadErr(err.message || "Network error during upload");
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
        setForm(f => ({ ...f, imageUrl: url })); setPreview(url); setUrlInput("");
    }
    function clearImage() { setPreview(""); setUrlInput(""); setForm(f => ({ ...f, imageUrl: "" })); }
    function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

    function updateEndDateTime(date, time) {
        setEndDate(date); setEndTimeOfDay(time);
        if (date && time) { setForm(f => ({ ...f, endTime: new Date(`${date}T${time}`).toISOString() })); }
        else { setForm(f => ({ ...f, endTime: "" })); }
    }

    function validate() {
        const e = {};
        if (!form.title.trim()) e.title = "Title is required";
        if (!form.imageUrl) e.imageUrl = "Upload or paste an image";
        if (!form.price || parseFloat(form.price) <= 0) e.price = "Starting price must be greater than 0";
        if (!form.category) e.category = "Select a category";
        if (!form.endTime) e.endTime = "Select an end date and time";
        const w = parseFloat(form.weight), l = parseFloat(form.length),
            wi = parseFloat(form.width), h = parseFloat(form.height);
        if (!form.weight || isNaN(w) || w < 0.1 || w > 50) e.weight = "Weight must be 0.1–50 lbs";
        if (!form.length || isNaN(l) || l <= 0 || l > 60) e.length = "Length must be 0.1–60 in";
        if (!form.width || isNaN(wi) || wi <= 0 || wi > 30) e.width = "Width must be 0.1–30 in";
        if (!form.height || isNaN(h) || h <= 0 || h > 30) e.height = "Height must be 0.1–30 in";
        if (!e.length && !e.width && !e.height) {
            const girth = l + 2 * wi + 2 * h;
            if (girth > 130) e.length = `Girth (L + 2W + 2H = ${girth}″) exceeds 130″`;
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setSubmitting(true); setSubmitErr("");
        try {
            const res = await fetch("/api/auction/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title, imageUrl: form.imageUrl,
                    startingPrice: parseFloat(form.price),
                    category: form.category, endTime: form.endTime,
                    packageDetails: {
                        weight: parseFloat(form.weight), length: parseFloat(form.length),
                        width: parseFloat(form.width), height: parseFloat(form.height),
                    },
                    owner: session?.user?.id || null,   // replace with user ID if available
                }),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `Server error ${res.status}`); }
            setSubmitted(true);
        } catch (err) {
            setSubmitErr(err.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function reset() {
        setForm({ title: "", imageUrl: "", price: "", category: "", endTime: "", weight: "", length: "", width: "", height: "" });
        setPreview(""); setUrlInput(""); setErrors({}); setSubmitErr(""); setSubmitted(false); setEndDate(""); setEndTimeOfDay("");
    }

    // ── Global loading ───────────────────────────────────────────────────────
    if (status === "loading" || checkingAddress) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
            <Loader2 size={28} stroke="#52B788" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (submitted) return (
        <>
            <Navbar />
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", background: "#fff" }}>
                <div style={{ textAlign: "center", padding: "40px 24px" }}>
                    <CheckCircle size={52} stroke="#52B788" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 22, fontWeight: 300, color: "#111827", marginBottom: 8 }}>Auction created</div>
                    <div style={{ fontSize: 14, color: "#374151", fontWeight: 300 }}>Your item is now live for bidding.</div>
                    <button onClick={reset} style={{ marginTop: 28, background: "#1B3A2D", color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
                        Create another
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ca-page { min-height:100vh; background:#ffffff; font-family:'DM Sans','Helvetica Neue',sans-serif; font-weight:300; position:relative; overflow:hidden; }
        .ca-bg { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .ca-bg-green { position:absolute; top:-10%; right:-8%; width:55%; height:120%; background:radial-gradient(ellipse at 80% 50%, rgba(82,183,136,0.16) 0%, rgba(216,240,230,0.12) 40%, rgba(242,250,246,0.07) 65%, transparent 82%); }
        .ca-wrap { position:relative; z-index:1; max-width:720px; margin:0 auto; padding:clamp(32px,6vw,60px) clamp(16px,5vw,40px) 60px; }
        .ca-eyebrow { font-size:11px; font-weight:400; color:#52B788; letter-spacing:1.2px; text-transform:uppercase; margin-bottom:8px; }
        .ca-title   { font-size:clamp(24px,4vw,38px); font-weight:400; color:#111827; letter-spacing:-0.5px; line-height:1.1; margin-bottom:6px; }
        .ca-sub     { font-size:13.5px; color:#374151; font-weight:300; margin-bottom:32px; }
        .ca-section { background:rgba(255,255,255,0.88); border:0.5px solid #D1D5DB; border-radius:16px; padding:24px; margin-bottom:16px; backdrop-filter:blur(6px); }
        .ca-section-label { font-size:11px; font-weight:500; color:#374151; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:18px; display:flex; align-items:center; gap:8px; }
        .ca-field { margin-bottom:16px; }
        .ca-field:last-child { margin-bottom:0; }
        .ca-label { display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:400; color:#1F2937; margin-bottom:6px; letter-spacing:0.1px; }
        .ca-label .req { color:#52B788; }
        .ca-input { width:100%; border:1px solid #D1D5DB; border-radius:10px; padding:11px 14px; font-size:14px; font-family:inherit; font-weight:300; color:#111827; background:rgba(255,255,255,0.95); outline:none; transition:border-color .18s, box-shadow .18s; appearance:none; }
        .ca-input:focus { border-color:#52B788; box-shadow:0 0 0 3px rgba(82,183,136,0.10); }
        .ca-input.err   { border-color:#EF4444; }
        .ca-input::placeholder { color:#9CA3AF; }
        .ca-err { font-size:11px; color:#EF4444; margin-top:4px; display:flex; align-items:center; gap:4px; font-weight:300; }
        .ca-prefix-wrap { position:relative; }
        .ca-prefix { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; color:#374151; pointer-events:none; font-weight:300; }
        .ca-prefix-wrap .ca-input { padding-left:26px; }
        .ca-select-wrap { position:relative; }
        .ca-select-wrap .ca-input { padding-right:36px; cursor:pointer; }
        .ca-select-arrow { position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:#374151; }
        .img-tabs { display:flex; gap:6px; margin-bottom:14px; }
        .img-tab { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:12px; font-family:inherit; font-weight:400; cursor:pointer; transition:all .15s; border:1px solid #D1D5DB; background:transparent; color:#374151; }
        .img-tab.active { background:#1B3A2D; border-color:#1B3A2D; color:#D8F0E6; }
        .drop-zone { border:1.5px dashed #D1D5DB; border-radius:12px; padding:28px 20px; text-align:center; cursor:pointer; transition:border-color .18s, background .18s; background:rgba(255,255,255,0.6); }
        .drop-zone:hover, .drop-zone.over { border-color:#52B788; background:rgba(82,183,136,0.04); }
        .drop-zone.err { border-color:#EF4444; }
        .drop-zone-icon { color:#9CA3AF; margin-bottom:8px; }
        .drop-zone-text { font-size:13px; color:#374151; font-weight:300; line-height:1.5; }
        .drop-zone-text strong { color:#52B788; font-weight:400; }
        .img-preview { position:relative; border-radius:12px; overflow:hidden; background:#F9FAFB; }
        .img-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
        .img-preview-overlay { position:absolute; inset:0; background:rgba(0,0,0,0); transition:background .2s; display:flex; align-items:center; justify-content:center; }
        .img-preview:hover .img-preview-overlay { background:rgba(0,0,0,0.25); }
        .img-preview-clear { opacity:0; transition:opacity .2s; background:#fff; border:none; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .img-preview:hover .img-preview-clear { opacity:1; }
        .url-row { display:flex; gap:8px; }
        .url-row .ca-input { flex:1; }
        .url-apply { background:#1B3A2D; color:#fff; border:none; border-radius:10px; padding:0 18px; font-size:13px; font-weight:400; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .15s; flex-shrink:0; }
        .url-apply:hover { background:#2D6A4F; }
        .upload-status { display:flex; align-items:center; gap:8px; font-size:12px; color:#52B788; margin-top:8px; font-weight:300; }
        .upload-status.error { color:#EF4444; }
        .upload-url-ok { margin-top:8px; font-size:11px; color:#52B788; display:flex; align-items:center; gap:5px; font-weight:300; word-break:break-all; }
        .end-datetime-row { display:flex; gap:10px; }
        .end-datetime-row .ca-input { flex:1; }
        .pkg-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .pkg-hint { font-size:11.5px; color:#374151; font-weight:300; margin-bottom:14px; line-height:1.6; }
        .submit-err { display:flex; align-items:center; gap:8px; background:#FEF2F2; border:0.5px solid #FECACA; border-radius:10px; padding:12px 16px; font-size:13px; color:#B91C1C; font-weight:300; margin-top:12px; }
        .ca-actions { display:flex; gap:10px; margin-top:24px; }
        .btn-primary { flex:1; background:#1B3A2D; color:#fff; border:none; border-radius:12px; padding:14px 28px; font-size:14px; font-weight:400; cursor:pointer; font-family:inherit; transition:background .15s, transform .1s; letter-spacing:0.2px; display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-primary:hover  { background:#2D6A4F; }
        .btn-primary:active { transform:scale(0.98); }
        .btn-primary:disabled { background:#6B7280; cursor:not-allowed; }
        .btn-cancel { background:transparent; color:#374151; border:1px solid #D1D5DB; border-radius:12px; padding:14px 20px; font-size:14px; font-weight:300; cursor:pointer; font-family:inherit; transition:border-color .15s, color .15s; white-space:nowrap; }
        .btn-cancel:hover { border-color:#6B7280; color:#111827; }
        .ca-tips { margin-top:20px; border:0.5px solid #D1D5DB; border-radius:14px; padding:18px 20px; background:rgba(242,250,246,0.5); backdrop-filter:blur(4px); }
        .ca-tips-title { font-size:11px; font-weight:500; color:#52B788; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:10px; }
        .ca-tips-list { list-style:none; display:flex; flex-direction:column; gap:6px; }
        .ca-tips-list li { font-size:12.5px; color:#374151; font-weight:300; display:flex; gap:8px; align-items:flex-start; line-height:1.5; }
        .ca-tips-list li::before { content:'—'; color:#52B788; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media (max-width:520px) {
          .pkg-grid { grid-template-columns:repeat(2,1fr); }
          .end-datetime-row { flex-direction:column; }
          .ca-actions { flex-direction:column-reverse; }
          .btn-cancel { text-align:center; }
        }
      `}</style>

            <div className="ca-page">
                <Navbar />

                {/* ── Blocker modal — sits on top, form mounts underneath ── */}
                {blocker && (
                    <BlockerModal
                        reason={blocker}
                        onLogin={() => router.push("/login")}
                        onAddAddress={() => router.push("/address")}
                    />
                )}

                <div className="ca-bg"><div className="ca-bg-green" /></div>

                <div className="ca-wrap">
                    <div className="ca-eyebrow">New listing</div>
                    <h1 className="ca-title">Create auction</h1>
                    <p className="ca-sub">Fill in the details to list your item for bidding.</p>

                    {/* ── Section 1: Item details ── */}
                    <div className="ca-section">
                        <div className="ca-section-label"><Type size={13} stroke="#374151" /> Item details</div>

                        <div className="ca-field">
                            <label className="ca-label">Auction title <span className="req">*</span></label>
                            <input className={`ca-input${errors.title ? " err" : ""}`} placeholder="e.g. iPhone 15 Pro Max 256GB" value={form.title} onChange={set("title")} />
                            {errors.title && <div className="ca-err"><AlertCircle size={11} />{errors.title}</div>}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div className="ca-field">
                                <label className="ca-label"><DollarSign size={11} /> Starting price <span className="req">*</span></label>
                                <div className="ca-prefix-wrap">
                                    <span className="ca-prefix">$</span>
                                    <input className={`ca-input${errors.price ? " err" : ""}`} type="number" min="0" placeholder="0.00" value={form.price} onChange={set("price")} />
                                </div>
                                {errors.price && <div className="ca-err"><AlertCircle size={11} />{errors.price}</div>}
                            </div>
                            <div className="ca-field">
                                <label className="ca-label"><Tag size={11} /> Category <span className="req">*</span></label>
                                <div className="ca-select-wrap">
                                    <select className={`ca-input${errors.category ? " err" : ""}`} value={form.category} onChange={set("category")}>
                                        <option value="">Select category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <span className="ca-select-arrow"><ChevronDown size={14} /></span>
                                </div>
                                {errors.category && <div className="ca-err"><AlertCircle size={11} />{errors.category}</div>}
                            </div>
                        </div>

                        <div className="ca-field">
                            <label className="ca-label"><Clock size={11} /> Auction end date &amp; time <span className="req">*</span></label>
                            <div className="end-datetime-row">
                                <input className={`ca-input${errors.endTime ? " err" : ""}`} type="date" min={new Date().toISOString().split("T")[0]} value={endDate} onChange={e => updateEndDateTime(e.target.value, endTimeOfDay)} />
                                <input className={`ca-input${errors.endTime ? " err" : ""}`} type="time" value={endTimeOfDay} onChange={e => updateEndDateTime(endDate, e.target.value)} />
                            </div>
                            {errors.endTime && <div className="ca-err" style={{ marginTop: 6 }}><AlertCircle size={11} />{errors.endTime}</div>}
                        </div>
                    </div>

                    {/* ── Section 2: Image ── */}
                    <div className="ca-section">
                        <div className="ca-section-label"><ImageIcon size={13} stroke="#374151" /> Auction image</div>
                        <div className="img-tabs">
                            <button type="button" className={`img-tab${imgMode === "upload" ? " active" : ""}`} onClick={() => setImgMode("upload")}><Upload size={12} /> Upload file</button>
                            <button type="button" className={`img-tab${imgMode === "url" ? " active" : ""}`} onClick={() => setImgMode("url")}><Link size={12} /> Paste URL</button>
                        </div>
                        {preview ? (
                            <div className="img-preview">
                                <img src={preview} alt="preview" onError={() => { setPreview(""); setUploadErr("Could not load image."); }} />
                                <div className="img-preview-overlay">
                                    <button className="img-preview-clear" onClick={clearImage}><X size={14} /></button>
                                </div>
                            </div>
                        ) : imgMode === "upload" ? (
                            <div className={`drop-zone${dragOver ? " over" : ""}${errors.imageUrl ? " err" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
                                <div className="drop-zone-icon"><Upload size={28} /></div>
                                <div className="drop-zone-text"><strong>Click to upload</strong> or drag &amp; drop<br /><span style={{ fontSize: 11, color: "#6B7280" }}>PNG, JPG, WEBP up to 10MB</span></div>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                            </div>
                        ) : (
                            <div className="url-row">
                                <input className={`ca-input${errors.imageUrl ? " err" : ""}`} placeholder="https://example.com/image.jpg" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && applyUrl()} />
                                <button className="url-apply" onClick={applyUrl}>Apply</button>
                            </div>
                        )}
                        {uploading && <div className="upload-status"><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading to Cloudinary…</div>}
                        {uploadErr && <div className="upload-status error"><AlertCircle size={13} />{uploadErr}</div>}
                        {errors.imageUrl && !uploadErr && <div className="ca-err" style={{ marginTop: 8 }}><AlertCircle size={11} />{errors.imageUrl}</div>}
                        {form.imageUrl && !uploading && <div className="upload-url-ok"><CheckCircle size={11} />{form.imageUrl}</div>}
                    </div>

                    {/* ── Section 3: Package ── */}
                    <div className="ca-section">
                        <div className="ca-section-label"><Package size={13} stroke="#374151" /> Package dimensions</div>
                        <p className="pkg-hint">For accurate shipping. Weight 0.1–50 lbs · Length ≤ 60″ · Width ≤ 30″ · Height ≤ 30″</p>
                        <div className="pkg-grid">
                            {[
                                { key: "weight", label: "Weight (lbs)", placeholder: "0.0" },
                                { key: "length", label: "Length (in)", placeholder: "0.0" },
                                { key: "width", label: "Width (in)", placeholder: "0.0" },
                                { key: "height", label: "Height (in)", placeholder: "0.0" },
                            ].map(f => (
                                <div key={f.key} className="ca-field">
                                    <label className="ca-label">{f.label} <span className="req">*</span></label>
                                    <input className={`ca-input${errors[f.key] ? " err" : ""}`} type="number" min="0" step="0.1" placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} />
                                    {errors[f.key] && <div className="ca-err"><AlertCircle size={10} />{errors[f.key]}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {submitErr && <div className="submit-err"><AlertCircle size={15} />{submitErr}</div>}

                    <div className="ca-actions">
                        <button className="btn-cancel" type="button" onClick={() => window.location.href = "/auctions"}>Cancel</button>
                        <button className="btn-primary" type="button" onClick={handleSubmit} disabled={submitting || uploading}>
                            {submitting ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating…</> : "Create auction"}
                        </button>
                    </div>

                    <div className="ca-tips">
                        <div className="ca-tips-title">Tips for a successful auction</div>
                        <ul className="ca-tips-list">
                            <li>Use a clear, descriptive title that buyers will search for</li>
                            <li>Upload a high-quality photo — front-lit, neutral background</li>
                            <li>Set a competitive starting price to attract early bids</li>
                            <li>3–7 day auctions typically get the most engagement</li>
                            <li>Pick the right category for better search visibility</li>
                        </ul>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
}