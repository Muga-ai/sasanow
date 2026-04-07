"use client";

import { useState, useEffect, useRef } from "react";

const services = [
  { icon: "🛒", label: "Groceries", sub: "Naivas, Carrefour, QuickMart" },
  { icon: "💊", label: "Pharmacy", sub: "Medicine & health supplies" },
  { icon: "🏃", label: "Errands", sub: "Documents, bills, queues" },
  { icon: "🍖", label: "Food & Meals", sub: "Restaurants & local joints" },
  { icon: "🔧", label: "Home Services", sub: "Plumber, electrician, cleaner" },
  { icon: "💈", label: "Beauty", sub: "Barber, nails, massage" },
  { icon: "🚗", label: "Auto", sub: "Fuel, car wash, mechanic" },
  { icon: "🐾", label: "Pets", sub: "Food, vet, grooming" },
];

const steps = [
  { num: "01", title: "Tell us what you need", body: "Pick a service or describe your errand in plain Swahili or English." },
  { num: "02", title: "We assign a rider sasa", body: "A trusted Sasa Now rider near you accepts in seconds." },
  { num: "03", title: "Track in real time", body: "Watch your rider move to you live on the map." },
  { num: "04", title: "Done. Delivered.", body: "Pay via M-Pesa or card. Rate your experience." },
];

const stats = [
  { value: "< 45", unit: "min", label: "Average delivery" },
  { value: "24/7", unit: "", label: "Always open" },
  { value: "50+", unit: "", label: "Services offered" },
  { value: "100%", unit: "", label: "Nairobi-native" },
];

