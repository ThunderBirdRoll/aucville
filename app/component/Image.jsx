"use client";

import { useEffect, useRef, useState } from "react";

const MARQUEE_IMAGES = [
  { src: "/iphone.png", alt: "iPhone", discount: 20 },
  { src: "/watch.png", alt: "Watch", discount: 15 },
  { src: "/headphone.png", alt: "Headphones", discount: 25 },
  { src: "/apple.png", alt: "iPhone", discount: 20 },
  { src: "/perfume.png", alt: "Watch", discount: 15 },
  { src: "/headphone.png", alt: "Headphones", discount: 25 },
  { src: "/iphone.png", alt: "iPhone", discount: 20 },
  { src: "/watch.png", alt: "Watch", discount: 15 },
  { src: "/headphone.png", alt: "Headphones", discount: 25 },
  { src: "/apple.png", alt: "iPhone", discount: 20 },
  { src: "/perfume.png", alt: "Watch", discount: 15 },
  { src: "/headphone.png", alt: "Headphones", discount: 25 },
  { src: "/apple.png", alt: "iPhone", discount: 20 },
  { src: "/watch.png", alt: "Watch", discount: 15 },
  { src: "/headphone.png", alt: "Headphones", discount: 25 },
];

// fixed rotation of discount values — assigned by position so each new image
// you add automatically gets a varied, stable badge without manual editing
const DISCOUNT_CYCLE = [20, 15, 25, 10, 30, 18];

// Duplicate the set 3x. We measure the pixel width of ONE set at runtime and
// animate by exactly that many pixels — this is what actually guarantees a
// seamless loop (no gap/stutter at restart), regardless of gap/padding/
// rounding quirks that break the "-50%" trick. The 3rd copy is just a safety
// buffer so there's always a full extra set off-screen on wide viewports.
const LOOPED_IMAGES = [...MARQUEE_IMAGES, ...MARQUEE_IMAGES, ...MARQUEE_IMAGES];
const SET_COUNT = 3;

export default function ImageMarquee() {
  const trackRef = useRef(null);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      // width of one full set = total scrollWidth / number of sets
      const widthPerSet = track.scrollWidth / SET_COUNT;
      setSetWidth(widthPerSet);
    };

    measure();

    // re-measure on resize/font-load/image-load so the loop distance
    // always matches the actual rendered width (this is what kills the
    // "gap" — a stale/guessed distance is the usual cause of a visible jump)
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, []);

  return (
    <>
      <style>{`
        .marquee-section {
          position: relative;
          width: 100%;
          background: #ffffff;
          padding: clamp(20px, 3vw, 32px) 0;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .marquee-track-wrap {
          width: 100%;
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%);
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: clamp(12px, 2vw, 18px);
          width: max-content;
          will-change: transform;
          backface-visibility: hidden;
          animation: none;
        }

        .marquee-track.is-animating {
          animation: marqueeScroll var(--marquee-duration, 7s) linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* wrapper holds the image box AND the badge as siblings,
           so the badge is never clipped by the box's border-radius */
        .marquee-item-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .marquee-item {
          width: clamp(76px, 6.5vw, 100px);
          height: clamp(76px, 6.5vw, 100px);
          background: #f3f8f5;
          border: 1px solid #e3ece7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 1.2vw, 14px);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .marquee-item:hover {
          border-color: #1a7a48;
          box-shadow: 0 8px 22px rgba(10,31,20,0.1);
          transform: translateY(-2px);
        }

        .marquee-item img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
        }

        .marquee-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 26px;
          height: 26px;
          background: #1a7a48;
          color: #fff;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.1px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 3px 8px rgba(10,31,20,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 2;
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track.is-animating { animation: none; }
        }
      `}</style>

      <section className="marquee-section">
        <div className="marquee-track-wrap">
          <div
            ref={trackRef}
            className={`marquee-track${setWidth > 0 ? " is-animating" : ""}`}
            style={
              setWidth > 0
                ? {
                    "--marquee-duration": `${setWidth / 80}s`, // ~80px/sec, tweak to taste
                  }
                : undefined
            }
          >
            <style>{`
              @keyframes marqueeScroll {
                from { transform: translate3d(0, 0, 0); }
                to   { transform: translate3d(-${setWidth}px, 0, 0); }
              }
            `}</style>
            {LOOPED_IMAGES.map((img, i) => {
              const baseIndex = i % MARQUEE_IMAGES.length;
              const discount = img.discount ?? DISCOUNT_CYCLE[baseIndex % DISCOUNT_CYCLE.length];
              return (
                <div className="marquee-item-wrap" key={`${img.src}-${i}`}>
                  <div className="marquee-item">
                    <img src={img.src} alt={img.alt} />
                  </div>
                  <span className="marquee-badge">{discount}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}