"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";

// Public US states topology (Census-derived, open data) served via jsDelivr CDN
const US_STATES_TOPO_JSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// pin locations — [longitude, latitude] — roughly matching the reference spread
const PINS = [
  { name: "Oregon", coords: [-122.68, 45.52] },      // Pacific NW
  { name: "Utah", coords: [-111.89, 40.76] },        // Rockies
  { name: "Iowa", coords: [-93.6, 41.6] },           // Midwest
  { name: "Arkansas", coords: [-92.37, 34.75] },     // South-Central
  { name: "Texas", coords: [-97.74, 30.27] },        // Texas
];

const MAP_WIDTH = 960;
const MAP_HEIGHT = 600;

function useUsMap() {
  const [statePaths, setStatePaths] = useState([]);
  const [pinPositions, setPinPositions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(US_STATES_TOPO_JSON_URL);
        const topo = await res.json();
        const geojson = feature(topo, topo.objects.states);

        const projection = geoAlbersUsa()
          .scale(1200)
          .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
        const path = geoPath(projection);

        const paths = geojson.features.map((f) => ({
          id: f.id,
          d: path(f),
        }));

        const pins = PINS.map((pin) => {
          const projected = projection(pin.coords);
          return projected ? { ...pin, x: projected[0], y: projected[1] } : null;
        }).filter(Boolean);

        if (!cancelled) {
          setStatePaths(paths);
          setPinPositions(pins);
        }
      } catch (err) {
        console.error("Failed to load US map data:", err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { statePaths, pinPositions };
}

export default function Contact() {
  const { statePaths, pinPositions } = useUsMap();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) return;

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send message");

      setStatus("sent");
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .contact-section {
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          background: #ffffff;
          padding: clamp(48px, 7vw, 90px) clamp(18px, 5vw, 48px);
        }

        .contact-section-inner { max-width: 1200px; margin: 0 auto; }

        .contact-heading { text-align: center; margin-bottom: clamp(40px, 6vw, 64px); }
        .contact-heading h2 {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: clamp(22px, 3vw, 32px);
          letter-spacing: 0.5px;
          color: #1c2530;
          text-transform: uppercase;
          margin: 0 0 14px;
        }
        .contact-heading-rule {
          display: flex; align-items: center; justify-content: center; gap: 16px;
        }
        .contact-heading-rule span {
          height: 1px; width: 90px; background: #d7dbe0;
        }
        .contact-heading-pin { flex-shrink: 0; color: #1a7a48; }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(28px, 5vw, 60px);
          align-items: center;
        }

        /* ── Map ── */
        .contact-map-wrap { width: 100%; }
        .contact-map-svg { width: 100%; height: auto; display: block; }
        .us-state-path {
          fill: #414751;
          stroke: #ffffff;
          stroke-width: 0.6;
          transition: fill 0.15s ease;
        }
        .us-state-path:hover { fill: #1a7a48; }
        .map-pin { filter: drop-shadow(0 3px 5px rgba(0,0,0,0.25)); }

        /* ── Form card ── */
        .contact-card {
          background: #ffffff;
          border: 1px solid #ecedf0;
          border-radius: 14px;
          box-shadow: 0 20px 45px rgba(20,25,35,0.08);
          padding: clamp(24px, 3.5vw, 40px);
        }
        .contact-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px 28px;
        }
        .contact-field { display: flex; flex-direction: column; }
        .contact-field.full { grid-column: 1 / -1; }
        .contact-field label {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: #4a5361;
          margin-bottom: 8px;
        }
        .contact-field label .req { color: #1a7a48; }
        .contact-field input,
        .contact-field textarea {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #1c2530;
          background: transparent;
          border: none;
          border-bottom: 1px solid #dfe2e7;
          padding: 4px 2px 10px;
          outline: none;
          resize: none;
          transition: border-color .15s ease;
        }
        .contact-field textarea { min-height: 64px; }
        .contact-field input:focus,
        .contact-field textarea:focus { border-color: #1a7a48; }
        .contact-field input::placeholder,
        .contact-field textarea::placeholder { color: #b7bcc4; }

        .contact-submit-row { grid-column: 1 / -1; margin-top: 6px; }
        .contact-submit-btn {
          width: 100%;
          background: #1a7a48;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 15px 20px;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .2s ease, transform .15s ease, opacity .15s ease;
        }
        .contact-submit-btn:hover:not(:disabled) { background: #145c35; }
        .contact-submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .contact-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .contact-status {
          grid-column: 1 / -1;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          margin-top: -6px;
        }
        .contact-status.sent { color: #1a7a48; }
        .contact-status.error { color: #b3261e; }

        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-map-wrap { max-width: 460px; margin: 0 auto; }
        }
        @media (max-width: 520px) {
          .contact-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="contact-section">
        <div className="contact-section-inner">
          <motion.div
            className="contact-heading"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <h2>Need Help? Contact Us</h2>
            <div className="contact-heading-rule">
              <span />
              <svg className="contact-heading-pin" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
              <span />
            </div>
          </motion.div>

          <div className="contact-grid">
            <motion.div
              className="contact-map-wrap"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
            >
              <svg
                className="contact-map-svg"
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                {statePaths.map((s) => (
                  <path key={s.id} d={s.d} className="us-state-path" />
                ))}

                {pinPositions.map((pin) => (
                  <g key={pin.name} className="map-pin" transform={`translate(${pin.x - 11}, ${pin.y - 28})`}>
                    <path
                      d="M11 0C4.9 0 0 4.9 0 11c0 8.25 11 19 11 19s11-10.75 11-19C22 4.9 17.1 0 11 0z"
                      fill="#1a7a48"
                    />
                    <circle cx="11" cy="11" r="4.2" fill="#fff" />
                  </g>
                ))}
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <div className="contact-card">
                <form className="contact-form-grid" onSubmit={handleSubmit}>
                  <div className="contact-field">
                    <label>First Name: <span className="req">*</span></label>
                    <input type="text" value={form.firstName} onChange={update("firstName")} required />
                  </div>
                  <div className="contact-field">
                    <label>Last Name:</label>
                    <input type="text" value={form.lastName} onChange={update("lastName")} />
                  </div>

                  <div className="contact-field">
                    <label>Email: <span className="req">*</span></label>
                    <input type="email" value={form.email} onChange={update("email")} required />
                  </div>
                  <div className="contact-field">
                    <label>Subject: <span className="req">*</span></label>
                    <input type="text" value={form.subject} onChange={update("subject")} required />
                  </div>

                  <div className="contact-field full">
                    <label>Your message: <span className="req">*</span></label>
                    <textarea value={form.message} onChange={update("message")} required />
                  </div>

                  <div className="contact-submit-row">
                    <button type="submit" className="contact-submit-btn" disabled={status === "sending"}>
                      {status === "sending" ? "Sending…" : "Send message →"}
                    </button>
                  </div>

                  {status === "sent" && <div className="contact-status sent">Message sent — thank you! We'll be in touch soon.</div>}
                  {status === "error" && <div className="contact-status error">{errorMsg}</div>}
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}