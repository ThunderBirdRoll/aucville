// app/not-found.js
"use client";
import Link from "next/link";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#fff}

        .nf-page{min-height:100vh;background:#fff;font-family:'DM Sans','Helvetica Neue',sans-serif;font-weight:300;display:flex;flex-direction:column}
        .accent-bar{height:3px;background:linear-gradient(90deg,#1B3A2D 0%,#52B788 55%,#a7f3d0 100%)}

        .nf-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px}
        .nf-icon{width:64px;height:64px;border-radius:30px;background:rgba(82,183,136,0.08);border:0.5px solid rgba(82,183,136,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .nf-code{font-size:13px;color:#52B788;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px}
        .nf-title{font-size:clamp(22px,4vw,32px);font-weight:400;color:#111827;letter-spacing:-0.4px;margin-bottom:10px}
        .nf-sub{font-size:14px;color:#6B7280;font-weight:300;max-width:380px;line-height:1.6;margin-bottom:28px}
        .nf-btn{display:inline-flex;align-items:center;gap:8px;background:#1B3A2D;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:13.5px;font-weight:400;cursor:pointer;font-family:inherit;text-decoration:none;transition:background .15s}
        .nf-btn:hover{background:#2D6A4F}
      `}</style>

      <div className="nf-page">
        <Navbar />
        <div className="accent-bar" />

        <div className="nf-wrap">
          <div className="nf-icon">
            <Compass size={28} stroke="#52B788" />
          </div>
          <div className="nf-code">404 — Page not found</div>
          <h1 className="nf-title">This page doesn't exist</h1>
          <p className="nf-sub">
            The page you're looking for may have been moved, deleted, or never existed.
          </p>
          <Link href="/" className="nf-btn">
            Back to home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}