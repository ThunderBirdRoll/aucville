"use client";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const CATEGORIES = [
  { src: "/apple.png", alt: "Electronic", label: "Electronic" },
  { src: "/necklace.png", alt: "Jewelery", label: "Jewelery" },
  { src: "/utensils.png", alt: "Kitchen", label: "Kitchen" },
  { src: "/shoe.png", alt: "Fashion", label: "Fashion" },
  { src: "/tint.png", alt: "Makeup", label: "Makeup" },
  { src: "/iphone.png", alt: "Cell Phones & Accessories", label: "Cell Phones & Accessories" },
  { src: "/bag.png", alt: "Bags & Luggage", label: "Bags & Luggage" },
  { src: "/toy.png", alt: "Toys & Games", label: "Toys & Games" },
];
export default function CategoryGrid() {
  function goToCategory(label) {
    window.location.href = `${BASE_URL}/auction?search=${encodeURIComponent(label)}`;
  }
  return (
    <>
      <style>{`
        .cat-section {
          width: 100%;
          background: #ffffff;
          padding: clamp(20px, 3vw, 36px) clamp(16px, 4vw, 40px);
        }
        .cat-row {
          display: flex;
          justify-content: flex-start;
          flex-wrap: nowrap;
          gap: clamp(18px, 2.5vw, 32px);
          max-width: 1280px;
          margin: 0 auto;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }

        .cat-row::-webkit-scrollbar {
          display: none;
        }
        .cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: clamp(84px, 11vw, 120px);
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }
        .cat-circle {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background: #ebebeb;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .cat-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cat-item:hover .cat-circle {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.12);
        }
        .cat-item:focus-visible .cat-circle {
          outline: 2px solid #1a7a48;
          outline-offset: 3px;
        }
        .cat-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #1a1a1a;
          text-align: center;
          line-height: 1.3;
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-circle { transition: none; }
        }
      `}</style>
      <section className="cat-section">
        <div className="cat-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className="cat-item"
              onClick={() => goToCategory(cat.label)}
              aria-label={`Browse ${cat.label}`}
            >
              <div className="cat-circle">
                <img src={cat.src} alt={cat.alt} />
              </div>
              <span className="cat-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}