function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const servicesInView = useInView(servicesRef);
  const howInView = useInView(howRef);
  const statsInView = useInView(statsRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --amber: #E8A020;
          --amber-dark: #C4871A;
          --amber-light: #FEF3DC;
          --green: #1F6B3A;
          --green-light: #E6F5ED;
          --dark: #111210;
          --mid: #2C2C2A;
          --muted: #6B6A65;
          --surface: #F8F6F1;
          --white: #FFFFFF;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: var(--font-body);
          background: var(--surface);
          color: var(--dark);
          overflow-x: hidden;
        }

        /* NAV */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 5vw;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.3s, border-color 0.3s;
          background: ${scrolled ? "rgba(248,246,241,0.95)" : "transparent"};
          border-bottom: 1px solid ${scrolled ? "rgba(0,0,0,0.08)" : "transparent"};
          backdrop-filter: blur(12px);
        }

        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-display); font-size: 22px; font-weight: 800;
          color: var(--dark); text-decoration: none; letter-spacing: -0.5px;
        }

        .nav-logo-mark {
          width: 34px; height: 34px; background: var(--amber);
          border-radius: 9px; display: flex; align-items: center; justify-content: center;
        }

        .nav-logo-mark svg { width: 18px; height: 18px; }

        .nav-links {
          display: flex; align-items: center; gap: 32px; list-style: none;
        }

        .nav-links a {
          font-size: 14px; font-weight: 500; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--dark); }

        .btn-primary {
          background: var(--amber); color: var(--dark);
          border: none; border-radius: 8px; padding: 10px 22px;
          font-family: var(--font-body); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          text-decoration: none; display: inline-block;
        }
        .btn-primary:hover { background: var(--amber-dark); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }

        .btn-ghost {
          background: transparent; color: var(--dark);
          border: 1.5px solid rgba(0,0,0,0.18); border-radius: 8px; padding: 10px 22px;
          font-family: var(--font-body); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: border-color 0.2s, background 0.2s;
          text-decoration: none; display: inline-block;
        }
        .btn-ghost:hover { border-color: var(--dark); background: rgba(0,0,0,0.03); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 120px 5vw 80px;
          position: relative; overflow: hidden;
        }

        .hero-bg-circle {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .hero-bg-circle-1 {
          width: 600px; height: 600px;
          background: var(--amber-light);
          top: -100px; right: -150px; opacity: 0.6;
        }
        .hero-bg-circle-2 {
          width: 300px; height: 300px;
          background: var(--green-light);
          bottom: 60px; left: -80px; opacity: 0.7;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--amber-light); color: var(--amber-dark);
          border: 1px solid rgba(232,160,32,0.3);
          border-radius: 100px; padding: 6px 14px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 28px;
          animation: fadeUp 0.6s ease both;
        }

        .hero-badge-dot {
          width: 7px; height: 7px; background: var(--amber);
          border-radius: 50%; animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-headline {
          font-family: var(--font-display); font-size: clamp(52px, 8vw, 96px);
          font-weight: 800; line-height: 1.0; letter-spacing: -2px;
          color: var(--dark); max-width: 820px;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .hero-headline .accent { color: var(--amber); }
        .hero-headline .green { color: var(--green); }

        .hero-sub {
          font-size: clamp(16px, 2vw, 20px); color: var(--muted);
          max-width: 520px; line-height: 1.65; margin-top: 24px;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .hero-cta {
          display: flex; align-items: center; gap: 14px;
          margin-top: 40px; flex-wrap: wrap;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .hero-cta .btn-primary { font-size: 16px; padding: 14px 32px; border-radius: 10px; }
        .hero-cta .btn-ghost { font-size: 16px; padding: 14px 28px; border-radius: 10px; }

        .hero-social-proof {
          display: flex; align-items: center; gap: 12px;
          margin-top: 52px;
          animation: fadeUp 0.6s 0.4s ease both;
        }

        .hero-avatars { display: flex; }
        .hero-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2.5px solid var(--surface);
          margin-left: -10px; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .hero-avatar:first-child { margin-left: 0; }
        .av1 { background: #FAEEDA; color: #633806; }
        .av2 { background: #E1F5EE; color: #085041; }
        .av3 { background: #EEEDFE; color: #3C3489; }
        .av4 { background: #FAECE7; color: #712B13; }

        .hero-social-text { font-size: 13px; color: var(--muted); line-height: 1.4; }
        .hero-social-text strong { color: var(--dark); font-weight: 500; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* MARQUEE */
        .marquee-wrap {
          background: var(--dark); overflow: hidden; padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .marquee-track {
          display: flex; width: max-content;
          animation: marquee 22s linear infinite;
        }
        .marquee-item {
          display: flex; align-items: center; gap: 10px;
          padding: 0 28px; white-space: nowrap;
          font-family: var(--font-display); font-size: 13px; font-weight: 700;
          color: rgba(255,255,255,0.45); letter-spacing: 0.04em; text-transform: uppercase;
        }
        .marquee-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--amber); flex-shrink: 0; }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* SECTIONS */
        section { padding: 96px 5vw; }

        .section-label {
          font-size: 12px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--amber-dark);
          margin-bottom: 16px;
        }

        .section-title {
          font-family: var(--font-display); font-size: clamp(32px, 5vw, 52px);
          font-weight: 800; line-height: 1.1; letter-spacing: -1px;
          color: var(--dark); max-width: 600px;
        }

        /* SERVICES */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px; margin-top: 52px;
        }

        .service-card {
          background: var(--white); border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px; padding: 24px 22px;
          cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, box-shadow 0.2s;
        }

        .service-card.visible {
          opacity: 1; transform: translateY(0);
        }

        .service-card:hover {
          border-color: var(--amber); transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(232,160,32,0.12);
        }

        .service-icon { font-size: 28px; margin-bottom: 12px; }
        .service-label {
          font-family: var(--font-display); font-size: 16px; font-weight: 700;
          color: var(--dark); margin-bottom: 4px;
        }
        .service-sub { font-size: 13px; color: var(--muted); line-height: 1.4; }

        /* HOW IT WORKS */
        .how-section { background: var(--dark); }
        .how-section .section-label { color: var(--amber); }
        .how-section .section-title { color: var(--white); }

        .steps-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 2px; margin-top: 52px;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden;
        }

        .step-card {
          padding: 36px 28px; background: rgba(255,255,255,0.03);
          border-right: 1px solid rgba(255,255,255,0.06);
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .step-card:last-child { border-right: none; }
        .step-card.visible { opacity: 1; transform: translateY(0); }
        .step-card:hover { background: rgba(255,255,255,0.05); }

        .step-num {
          font-family: var(--font-display); font-size: 13px; font-weight: 800;
          color: var(--amber); letter-spacing: 0.06em; margin-bottom: 20px;
        }
        .step-title {
          font-family: var(--font-display); font-size: 18px; font-weight: 700;
          color: var(--white); margin-bottom: 10px; line-height: 1.2;
        }
        .step-body { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; }

        /* STATS */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px; margin-top: 52px;
        }

        .stat-card {
          background: var(--white); border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px; padding: 28px 24px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .stat-card.visible { opacity: 1; transform: translateY(0); }

        .stat-value {
          font-family: var(--font-display); font-size: 48px; font-weight: 800;
          color: var(--dark); line-height: 1; letter-spacing: -2px;
        }
        .stat-unit { font-size: 22px; color: var(--amber); }
        .stat-label { font-size: 14px; color: var(--muted); margin-top: 8px; }

        /* CTA SECTION */
        .cta-section {
          background: var(--amber); text-align: center; padding: 96px 5vw;
        }
        .cta-section .section-title { color: var(--dark); margin: 0 auto 12px; text-align: center; }
        .cta-sub { font-size: 18px; color: rgba(0,0,0,0.55); margin-bottom: 36px; }
        .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .btn-dark {
          background: var(--dark); color: var(--white);
          border: none; border-radius: 10px; padding: 16px 36px;
          font-family: var(--font-body); font-size: 16px; font-weight: 500;
          cursor: pointer; transition: background 0.2s; text-decoration: none; display: inline-block;
        }
        .btn-dark:hover { background: var(--mid); }

        /* FOOTER */
        footer {
          background: var(--dark); padding: 52px 5vw 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .footer-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 32px; margin-bottom: 48px;
        }
        .footer-brand {
          font-family: var(--font-display); font-size: 20px; font-weight: 800;
          color: var(--white);
        }
        .footer-tagline { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 6px; }
        .footer-links { display: flex; gap: 28px; flex-wrap: wrap; }
        .footer-links a {
          font-size: 13px; color: rgba(255,255,255,0.45);
          text-decoration: none; transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--white); }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 24px;
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.25); }
        .footer-domain { font-size: 12px; color: var(--amber); font-weight: 500; }

        /* MOBILE */
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .steps-grid { grid-template-columns: 1fr; }
          .step-card { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .hero-headline { letter-spacing: -1px; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: scrolled ? "rgba(248,246,241,0.95)" : "transparent", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent" }}>
        <a href="#" className="nav-logo">
          <div className="nav-logo-mark">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M3 13L7 7L11 11L11 7.5L16 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          sasa<span style={{ color: "var(--amber)" }}>now</span>
        </a>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="#" className="btn-ghost">Sign in</a>
          <a href="#" className="btn-primary">Order sasa →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-circle hero-bg-circle-1" />
        <div className="hero-bg-circle hero-bg-circle-2" />
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Now live in Nairobi
        </div>
        <h1 className="hero-headline">
          Nairobi<br />
          delivered.<br />
          <span className="accent">Sasa hivi.</span>
        </h1>
        <p className="hero-sub">
          Groceries, errands, pharmacy, home services — anything you need across the city, in under 45 minutes.
        </p>
        <div className="hero-cta">
          <a href="#" className="btn-primary">Start your order →</a>
          <a href="#services" className="btn-ghost">Browse services</a>
        </div>
        <div className="hero-social-proof">
          <div className="hero-avatars">
            <div className="hero-avatar av1">W</div>
            <div className="hero-avatar av2">A</div>
            <div className="hero-avatar av3">K</div>
            <div className="hero-avatar av4">F</div>
          </div>
          <div className="hero-social-text">
            <strong>Trusted by Nairobians</strong><br />
            Fast. Reliable. Local.
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) =>
            ["Groceries", "Pharmacy", "Errands", "Food Delivery", "Home Services", "Beauty", "Auto", "Pets", "Laundry", "Documents"].map((s) => (
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
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="service-icon">{s.icon}</div>
              <div className="service-label">{s.label}</div>
              <div className="service-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how-section" ref={howRef}>
        <div className="section-label">How it works</div>
        <h2 className="section-title">From request to doorstep in minutes.</h2>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`step-card${howInView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="step-num">{s.num}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} id="about">
        <div className="section-label">By the numbers</div>
        <h2 className="section-title">Built for Nairobi pace.</h2>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`stat-card${statsInView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="stat-value">
                {s.value}<span className="stat-unit">{s.unit}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="section-title">Ready? Order sasa.</h2>
        <p className="cta-sub">Everything Nairobi needs, right now. Pay via M-Pesa.</p>
        <div className="cta-actions">
          <a href="#" className="btn-dark">Order now</a>
          <a href="#" className="btn-ghost" style={{ background: "rgba(255,255,255,0.3)", borderColor: "rgba(0,0,0,0.15)" }}>
            Become a rider
          </a>
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
            <a href="#">Services</a>
            <a href="#">Become a rider</a>
            <a href="#">Partner with us</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
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
