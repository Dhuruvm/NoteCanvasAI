import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const letters = 'NOTEGPT'.split('');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton:wght@400&family=Bebas+Neue:wght@400&family=Roboto+Condensed:wght@400;700;900&display=swap');
        
        .modern-landing-container {
          min-height: 100vh;
          width: 100%;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          animation: modernBackgroundPulse 10s ease-in-out infinite;
        }

        @keyframes modernBackgroundPulse {
          0%, 100% { background: #000000; }
          50% { background: #0a0a0a; }
        }

        .modern-content-container {
          text-align: center;
          z-index: 10;
          padding: 2rem;
        }

        .modern-logo-container {
          margin-bottom: 3rem;
          position: relative;
        }

        .modern-logo-letter {
          font-family: 'Anton', 'Bebas Neue', 'Roboto Condensed', sans-serif;
          font-size: clamp(4rem, 12vw, 8rem);
          font-weight: 400;
          color: #ffffff;
          display: inline-block;
          letter-spacing: -0.05em;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(50px);
          
          /* 3D Text Shadow Effect */
          text-shadow: 
            2px 2px 0px #333333,
            4px 4px 0px #222222,
            6px 6px 0px #111111,
            8px 8px 20px rgba(0, 0, 0, 0.8);
        }

        .modern-logo-letter.animate-in {
          opacity: 1;
          transform: translateY(0);
          animation: modernLetterSlideIn 0.8s ease-out forwards;
        }

        @keyframes modernLetterSlideIn {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.8);
          }
          70% {
            transform: translateY(-10px) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modern-logo-letter:hover {
          transform: scale(1.05) translateY(-5px);
          color: #99AAB5;
          text-shadow: 
            2px 2px 0px #333333,
            4px 4px 0px #222222,
            6px 6px 0px #111111,
            8px 8px 20px rgba(153, 170, 181, 0.5),
            0 0 30px rgba(153, 170, 181, 0.8),
            0 0 60px rgba(153, 170, 181, 0.6);
        }

        .modern-tagline {
          font-family: 'Roboto Condensed', sans-serif;
          font-size: clamp(0.9rem, 2.5vw, 1.2rem);
          font-weight: 700;
          color: #99AAB5;
          letter-spacing: 0.3em;
          margin-bottom: 4rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .modern-tagline.animate-in {
          opacity: 1;
          transform: translateY(0);
          animation: modernTaglineSlideIn 1s ease-out 0.8s forwards;
        }

        @keyframes modernTaglineSlideIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modern-prototype-tag {
          font-family: 'Roboto Condensed', sans-serif;
          font-size: clamp(0.8rem, 2vw, 1rem);
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.3em;
          margin-top: 1rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease;
          text-shadow: 2px 2px 0px #333333, 4px 4px 0px #222222;
        }

        .modern-prototype-tag.animate-in {
          opacity: 1;
          transform: translateY(0);
          animation: modernPrototypeSlideIn 1s ease-out 1s forwards;
        }

        @keyframes modernPrototypeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modern-enter-button {
          font-family: 'Roboto Condensed', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          background: #4f545c;
          border: 2px solid #4f545c;
          padding: 1rem 3rem;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(30px);
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }

        .modern-enter-button.animate-in {
          opacity: 1;
          transform: translateY(0);
          animation: modernButtonSlideIn 1s ease-out 1.2s forwards;
        }

        @keyframes modernButtonSlideIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modern-enter-button:hover {
          background: #5f646e;
          border: 2px solid #5f646e;
          transform: scale(1.05);
          box-shadow: 
            0 0 20px rgba(79, 84, 92, 0.5),
            0 0 40px rgba(79, 84, 92, 0.3);
        }

        .modern-enter-button:active {
          transform: scale(0.98);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .modern-content-container {
            padding: 1rem;
          }
          
          .modern-logo-container {
            margin-bottom: 2rem;
          }
          
          .modern-tagline {
            margin-bottom: 3rem;
            font-size: 0.8rem;
            letter-spacing: 0.2em;
          }
          
          .modern-enter-button {
            padding: 0.8rem 2rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .modern-logo-letter {
            letter-spacing: -0.02em;
          }
          
          .modern-tagline {
            letter-spacing: 0.15em;
            margin-bottom: 2.5rem;
          }
        }
      `}</style>
      
      <div className="modern-landing-container">
        {/* Main Content */}
        <div className="modern-content-container">
          {/* Animated Logo with Prototype Tag */}
          <div className="modern-logo-container">
            <div className="modern-title-text">
              {letters.map((letter, index) => (
                <span 
                  key={index}
                  className={`modern-logo-letter ${isLoaded ? 'animate-in' : ''}`}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    textShadow: '4px 4px 0px #444, 8px 8px 0px #333, 12px 12px 0px #222'
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
            
            {/* Prototype Tag */}
            <div className={`modern-prototype-tag ${isLoaded ? 'animate-in' : ''}`}>
              PROTOTYPE.DEV BY DHURUV
            </div>
          </div>
          
          {/* Tagline */}
          <div className={`modern-tagline ${isLoaded ? 'animate-in' : ''}`}>
            DIG DEEPER. THINK SMARTER.
          </div>
          
          {/* Get Started Button */}
          <button 
            className={`modern-enter-button ${isLoaded ? 'animate-in' : ''}`}
            onClick={onGetStarted}
          >
            GET STARTED
          </button>
        </div>
      </div>
    </>
  );
}
