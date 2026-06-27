"use client";
import { useState, useEffect, useRef } from "react";
import {
  Gavel, PlusCircle, ClipboardList, ShoppingCart,
  LogIn, User, Home, LogOut, ShoppingBag
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Home",           icon: Home,          href: "/" },
  { label: "Auctions",       icon: ShoppingCart,  href: "/auction" },
  { label: "Create Auction", icon: PlusCircle,    href: "/create-auction" },
  { label: "My Auctions",    icon: ClipboardList, href: "/my-auction" },
  { label: "Orders",         icon: ShoppingBag,   href: "/orders" },
];

// Pages where the navbar should stay transparent / not render the glass bar
const HIDE_PAGES = [];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const dropdownRef = useRef(null);
  const router   = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Don't render the navbar on auth / onboard pages at all
  const isHiddenPage = HIDE_PAGES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isHiddenPage) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .topbar {
          position: sticky; top: 0; z-index: 100;
          height: 62px;
          display: flex; align-items: center;
          padding: 0 clamp(16px, 4vw, 40px);
          gap: 10px;
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(82,183,136,0.14);
          transition: box-shadow .25s ease, background .25s ease;
        }
        .topbar.scrolled {
          background: rgba(255,255,255,0.92);
          box-shadow: 0 1px 0 rgba(82,183,136,0.1), 0 8px 32px rgba(27,58,45,0.07);
        }

        /* ── Logo ── */
        .logo-wrap {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none; flex-shrink: 0; cursor: pointer;
        }
        .logo-mark {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 17px; font-weight: 700; color: #0a1f14;
          letter-spacing: -0.4px; font-family: 'Inter', sans-serif;
        }
        .logo-text em {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 400;
          color: #1a7a48;
        }

        /* ── Desktop nav ── */
        .desktop-nav {
          display: flex; align-items: center; gap: 1px;
          margin-left: 20px;
        }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 500; color: #5c6b62;
          text-decoration: none; cursor: pointer;
          font-family: inherit; white-space: nowrap; border: none;
          background: transparent;
          transition: background .14s, color .14s;
        }
        .nav-link:hover { background: rgba(82,183,136,0.1); color: #0a1f14; }
        .nav-link.active {
          background: rgba(10,31,20,0.07); color: #0a1f14; font-weight: 600;
        }
        .nav-link svg { opacity: .6; flex-shrink: 0; transition: opacity .14s; }
        .nav-link:hover svg, .nav-link.active svg { opacity: 1; }

        .topbar-spacer { flex: 1; }

        /* ── Login button ── */
        .login-btn {
          display: flex; align-items: center; gap: 7px;
          background: #0a1f14; color: #fff;
          border: none; border-radius: 10px;
          padding: 0 18px; height: 36px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          transition: background .15s; white-space: nowrap; flex-shrink: 0;
        }
        .login-btn:hover { background: #1a7a48; }
        .login-btn:active { transform: scale(0.97); }

        /* ── Profile button + dropdown ── */
        .profile-wrap { position: relative; }
        .profile-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: #0a1f14; color: #fff; border: 2px solid transparent;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; font-family: inherit;
          overflow: hidden; flex-shrink: 0;
          transition: border-color .15s, box-shadow .15s;
        }
        .profile-btn:hover {
          border-color: #52B788;
          box-shadow: 0 0 0 3px rgba(82,183,136,0.2);
        }
        .profile-btn img { width: 100%; height: 100%; object-fit: cover; }

        .profile-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(82,183,136,0.18);
          border-radius: 14px; min-width: 200px;
          box-shadow: 0 16px 40px rgba(10,31,20,0.12), 0 4px 12px rgba(10,31,20,0.06);
          overflow: hidden; z-index: 200;
          animation: dropIn .18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        .dropdown-header {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(10,31,20,0.07);
          background: rgba(10,31,20,0.025);
        }
        .dropdown-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #0a1f14; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          margin-bottom: 9px; overflow: hidden;
          flex-shrink: 0;
        }
        .dropdown-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .dropdown-name  { font-size: 13px; font-weight: 600; color: #0a1f14; }
        .dropdown-email { font-size: 11px; color: #8fada0; margin-top: 2px; }

        .dropdown-section { padding: 6px 0; }
        .dropdown-item {
          width: 100%; text-align: left;
          padding: 9px 16px; font-size: 13px; color: #2d3d30;
          background: none; border: none; cursor: pointer;
          font-family: inherit;
          display: flex; align-items: center; gap: 10px;
          transition: background .12s, color .12s;
        }
        .dropdown-item svg { opacity: .6; flex-shrink: 0; }
        .dropdown-item:hover { background: rgba(82,183,136,0.08); color: #0a1f14; }
        .dropdown-item:hover svg { opacity: 1; }
        .dropdown-item.danger { color: #b91c1c; }
        .dropdown-item.danger svg { opacity: .7; }
        .dropdown-item.danger:hover { background: rgba(185,28,28,0.06); color: #991b1b; }

        .dropdown-divider {
          height: 1px; background: rgba(10,31,20,0.07); margin: 0 12px;
        }

        /* ── Skeleton ── */
        .skeleton-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(90deg,#f0f4f2 25%,#e4ece7 50%,#f0f4f2 75%);
          background-size: 200% 100%;
          animation: shimmer 1.3s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Mobile bottom tabs ── */
        .bottom-tabs {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(82,183,136,0.14);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .bottom-tabs-inner { display: flex; height: 60px; align-items: stretch; }
        .tab-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 3px;
          cursor: pointer; border: none; background: transparent;
          font-family: inherit; padding: 7px 2px 5px;
          -webkit-tap-highlight-color: transparent;
          transition: background .12s;
        }
        .tab-item:active { background: rgba(82,183,136,0.08); }
        .tab-icon-wrap {
          width: 40px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 20px;
          transition: background .15s;
        }
        .tab-item.active .tab-icon-wrap { background: rgba(10,31,20,0.08); }
        .tab-item svg { width: 20px; height: 20px; stroke: #9ab0a2; stroke-width: 1.8; transition: stroke .15s; }
        .tab-item.active svg { stroke: #0a1f14; stroke-width: 2.2; }
        .tab-label {
          font-size: 9.5px; font-weight: 500; color: #9ab0a2;
          letter-spacing: 0.1px; text-align: center;
          line-height: 1.2; max-width: 64px;
          transition: color .15s;
        }
        .tab-item.active .tab-label { color: #0a1f14; font-weight: 700; }

        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .bottom-tabs { display: block; }
          body { padding-bottom: 60px; }
        }
        @media (min-width: 769px) { .bottom-tabs { display: none !important; } }
        @media (max-width: 480px) {
          .login-btn-text { display: none; }
          .login-btn { padding: 0 11px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .topbar, .nav-link, .profile-dropdown, .tab-item { transition: none; animation: none; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <header   style={{
    backgroundColor: "white",
    overflowX: "hidden",
  }}
   className={`topbar${scrolled ? " scrolled" : ""}`}>

        {/* Logo */}
        <div className="logo-wrap" onClick={() => router.push("/")}>
          <div className="logo-mark">
            <img size={17} src="/logo.png" />
          </div>
          <span className="logo-text">Auc<em>ville</em></span>
        </div>

        {/* Desktop nav links */}
        <nav className="desktop-nav">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              className={`nav-link${isActive(href) ? " active" : ""}`}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
              href={href}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </a>
          ))}
        </nav>

        <div className="topbar-spacer" />

        {/* Auth area */}
        {status === "loading" ? (
          <div className="skeleton-avatar" />
        ) : session?.user ? (
          <div className="profile-wrap" ref={dropdownRef}>
            <button
              className="profile-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {session.user.image
                ? <img src={session.user.image} alt={session.user.name ?? "Avatar"} />
                : (session.user.name?.[0]?.toUpperCase() ?? <User size={16} />)
              }
            </button>

            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {session.user.image
                      ? <img src={session.user.image} alt="" />
                      : (session.user.name?.[0]?.toUpperCase() ?? "?")
                    }
                  </div>
                  <div className="dropdown-name">{session.user.name}</div>
                  <div className="dropdown-email">{session.user.email}</div>
                </div>

                <div className="dropdown-section">
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push("/my-auction"); }}
                  >
                    <User size={14} strokeWidth={2} />
                    My profile
                  </button>
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push("/orders"); }}
                  >
                    <ShoppingBag size={14} strokeWidth={2} />
                    My orders
                  </button>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-section">
                  <button
                    className="dropdown-item danger"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  >
                    <LogOut size={14} strokeWidth={2} />
                    Sign out
                  </button>
                </div>
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

      {/* ── Mobile bottom tabs ── */}
      <div className="bottom-tabs">
        <div className="bottom-tabs-inner">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              className={`tab-item${isActive(href) ? " active" : ""}`}
              onClick={() => router.push(href)}
              aria-label={label}
            >
              <div className="tab-icon-wrap">
                <Icon />
              </div>
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}