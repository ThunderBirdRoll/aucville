"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";

function GoogleButton({ label = "Continue with Google" }) {
  return (
    <>
      <div className="divider">
        or continue with
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="google-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {label}
      </button>
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        alert("Invalid credentials");
        return;
      }

      router.push("/");
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
     
<div className="w-screen h-screen">
       <Navbar />
        <div className="login-page">
  
        <style>{`
          * {
            box-sizing: border-box;
          }

          .login-page {
            min-height: calc(100vh - 64px);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%);
            font-family: 'DM Sans', sans-serif;
            position: relative;
            overflow: hidden;
            padding: 24px 16px;
          }

          .bg-glow {
            position: absolute;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(26,122,72,0.22), transparent 60%);
            top: -250px;
            right: -250px;
            filter: blur(30px);
            pointer-events: none;
          }

          .card {
            width: 100%;
            max-width: 380px;
            background: rgba(255,255,255,0.95);
            border: 1px solid rgba(181,212,195,0.7);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.08);
            backdrop-filter: blur(12px);
            position: relative;
            z-index: 1;
          }

          .title {
            font-size: 22px;
            font-weight: 800;
            color: #0a1f14;
            margin-bottom: 4px;
          }

          .subtitle {
            font-size: 12.5px;
            color: rgba(0,0,0,0.65);
            margin-bottom: 18px;
          }

          .input {
            width: 100%;
            padding: 11px 13px;
            margin-bottom: 10px;
            border-radius: 10px;
            border: 1.5px solid #cfe7da;
            outline: none;
            font-size: 14px;
            transition: all 0.2s ease;
            color: #000;
            background: #fff;
          }

          .input::placeholder {
            color: rgba(0,0,0,0.45);
          }

          .input:focus {
            border-color: #1a7a48;
            box-shadow: 0 0 0 4px rgba(26,122,72,0.12);
          }

          .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #145c35, #1a7a48);
            color: white;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            margin-top: 4px;
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px rgba(26,122,72,0.25);
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .divider {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 16px 0;
            font-size: 11.5px;
            color: rgba(0,0,0,0.55);
          }

          .divider::before,
          .divider::after {
            content: "";
            flex: 1;
            height: 1px;
            background: rgba(0,0,0,0.1);
          }

          .google-btn {
            width: 100%;
            padding: 11px;
            border-radius: 10px;
            border: 1px solid #d6e6dd;
            background: #fff;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 13.5px;
            color: #000;
          }

          .google-btn:hover {
            border-color: #1a7a48;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
          }

          .footer {
            text-align: center;
            margin-top: 14px;
            font-size: 12px;
            color: rgba(0,0,0,0.6);
          }

          .footer span {
            color: #1a7a48;
            font-weight: 700;
            cursor: pointer;
          }

          /* Small phones */
          @media (max-width: 380px) {
            .card {
              padding: 18px;
              border-radius: 14px;
            }

            .title {
              font-size: 19px;
            }

            .bg-glow {
              width: 480px;
              height: 480px;
              top: -180px;
              right: -180px;
            }
          }

          /* Larger screens: a touch roomier, still compact */
          @media (min-width: 768px) {
            .card {
              max-width: 400px;
              padding: 28px;
            }
          }
        `}</style>
       
        <div className="bg-glow" />

        <form className="card" onSubmit={handleLogin}>
          <div className="title">Welcome Back</div>
          <div className="subtitle">Login to continue bidding</div>

          <input
            className="input"
            name="email"
            placeholder="Email Address"
            type="email"
            onChange={handleChange}
          />

          <input
            className="input"
            name="password"
            placeholder="Password"
            type="password"
            onChange={handleChange}
          />

          <button className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <GoogleButton label="Continue with Google" />

          <div className="footer">
            Don't have an account?{" "}
            <span onClick={() => router.push("/signup")}>Sign up</span>
          </div>
        </form>
      </div>

</div>
      <Footer />
     
    </>
  );
}