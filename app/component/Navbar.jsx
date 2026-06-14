"use client";
import { useState } from "react";
import { Gavel, PlusSquare, ClipboardList, ShoppingBag, LogIn, ShoppingCart, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Home",           icon: Gavel,         href: "/" },
  { label: "Auctions",       icon: Gavel,         href: "/auction" },
  { label: "Create Auction", icon: PlusSquare,    href: "/create-auction" },
  { label: "My Auctions",    icon: ClipboardList, href: "/my-auction" },
  { label: "Orders",         icon: ShoppingBag,   href: "/orders" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 60px;
          background: #ffffff;
          border-bottom: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          padding: 0 clamp(16px, 4vw, 40px);
          gap: 12px;
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .logo-mark {
          width: 34px;
          height: 34px;
          background: #1B3A2D;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1B3A2D;
          letter-spacing: -0.4px;
          font-family: inherit;
        }
        .logo-text span { color: #52B788; }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: 28px;
        }
        .desktop-nav a {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          transition: background .15s ease, color .15s ease;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
        }
        .desktop-nav a:hover { background: #F2FAF6; color: #1B3A2D; }
        .desktop-nav a.active { background: #F2FAF6; color: #1B3A2D; font-weight: 600; }

        .topbar-spacer { flex: 1; }

        .login-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #1B3A2D;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background .15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .login-btn:hover { background: #2D6A4F; }
        .login-btn:active { transform: scale(0.97); }

        .bottom-tabs {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: #ffffff;
          border-top: 1px solid #E5E7EB;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .bottom-tabs-inner {
          display: flex;
          height: 62px;
          align-items: stretch;
        }
        .tab-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
          border: none;
          background: transparent;
          font-family: inherit;
          padding: 8px 2px 6px;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          transition: background .12s ease;
        }
        .tab-item:active { background: #F2FAF6; }
        .tab-item svg { width: 21px; height: 21px; stroke: #9CA3AF; transition: stroke .15s ease; }
        .tab-label {
          font-size: 9.5px;
          font-weight: 500;
          color: #9CA3AF;
          transition: color .15s ease;
          letter-spacing: 0.1px;
          text-align: center;
          line-height: 1.2;
          max-width: 64px;
        }
        .tab-item.active svg { stroke: #1B3A2D; }
        .tab-item.active .tab-label { color: #1B3A2D; font-weight: 700; }
        .tab-item.active::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 26px; height: 2.5px;
          background: #52B788;
          border-radius: 0 0 3px 3px;
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .bottom-tabs { display: block; }
          body { padding-bottom: 62px; }
        }
        @media (min-width: 769px) { .bottom-tabs { display: none; } }
        @media (max-width: 480px) {
          .login-btn-text { display: none; }
          .login-btn { padding: 8px 11px; }
        }
          .profile-wrap { position: relative; }
.profile-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #1B3A2D;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
  font-family: inherit;
  overflow: hidden;
  flex-shrink: 0;
}
.profile-btn img { width: 100%; height: 100%; object-fit: cover; }

.profile-dropdown {
  position: absolute; top: 46px; right: 0;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 12px; min-width: 180px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  overflow: hidden; z-index: 200;
}
.profile-dropdown-header {
  padding: 12px 14px; border-bottom: 1px solid #E5E7EB;
}
.profile-dropdown-name { font-size: 13px; font-weight: 600; color: #1B3A2D; }
.profile-dropdown-email { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
.profile-dropdown-item {
  width: 100%; text-align: left;
  padding: 10px 14px; font-size: 13px; color: #374151;
  background: none; border: none; cursor: pointer;
  font-family: inherit; transition: background .15s;
  display: flex; align-items: center; gap: 8px;
}
.profile-dropdown-item:hover { background: #F2FAF6; }
.profile-dropdown-item.danger { color: #EF4444; }
      `}</style>

      <header className="topbar">
        <a className="logo-wrap" href="#" onClick={(e) => e.preventDefault()}>
          <div className="logo-mark">
            <ShoppingCart size={18} stroke="#52B788" strokeWidth={2.2} />
          </div>
          <span className="logo-text">Ac<span>ville</span></span>
        </a>

        <nav className="desktop-nav">
          {NAV_ITEMS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={isActive(href) ? "active" : ""}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="topbar-spacer" />

     {status === "loading" ? (
  <div className="profile-btn" style={{ background: "#1a7a48" }} />
) : session?.user ? (
  <div className="profile-wrap">
    <button className="profile-btn" onClick={() => setMenuOpen(v => !v)}>
      {session.user.image ? (
        <img src={session.user.image} alt={session.user.name} />
      ) : (
        session.user.name?.[0]?.toUpperCase() || <User size={16} />
      )}
    </button>

    {menuOpen && (
      <div className="profile-dropdown">
        <div className="profile-dropdown-header">
          <div className="profile-dropdown-name">{session.user.name}</div>
          <div className="profile-dropdown-email">{session.user.email}</div>
        </div>

        <button
          className="profile-dropdown-item"
          onClick={() => { setMenuOpen(false); router.push("/my-auction"); }}
        >
          <User size={14} /> My profile
        </button>

        <button className="profile-dropdown-item danger" onClick={() => { setMenuOpen(false); signOut(); }}>
          <LogIn size={14} /> Log out
        </button>
      </div>
    )}
  </div>
) : (
  <button className="login-btn" onClick={() => router.push("/login")}>
    <LogIn size={14} />
    <span className="login-btn-text">Log in</span>
  </button>
)}
      </header>

      <div className="bottom-tabs">
        <div className="bottom-tabs-inner">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              className={`tab-item ${isActive(href) ? "active" : ""}`}
              onClick={() => router.push(href)}
            >
              <Icon />
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}