import { useState, useEffect } from "react";
import { LandingPage } from "@/components/landing-page";
import { KiroChatInterface } from "@/components/kiro-chat-interface";

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);

  // Apply Kiro dark theme
  useEffect(() => {
    document.body.classList.add('dark');
    document.documentElement.style.background = 'hsl(210, 14%, 7%)'; // Kiro background
    document.body.style.background = 'hsl(210, 14%, 7%)';
  }, []);

  // Show landing page initially, then transition to Kiro interface
  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return <KiroChatInterface />;
}