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
          width: 24px;
          height: 24px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #0a0a0a;
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
          width: 300px;
          height: 100vh;
          background: #0a0a0a;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 200;
          padding: 2rem;
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

        .kiro-menu-items {
          margin-top: 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .kiro-menu-item {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 500;
          text-decoration: none;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .kiro-menu-item:hover {
          color: #a855f7;
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

        .kiro-demo-section {
          margin-top: 4rem;
          padding: 2rem;
          border: 1px solid #333333;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 1s ease-out 1s forwards;
        }

        .kiro-demo-header {
          color: #ffffff;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .kiro-demo-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
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
            <div className="kiro-logo-icon">N</div>
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
          <div className="kiro-menu-items">
            <a href="#" className="kiro-menu-item">CHANGELOG</a>
            <a href="#" className="kiro-menu-item">PRICING</a>
            <a href="#" className="kiro-menu-item">DOCS</a>
            <a href="#" className="kiro-menu-item">RESOURCES ↓</a>
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
          
          <div className="kiro-demo-section">
            <div className="kiro-demo-header">
              <div className="kiro-demo-indicator"></div>
              Please create an email opt-in form and have it connected to the Hono backend!
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
