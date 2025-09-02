import { useState, useRef, useEffect } from "react";
import logoIcon from '@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Mic, 
  Paperclip, 
  Send, 
  Settings,
  FileText,
  Sparkles,
  Brain,
  Upload,
  Menu,
  X,
  MoreHorizontal,
  Hash
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function KiroChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("Claude Sonnet 4.0");
  const [autopilot, setAutopilot] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputValue("");
      
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I'll analyze your request and help you create structured notes. Let me process this information...",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const uploadMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `📎 Uploaded: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, uploadMessage]);
    }
    event.target.value = '';
  };

  return (
    <>
      <style>{`
        .kiro-interface {
          min-height: 100vh;
          background: #1a1a1a;
          font-family: 'Inter', sans-serif;
          color: #ffffff;
        }

        .kiro-header {
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #333;
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .kiro-header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kiro-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .kiro-brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .kiro-brand-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
        }

        .kiro-preview-badge {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 0.5rem;
        }

        .kiro-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          min-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
        }

        .kiro-welcome {
          text-align: center;
          margin-bottom: 3rem;
        }

        .kiro-welcome-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .kiro-welcome-subtitle {
          color: #888888;
          font-size: 1rem;
        }

        .kiro-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .kiro-feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .kiro-feature-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #a855f7;
          transform: translateY(-2px);
        }

        .kiro-feature-card.active {
          background: rgba(168, 85, 247, 0.1);
          border-color: #a855f7;
        }

        .kiro-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .kiro-card-icon {
          width: 24px;
          height: 24px;
          color: #a855f7;
        }

        .kiro-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .kiro-card-description {
          color: #888888;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .kiro-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .kiro-messages {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          min-height: 300px;
        }

        .kiro-message {
          margin-bottom: 1.5rem;
          display: flex;
          gap: 0.75rem;
        }

        .kiro-message.user {
          flex-direction: row-reverse;
        }

        .kiro-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kiro-avatar.user {
          background: #a855f7;
          color: #ffffff;
          font-weight: 600;
        }

        .kiro-avatar.assistant {
          background: rgba(255, 255, 255, 0.1);
        }

        .kiro-message-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .kiro-message.user .kiro-message-content {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.2);
        }

        .kiro-input-area {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .kiro-input-container {
          display: flex;
          gap: 0.75rem;
          align-items: end;
        }

        .kiro-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          color: #ffffff;
          font-size: 0.95rem;
          resize: none;
          min-height: 44px;
          max-height: 120px;
        }

        .kiro-input:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .kiro-input::placeholder {
          color: #666666;
        }

        .kiro-input-controls {
          display: flex;
          gap: 0.5rem;
        }

        .kiro-control-btn {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #888888;
        }

        .kiro-control-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .kiro-control-btn.primary {
          background: #a855f7;
          border-color: #a855f7;
          color: #ffffff;
        }

        .kiro-control-btn.primary:hover {
          background: #9333ea;
        }

        .kiro-bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .kiro-model-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #888888;
        }

        .kiro-autopilot {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #888888;
        }

        .kiro-switch {
          width: 32px;
          height: 18px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .kiro-switch.active {
          background: #a855f7;
        }

        .kiro-switch-thumb {
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
        }

        .kiro-switch.active .kiro-switch-thumb {
          transform: translateX(14px);
        }

        .kiro-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #888888;
        }

        .kiro-empty-icon {
          width: 48px;
          height: 48px;
          color: #555555;
          margin-bottom: 1rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .kiro-main {
            padding: 1rem 0.5rem;
          }
          
          .kiro-cards-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            margin-bottom: 2rem;
          }
          
          .kiro-feature-card {
            padding: 1rem;
          }
          
          .kiro-input-container {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .kiro-input-controls {
            justify-content: center;
            width: 100%;
          }
          
          .kiro-bottom-bar {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .kiro-welcome-title {
            font-size: 1.5rem;
          }
          
          .kiro-cards-grid {
            gap: 0.5rem;
          }
          
          .kiro-feature-card {
            padding: 0.75rem;
          }
        }
      `}</style>

      <div className="kiro-interface">
        {/* Header */}
        <header className="kiro-header">
          <div className="kiro-header-content">
            <div className="kiro-brand">
              <img src={logoIcon} alt="NoteGPT Logo" className="kiro-brand-icon" />
              <span className="kiro-brand-text">Let's build</span>
              <span className="kiro-preview-badge">PREVIEW</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="kiro-main">
          {/* Welcome Section */}
          <div className="kiro-welcome">
            <h1 className="kiro-welcome-title">Plan, search, or build anything</h1>
          </div>

          {/* Feature Cards */}
          <div className="kiro-cards-grid">
            <div className="kiro-feature-card active" data-testid="card-note-generation">
              <div className="kiro-card-header">
                <Sparkles className="kiro-card-icon" />
                <span className="kiro-card-title">Note Coding</span>
              </div>
              <p className="kiro-card-description">
                Free-form chat for general assistance and note coding
              </p>
            </div>

            <div className="kiro-feature-card" data-testid="card-research-spec">
              <div className="kiro-card-header">
                <FileText className="kiro-card-icon" />
                <span className="kiro-card-title">Code with Spec</span>
              </div>
              <p className="kiro-card-description">
                Structured approach for building features or new apps.
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="kiro-chat-area">
            <div className="kiro-messages">
              {messages.length === 0 ? (
                <div className="kiro-empty-state">
                  <MessageSquare className="kiro-empty-icon" />
                  <p>Start a conversation to generate your first AI note</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`kiro-message ${message.type}`}>
                    <div className={`kiro-avatar ${message.type}`}>
                      {message.type === 'user' ? (
                        'U'
                      ) : (
                        <img src={logoIcon} alt="Assistant" className="w-full h-full object-contain" />
                      )}
                    </div>
                    <div className="kiro-message-content">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="kiro-input-area">
              <div className="kiro-input-container">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question or describe a task..."
                  className="kiro-input"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-message"
                />
                
                <div className="kiro-input-controls">
                  <button 
                    className="kiro-control-btn"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-attach"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  
                  <button 
                    className="kiro-control-btn"
                    data-testid="button-mic"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  
                  <button 
                    className="kiro-control-btn primary"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    data-testid="button-send"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="kiro-bottom-bar">
                <div className="kiro-model-selector">
                  <Hash className="h-4 w-4" />
                  <span>{selectedModel}</span>
                </div>
                
                <div className="kiro-autopilot">
                  <span>Autopilot</span>
                  <div 
                    className={`kiro-switch ${autopilot ? 'active' : ''}`}
                    onClick={() => setAutopilot(!autopilot)}
                    data-testid="switch-autopilot"
                  >
                    <div className="kiro-switch-thumb"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.md,.doc,.docx"
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}