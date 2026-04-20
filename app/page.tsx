"use client";

import { useState, useEffect, useRef } from "react";

const services = [
  { icon: "🛒", label: "Groceries", sub: "Supermarkets & mama mbogas" },
  { icon: "💊", label: "Pharmacy", sub: "Medicine & health" },
  { icon: "🏃", label: "Errands", sub: "Bills, docs & queues" },
  { icon: "🍖", label: "Food", sub: "Restaurants & local joints" },
  { icon: "🔧", label: "Home Help", sub: "Plumber, electrician" },
  { icon: "💈", label: "Beauty", sub: "Barber, nails, massage" },
];

const steps = [
  { n: "01", title: "Pick a service", body: "Choose from groceries, errands, pharmacy, home help and more." },
  { n: "02", title: "A rider is assigned", body: "A Sasa Now rider near you accepts your order in seconds." },
  { n: "03", title: "Track in real time", body: "Watch your rider move live on the map to your door." },
  { n: "04", title: "Delivered. Done.", body: "Pay via M-Pesa or card. Rate your experience after." },
];

const stats = [
  { value: "45", unit: "min", label: "Avg. delivery time" },
  { value: "24/7", unit: "", label: "Always open" },
  { value: "50+", unit: "", label: "Services" },
];

function useInView(ref: React.RefObject<Element | null>, threshold = 0.12) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const servicesInView = useInView(servicesRef);
  const stepsInView = useInView(stepsRef);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F6F1; color: #111210; overflow-x: hidden; }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          transition: background 0.25s, border-color 0.25s;
        }
        .nav.solid {
          background: rgba(248,246,241,0.96);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          backdrop-filter: blur(10px);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
          color: #111210; text-decoration: none;
        }
        .nav-mark {
          width: 30px; height: 30px; background: #E8A020;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-links a {
          font-size: 14px; font-weight: 500; color: #6B6A65;
          text-decoration: none; transition: color 0.2s; white-space: nowrap;
        }
        .nav-links a:hover { color: #111210; }
        .nav-actions { display: flex; align-items: center; gap: 8px; }

        .btn-outline {
          padding: 8px 16px; border-radius: 8px;
          border: 1.5px solid rgba(0,0,0,0.14);
          background: transparent; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; color: #111210;
          cursor: pointer; white-space: nowrap; text-decoration: none;
          display: inline-flex; align-items: center;
          transition: border-color 0.2s;
        }
        .btn-outline:hover { border-color: #111210; }

        .btn-solid {
          padding: 8px 18px; border-radius: 8px;
          background: #E8A020; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          color: #111210; cursor: pointer; white-space: nowrap;
          text-decoration: none; display: inline-flex; align-items: center;
          transition: background 0.2s;
        }
        .btn-solid:hover { background: #C4871A; }

        /* ── HAMBURGER ── */
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #111210; border-radius: 2px; transition: all 0.2s; }

        /* ── MOBILE MENU ── */
        .mobile-menu {
          display: none; position: fixed; inset: 60px 0 0 0; z-index: 99;
          background: #F8F6F1; padding: 28px 20px;
          flex-direction: column; gap: 20px;
          border-top: 1px solid rgba(0,0,0,0.07);
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 500;
          color: #111210; text-decoration: none; padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .mobile-menu .mobile-cta {
          display: flex; flex-direction: column; gap: 10px; margin-top: 8px;
        }
        .mobile-menu .btn-solid, .mobile-menu .btn-outline {
          width: 100%; justify-content: center; padding: 14px;
          font-size: 15px; border-radius: 10px;
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; padding: 100px 20px 64px;
          display: flex; flex-direction: column; justify-content: center;
          position: relative; overflow: hidden;
        }
        .hero-accent-1 {
          position: absolute; width: 400px; height: 400px;
          background: #FEF3DC; border-radius: 50%;
          top: -80px; right: -120px; pointer-events: none;
          opacity: 0.7;
        }
        .hero-accent-2 {
          position: absolute; width: 200px; height: 200px;
          background: #E6F5ED; border-radius: 50%;
          bottom: 40px; left: -60px; pointer-events: none;
          opacity: 0.8;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #FEF3DC; color: #854F0B;
          border: 1px solid rgba(232,160,32,0.3);
          border-radius: 100px; padding: 5px 14px;
          font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          margin-bottom: 22px; width: fit-content;
          animation: fadeUp 0.5s ease both;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #E8A020;
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(40px, 10vw, 80px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -1.5px; color: #111210;
          max-width: 700px;
          animation: fadeUp 0.5s 0.1s ease both;
        }
        .hero h1 .amber { color: #E8A020; }

        .hero-sub {
          font-size: clamp(15px, 2vw, 18px); color: #6B6A65;
          line-height: 1.65; margin-top: 20px; max-width: 480px;
          animation: fadeUp 0.5s 0.18s ease both;
        }

        .hero-cta {
          display: flex; gap: 10px; margin-top: 32px; flex-wrap: wrap;
          animation: fadeUp 0.5s 0.26s ease both;
        }
        .hero-cta .btn-solid { padding: 13px 28px; font-size: 15px; border-radius: 10px; }
        .hero-cta .btn-outline { padding: 12px 24px; font-size: 15px; border-radius: 10px; }

        .hero-stats {
          display: flex; gap: 28px; margin-top: 48px; flex-wrap: wrap;
          animation: fadeUp 0.5s 0.34s ease both;
        }
        .stat-item {}
        .stat-value {
          font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
          color: #111210; line-height: 1; letter-spacing: -1px;
        }
        .stat-unit { font-size: 14px; color: #E8A020; font-weight: 700; }
        .stat-label { font-size: 12px; color: #9B9A95; margin-top: 3px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        /* ── MARQUEE ── */
        .marquee-wrap { background: #111210; overflow: hidden; padding: 12px 0; }
        .marquee-track { display: flex; width: max-content; animation: marquee 20s linear infinite; }
        .marquee-item {
          display: flex; align-items: center; gap: 8px; padding: 0 24px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.35); letter-spacing: 0.06em; text-transform: uppercase;
          white-space: nowrap;
        }
        .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: #E8A020; flex-shrink: 0; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* ── SECTIONS ── */
        section { padding: 72px 20px; }
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #E8A020; margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(26px, 5vw, 44px);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.8px;
          color: #111210; max-width: 520px;
        }

        /* ── SERVICES ── */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px; margin-top: 36px;
        }
        .service-card {
          background: #fff; border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.07);
          padding: 20px 16px; cursor: pointer;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.45s ease, transform 0.45s ease, border-color 0.2s;
        }
        .service-card.visible { opacity: 1; transform: translateY(0); }
        .service-card:hover { border-color: #E8A020; }
        .service-icon { font-size: 26px; margin-bottom: 10px; }
        .service-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #111210; margin-bottom: 3px; }
        .service-sub { font-size: 12px; color: #9B9A95; line-height: 1.4; }

        /* ── HOW IT WORKS ── */
        .how-section { background: #111210; }
        .how-section .section-label { color: #E8A020; }
        .how-section .section-title { color: #fff; }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1px; margin-top: 40px;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden;
        }
        .step-card {
          padding: 28px 22px; background: rgba(255,255,255,0.03);
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .step-card.visible { opacity: 1; transform: translateY(0); }
        .step-n { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; color: #E8A020; margin-bottom: 14px; letter-spacing: 0.06em; }
        .step-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.2; }
        .step-body { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* ── CTA ── */
        .cta-section { background: #E8A020; text-align: center; padding: 72px 20px; }
        .cta-section .section-title { color: #111210; margin: 0 auto 10px; text-align: center; }
        .cta-sub { font-size: 16px; color: rgba(0,0,0,0.5); margin-bottom: 32px; }
        .cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .btn-dark { padding: 14px 32px; background: #111210; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 15px; color: #fff; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .btn-dark:hover { background: #2C2C2A; }
        .btn-white { padding: 13px 28px; background: rgba(255,255,255,0.35); border: 1.5px solid rgba(0,0,0,0.12); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 15px; color: #111210; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .btn-white:hover { background: rgba(255,255,255,0.5); }

        /* ── FOOTER ── */
        footer { background: #111210; padding: 48px 20px 28px; }
        .footer-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 28px; margin-bottom: 40px; }
        .footer-brand { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff; }
        .footer-tagline { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
        .footer-links a { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: #fff; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.2); }
        .footer-domain { font-size: 12px; color: #E8A020; font-weight: 500; }

        /* ── RESPONSIVE ── */
        @media (min-width: 640px) {
          .nav { padding: 0 32px; }
          .hamburger { display: none !important; }
          section { padding: 88px 32px; }
          .hero { padding: 120px 32px 80px; }
          .cta-section { padding: 88px 32px; }
          footer { padding: 56px 32px 32px; }
        }

        @media (max-width: 639px) {
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .hamburger { display: flex !important; }
          .steps-grid { grid-template-columns: 1fr; }
          .hero-stats { gap: 20px; }
          .stat-value { font-size: 22px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? " solid" : ""}`}>
        <a href="login" className="nav-logo">
          <div className="nav-mark">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          sasa<span style={{ color: "#E8A020" }}>now</span>
        </a>

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#how">How it works</a>
          <a href="/rider/signup">Become a rider</a>
        </div>

        <div className="nav-actions">
          <a href="/login" className="btn-outline">Sign in</a>
          <a href="/signup" className="btn-solid">Order now</a>
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="/rider/signup" onClick={() => setMenuOpen(false)}>Become a rider</a>
        <div className="mobile-cta">
          <a href="/signup" className="btn-solid" onClick={() => setMenuOpen(false)}>Order now</a>
          <a href="/login" className="btn-outline" onClick={() => setMenuOpen(false)}>Sign in</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-accent-1" />
        <div className="hero-accent-2" />

        <div className="hero-badge">
          <div className="badge-dot" />
          Live in Nairobi
        </div>

        <h1>
          Nairobi<br />
          delivered.<br />
          <span className="amber">Sasa hivi.</span>
        </h1>

        <p className="hero-sub">
          Groceries, errands, pharmacy, home services — anything you need across the city, under 45 minutes.
        </p>

        <div className="hero-cta">
          <a href="/signup" className="btn-solid">Order sasa →</a>
          <a href="#how" className="btn-outline">How it works</a>
        </div>

        <div className="hero-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">
                {s.value}<span className="stat-unit">{s.unit}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) =>
            ["Groceries", "Pharmacy", "Errands", "Food", "Home Services", "Beauty", "Auto", "Laundry", "Pets", "Documents"].map((s) => (
              <div key={`${i}-${s}`} className="marquee-item">
                <div className="marquee-dot" />
                {s}
              </div>
            ))
          )}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" ref={servicesRef}>
        <div className="section-label">What we deliver</div>
        <h2 className="section-title">Every errand. One app.</h2>
        <div className="services-grid">
          {services.map((s, i) => (
            <div
              key={s.label}
              className={`service-card${servicesInView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 55}ms` }}
              onClick={() => window.location.href = "/signup"}
            >
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.label}</div>
              <div className="service-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how-section" ref={stepsRef}>
        <div className="section-label">How it works</div>
        <h2 className="section-title">From request to doorstep in minutes.</h2>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`step-card${stepsInView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="step-n">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="section-title">Ready to order sasa?</h2>
        <p className="cta-sub">Pay via M-Pesa. No waiting. No hassle.</p>
        <div className="cta-actions">
          <a href="/signup" className="btn-dark">Create account</a>
          <a href="/rider/signup" className="btn-white">Become a rider</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand">sasanow</div>
            <div className="footer-tagline">Nairobi delivered, sasa hivi.</div>
          </div>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="/rider/signup">Become a rider</a>
            <a href="/login">Sign in</a>
            <a href="/signup">Sign up</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 Sasa Now. All rights reserved.</div>
          <div className="footer-domain">sasanow.co.ke</div>
        </div>
      </footer>
    </>
  );
}
