"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import { MapPin, CheckCircle, Loader2, AlertCircle, ChevronDown } from "lucide-react";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Pakistan", "India", "UAE", "Other",
];

export default function AddressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    addressline1: "", addressline2: "",
    city: "", state: "", zip: "", country: "",
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(true);   // fetching existing address
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [saveErr, setSaveErr]   = useState("");

  // ── Redirect if not logged in ──
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status]);

  // ── Pre-fill existing address ──
  useEffect(() => {
    if (!session) return;
    async function load() {
      try {
        const res  = await fetch("/api/user/me");
        const data = await res.json();
        if (data.address) {
          setForm(f => ({ ...f, ...data.address }));
        }
      } catch {
        setFetchErr("Could not load your saved address.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  function set(key) {
    return e => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setErrors(er => ({ ...er, [key]: "" }));
    };
  }

  function validate() {
    const e = {};
    if (!form.addressline1.trim()) e.addressline1 = "Street address is required";
    if (!form.city.trim())         e.city         = "City is required";
    if (!form.state.trim())        e.state        = "State / Province is required";
    if (!form.zip.trim())          e.zip          = "ZIP / Postal code is required";
    if (!form.country)             e.country      = "Select a country";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true); setSaveErr(""); setSaved(false);
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Server error ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setSaveErr(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading skeleton ──
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

        .addr-page{
          min-height:100vh;background:#fff;
          font-family:'DM Sans','Helvetica Neue',sans-serif;
          font-weight:300;position:relative;overflow:hidden;
        }
        .addr-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
        .addr-bg-blob{
          position:absolute;top:-10%;right:-8%;
          width:55%;height:120%;
          background:radial-gradient(ellipse at 80% 50%,
            rgba(82,183,136,0.16) 0%,
            rgba(216,240,230,0.12) 40%,
            rgba(242,250,246,0.07) 65%,
            transparent 82%);
        }

        .addr-wrap{
          position:relative;z-index:1;
          max-width:620px;margin:0 auto;
          padding:clamp(32px,6vw,60px) clamp(16px,5vw,40px) 80px;
        }

        .addr-eyebrow{
          font-size:11px;font-weight:400;color:#52B788;
          letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;
        }
        .addr-title{
          font-size:clamp(24px,4vw,36px);font-weight:400;
          color:#111827;letter-spacing:-0.5px;line-height:1.1;margin-bottom:6px;
        }
        .addr-sub{font-size:13.5px;color:#374151;font-weight:300;margin-bottom:32px}

        .addr-card{
          background:rgba(255,255,255,0.9);
          border:0.5px solid #D1D5DB;border-radius:18px;
          padding:28px 24px;backdrop-filter:blur(6px);
        }
        .card-section-label{
          font-size:11px;font-weight:500;color:#374151;
          letter-spacing:0.8px;text-transform:uppercase;
          margin-bottom:22px;display:flex;align-items:center;gap:8px;
        }

        .addr-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .addr-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
        .addr-field:last-child{margin-bottom:0}
        .addr-label{
          font-size:12.5px;font-weight:400;color:#1F2937;
          display:flex;align-items:center;gap:4px;
        }
        .addr-label .req{color:#52B788}
        .addr-label .opt{font-size:11px;color:#9CA3AF;font-weight:300}

        .addr-input{
          width:100%;border:1px solid #D1D5DB;border-radius:10px;
          padding:11px 14px;font-size:14px;font-family:inherit;
          font-weight:300;color:#111827;background:rgba(255,255,255,0.95);
          outline:none;transition:border-color .18s,box-shadow .18s;appearance:none;
        }
        .addr-input:focus{border-color:#52B788;box-shadow:0 0 0 3px rgba(82,183,136,0.10)}
        .addr-input.err{border-color:#EF4444}
        .addr-input::placeholder{color:#9CA3AF}

        .sel-wrap{position:relative}
        .sel-wrap .addr-input{padding-right:36px;cursor:pointer}
        .sel-arrow{position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#374151}

        .addr-err{
          font-size:11px;color:#EF4444;
          display:flex;align-items:center;gap:4px;font-weight:300;
        }

        .divider{height:1px;background:#F3F4F6;margin:20px 0}

        .addr-actions{display:flex;gap:10px;margin-top:24px}
        .btn-primary{
          flex:1;background:#1B3A2D;color:#fff;border:none;
          border-radius:12px;padding:14px 28px;font-size:14px;
          font-weight:400;cursor:pointer;font-family:inherit;
          transition:background .15s,transform .1s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .btn-primary:hover{background:#2D6A4F}
        .btn-primary:active{transform:scale(0.98)}
        .btn-primary:disabled{background:#6B7280;cursor:not-allowed}
        .btn-cancel{
          background:transparent;color:#374151;
          border:1px solid #D1D5DB;border-radius:12px;
          padding:14px 20px;font-size:14px;font-weight:300;
          cursor:pointer;font-family:inherit;
          transition:border-color .15s,color .15s;white-space:nowrap;
        }
        .btn-cancel:hover{border-color:#6B7280;color:#111827}

        .save-success{
          display:flex;align-items:center;gap:8px;
          background:#F0FDF4;border:0.5px solid #86EFAC;
          border-radius:10px;padding:12px 16px;
          font-size:13px;color:#166534;font-weight:300;margin-top:12px;
        }
        .save-err{
          display:flex;align-items:center;gap:8px;
          background:#FEF2F2;border:0.5px solid #FECACA;
          border-radius:10px;padding:12px 16px;
          font-size:13px;color:#B91C1C;font-weight:300;margin-top:12px;
        }

        .note-box{
          margin-top:20px;border:0.5px solid #D1D5DB;border-radius:14px;
          padding:16px 20px;background:rgba(242,250,246,0.5);
          backdrop-filter:blur(4px);
        }
        .note-title{
          font-size:11px;font-weight:500;color:#52B788;
          letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;
        }
        .note-text{font-size:12.5px;color:#374151;font-weight:300;line-height:1.7}

        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:500px){
          .addr-grid-2{grid-template-columns:1fr}
          .addr-actions{flex-direction:column-reverse}
          .btn-cancel{text-align:center}
        }
      `}</style>

      <div className="addr-page">
        <Navbar />
        <div className="addr-bg"><div className="addr-bg-blob" /></div>

        <div className="addr-wrap">
          <div className="addr-eyebrow">Account</div>
          <h1 className="addr-title">Shipping address</h1>
          <p className="addr-sub">Used for shipping on auctions you win. You can update this any time.</p>

          <div className="addr-card">
            <div className="card-section-label">
              <MapPin size={13} stroke="#374151" /> Delivery details
            </div>

            {/* Line 1 */}
            <div className="addr-field">
              <label className="addr-label">
                Street address <span className="req">*</span>
              </label>
              <input
                className={`addr-input${errors.addressline1 ? " err" : ""}`}
                placeholder="123 Main St"
                value={form.addressline1}
                onChange={set("addressline1")}
              />
              {errors.addressline1 && (
                <span className="addr-err"><AlertCircle size={11} />{errors.addressline1}</span>
              )}
            </div>

            {/* Line 2 */}
            <div className="addr-field">
              <label className="addr-label">
                Apt / Suite / Floor <span className="opt">(optional)</span>
              </label>
              <input
                className="addr-input"
                placeholder="Apt 4B"
                value={form.addressline2}
                onChange={set("addressline2")}
              />
            </div>

            <div className="divider" />

            {/* City + State */}
            <div className="addr-grid-2">
              <div className="addr-field">
                <label className="addr-label">City <span className="req">*</span></label>
                <input
                  className={`addr-input${errors.city ? " err" : ""}`}
                  placeholder="New York"
                  value={form.city}
                  onChange={set("city")}
                />
                {errors.city && (
                  <span className="addr-err"><AlertCircle size={11} />{errors.city}</span>
                )}
              </div>
              <div className="addr-field">
                <label className="addr-label">State / Province <span className="req">*</span></label>
                <input
                  className={`addr-input${errors.state ? " err" : ""}`}
                  placeholder="NY"
                  value={form.state}
                  onChange={set("state")}
                />
                {errors.state && (
                  <span className="addr-err"><AlertCircle size={11} />{errors.state}</span>
                )}
              </div>
            </div>

            {/* ZIP + Country */}
            <div className="addr-grid-2">
              <div className="addr-field">
                <label className="addr-label">ZIP / Postal code <span className="req">*</span></label>
                <input
                  className={`addr-input${errors.zip ? " err" : ""}`}
                  placeholder="10001"
                  value={form.zip}
                  onChange={set("zip")}
                />
                {errors.zip && (
                  <span className="addr-err"><AlertCircle size={11} />{errors.zip}</span>
                )}
              </div>
              <div className="addr-field">
                <label className="addr-label">Country <span className="req">*</span></label>
                <div className="sel-wrap">
                  <select
                    className={`addr-input${errors.country ? " err" : ""}`}
                    value={form.country}
                    onChange={set("country")}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="sel-arrow"><ChevronDown size={14} /></span>
                </div>
                {errors.country && (
                  <span className="addr-err"><AlertCircle size={11} />{errors.country}</span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback banners */}
          {saved && (
            <div className="save-success">
              <CheckCircle size={15} /> Address saved successfully.
            </div>
          )}
          {saveErr && (
            <div className="save-err">
              <AlertCircle size={15} />{saveErr}
            </div>
          )}
          {fetchErr && (
            <div className="save-err">
              <AlertCircle size={15} />{fetchErr}
            </div>
          )}

          {/* Actions */}
          <div className="addr-actions">
            <button className="btn-cancel" onClick={() => router.back()}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                : "Save address"
              }
            </button>
          </div>

          <div className="note-box">
            <div className="note-title">Why we need this</div>
            <p className="note-text">
              Your address is used to calculate shipping costs when you win an auction.
              It's never shared with third parties and can be changed at any time from your account settings.
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}