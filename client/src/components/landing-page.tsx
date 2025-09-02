import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .kiro-landing-container {
          min-height: 100vh;
          width: 100%;
          background: #0a0a0a;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .kiro-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(10px);
        }

        .kiro-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
        }

        .kiro-logo-icon {
          width: 32px;
          height: 32px;
          background-image: url('@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          border-radius: 6px;
        }

        .kiro-preview {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          color: #ffffff;
          margin-left: 0.5rem;
        }

        .kiro-hamburger {
          display: flex;
          flex-direction: column;
          gap: 3px;
          cursor: pointer;
          padding: 0.5rem;
        }

        .kiro-hamburger span {
          width: 20px;
          height: 2px;
          background: #ffffff;
          border-radius: 1px;
          transition: all 0.3s ease;
        }

        .kiro-mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          height: 100vh;
          background: #0a0a0a;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 200;
          padding: 2rem;
          overflow-y: auto;
        }

        .kiro-mobile-menu.open {
          transform: translateX(0);
        }

        .kiro-menu-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .kiro-menu-brand {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 3rem;
        }

        .kiro-menu-section {
          margin-bottom: 3rem;
        }

        .kiro-menu-section-title {
          color: #888888;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }

        .kiro-menu-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .kiro-menu-item {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 500;
          text-decoration: none;
          padding: 0.5rem 0;
        }

        .kiro-menu-item:hover {
          color: #a855f7;
        }

        .kiro-social-links {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .kiro-social-link {
          width: 40px;
          height: 40px;
          background: #333333;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          text-decoration: none;
          transition: background 0.3s ease;
        }

        .kiro-social-link:hover {
          background: #444444;
        }

        .kiro-main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
        }

        .kiro-intro-text {
          color: #888888;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 1s ease-out 0.2s forwards;
        }

        .kiro-main-title {
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 1s ease-out 0.4s forwards;
        }

        .kiro-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.3rem);
          color: #888888;
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 1s ease-out 0.6s forwards;
        }

        .kiro-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 1s ease-out 0.8s forwards;
        }

        .kiro-btn-primary {
          background: #a855f7;
          color: #ffffff;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .kiro-btn-primary:hover {
          background: #9333ea;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(168, 85, 247, 0.3);
        }

        .kiro-btn-secondary {
          background: transparent;
          color: #ffffff;
          border: 1px solid #333333;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .kiro-btn-secondary:hover {
          border-color: #555555;
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .kiro-purple-section {
          width: 100%;
          background: linear-gradient(135deg, #a855f7, #8b5cf6, #7c3aed);
          padding: 4rem 2rem;
          text-align: center;
          margin-top: 4rem;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 1s ease-out 1s forwards;
          position: relative;
          overflow: hidden;
        }

        .kiro-purple-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .kiro-purple-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .kiro-purple-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
        }

        .kiro-waitlist-btn {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 1rem 2rem;
          border-radius: 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .kiro-waitlist-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .kiro-ghost {
          position: absolute;
          bottom: -20px;
          right: 10%;
          width: 120px;
          height: 150px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 60px 60px 0 0;
          opacity: 0.8;
        }

        .kiro-ghost::before,
        .kiro-ghost::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 18px;
          background: #000000;
          border-radius: 50%;
          top: 40px;
        }

        .kiro-ghost::before {
          left: 35px;
        }

        .kiro-ghost::after {
          right: 35px;
        }

        .kiro-footer {
          background: #0a0a0a;
          padding: 2rem;
          border-top: 1px solid #333333;
          margin-top: 0;
        }

        .kiro-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: space-between;
          align-items: center;
        }

        .kiro-footer-links {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .kiro-footer-link {
          color: #888888;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .kiro-footer-link:hover {
          color: #ffffff;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .kiro-nav {
            padding: 1rem;
          }
          
          .kiro-main-content {
            padding: 1rem;
          }
          
          .kiro-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .kiro-btn-primary,
          .kiro-btn-secondary {
            width: 200px;
          }
          
          .kiro-demo-section {
            margin-top: 2rem;
            padding: 1rem;
          }
        }
      `}</style>
      
      <div className="kiro-landing-container">
        {/* Navigation */}
        <nav className="kiro-nav">
          <div className="kiro-logo">
            <div className="kiro-logo-icon"></div>
            NoteGPT
            <span className="kiro-preview">PREVIEW</span>
          </div>
          
          <div className="kiro-hamburger" onClick={() => setShowMenu(true)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`kiro-mobile-menu ${showMenu ? 'open' : ''}`}>
          <button className="kiro-menu-close" onClick={() => setShowMenu(false)}>×</button>
          
          <div className="kiro-menu-brand">KIRO</div>
          
          <div className="kiro-menu-section">
            <div className="kiro-menu-section-title">PRODUCT</div>
            <div className="kiro-menu-items">
              <a href="#" className="kiro-menu-item">About Kiro</a>
              <a href="#" className="kiro-menu-item">Pricing</a>
              <a href="#" className="kiro-menu-item">Changelog</a>
              <a href="#" className="kiro-menu-item">Downloads</a>
            </div>
          </div>
          
          <div className="kiro-menu-section">
            <div className="kiro-menu-section-title">RESOURCES</div>
            <div className="kiro-menu-items">
              <a href="#" className="kiro-menu-item">Documentation</a>
              <a href="#" className="kiro-menu-item">Blog</a>
              <a href="#" className="kiro-menu-item">FAQs</a>
              <a href="#" className="kiro-menu-item">Report a bug</a>
              <a href="#" className="kiro-menu-item">Suggest an idea</a>
              <a href="#" className="kiro-menu-item">Billing support</a>
            </div>
          </div>
          
          <div className="kiro-menu-section">
            <div className="kiro-menu-section-title">SOCIAL</div>
            <div className="kiro-social-links">
              <a href="#" className="kiro-social-link">𝕏</a>
              <a href="#" className="kiro-social-link">📱</a>
              <a href="#" className="kiro-social-link">💬</a>
              <a href="#" className="kiro-social-link">📺</a>
              <a href="#" className="kiro-social-link">🐦</a>
              <a href="#" className="kiro-social-link">📱</a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="kiro-main-content">
          <div className="kiro-intro-text">
            Introducing NoteGPT →
          </div>
          
          <h1 className="kiro-main-title">
            The AI IDE<br />
            for prototype<br />
            to production
          </h1>
          
          <p className="kiro-subtitle">
            NoteGPT helps you do your best work by bringing structure to AI coding with spec-driven development.
          </p>
          
          <div className="kiro-buttons">
            <button className="kiro-btn-primary" onClick={onGetStarted}>
              Try Now
            </button>
            <button className="kiro-btn-secondary">
              Watch Demo
            </button>
          </div>
          
        </main>
        
        {/* Purple Section */}
        <section className="kiro-purple-section">
          <div className="kiro-purple-content">
            <h2 className="kiro-purple-title">
              Build something<br />
              real in minutes
            </h2>
            <p className="kiro-purple-subtitle">
              Kiro is free during preview
            </p>
            <button className="kiro-waitlist-btn" onClick={onGetStarted}>
              Try Now
            </button>
          </div>
          <div className="kiro-ghost"></div>
        </section>
        
        {/* Footer */}
        <footer className="kiro-footer">
          <div className="kiro-footer-content">
            <div className="kiro-footer-links">
              <a href="#" className="kiro-footer-link">Site Terms</a>
              <a href="#" className="kiro-footer-link">License</a>
              <a href="#" className="kiro-footer-link">Responsible AI Policy</a>
              <a href="#" className="kiro-footer-link">Legal</a>
              <a href="#" className="kiro-footer-link">Privacy Policy</a>
              <a href="#" className="kiro-footer-link">Cookie Preferences</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
