import { useState, useRef, useEffect } from "react";
import logoIcon from '@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Mic, 
  Send, 
  Menu,
  MoreHorizontal,
  Edit,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function KiroChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey Dhuruv 👋\nHow's it going?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'll analyze the repository and create the requested steering rules. Let me first explore the project structure in more detail to understand the codebase better.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  return (
    <>
      <style>{`
        .chat-interface {
          height: 100vh;
          background: #0f0f0f;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #2a2a2a;
          background: #0f0f0f;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .chat-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-btn:hover {
          background: #2a2a2a;
          color: #ffffff;
        }

        /* Messages Area */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .message {
          margin-bottom: 2rem;
          padding: 0 1.5rem;
        }

        .message.user {
          display: flex;
          justify-content: flex-end;
        }

        .message.assistant {
          display: flex;
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          position: relative;
        }

        .message.user .message-content {
          background: #2a2a2a;
          border-radius: 1.5rem 1.5rem 0.5rem 1.5rem;
          padding: 1rem 1.25rem;
          color: #ffffff;
        }

        .message.assistant .message-content {
          background: transparent;
          padding: 0;
        }

        .assistant-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .assistant-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-name {
          font-weight: 600;
          color: #ffffff;
        }

        .assistant-message {
          color: #e0e0e0;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .message:hover .message-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.375rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #2a2a2a;
          color: #ffffff;
        }

        /* Typing Indicator */
        .typing-indicator {
          padding: 0 1.5rem;
          margin-bottom: 1rem;
        }

        .typing-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
          padding: 1rem 1.25rem;
          background: #1a1a1a;
          border-radius: 1rem;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: #888888;
          border-radius: 50%;
          animation: typing 1.5s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Input Area */
        .input-area {
          padding: 1rem 1.5rem 2rem;
          background: #0f0f0f;
          border-top: 1px solid #2a2a2a;
        }

        .input-container {
          max-width: 768px;
          margin: 0 auto;
          position: relative;
        }

        .input-wrapper {
          display: flex;
          align-items: end;
          background: #2a2a2a;
          border-radius: 1.5rem;
          padding: 0.75rem 1rem;
          gap: 0.75rem;
        }

        .message-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 1rem;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 200px;
          font-family: inherit;
        }

        .message-input::placeholder {
          color: #888888;
        }

        .input-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .input-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .input-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .send-btn {
          background: #ffffff;
          color: #000000;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover {
          background: #e0e0e0;
        }

        .send-btn:disabled {
          background: #404040;
          color: #888888;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .chat-header {
            padding: 1rem;
          }

          .message {
            padding: 0 1rem;
          }

          .message-content {
            max-width: 85%;
          }

          .input-area {
            padding: 1rem;
          }

          .typing-indicator {
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .message-content {
            max-width: 90%;
          }

          .input-wrapper {
            padding: 0.5rem 0.75rem;
          }
        }
      `}</style>

      <div className="chat-interface">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <Button variant="ghost" size="sm" className="header-btn md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="chat-title">NoteGPT</h1>
          </div>
          
          <div className="header-actions">
            <button className="header-btn" data-testid="button-edit">
              <Edit className="h-5 w-5" />
            </button>
            <button className="header-btn" data-testid="button-menu">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.type === 'assistant' && (
                  <div className="assistant-header">
                    <div className="assistant-avatar">
                      <img 
                        src={logoIcon} 
                        alt="Kiro" 
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <span className="assistant-name">Kiro</span>
                  </div>
                )}
                
                <div className={message.type === 'assistant' ? 'assistant-message' : ''}>
                  {message.content}
                </div>

                {message.type === 'assistant' && (
                  <div className="message-actions">
                    <button className="action-btn" data-testid="button-copy">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="action-btn" data-testid="button-thumbs-up">
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button className="action-btn" data-testid="button-thumbs-down">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button className="action-btn" data-testid="button-regenerate">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button className="action-btn" data-testid="button-share">
                      <Share className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-content">
                <div className="assistant-avatar">
                  <img 
                    src={logoIcon} 
                    alt="Kiro" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  adjustTextareaHeight();
                }}
                placeholder="Ask anything"
                className="message-input"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="input-message"
              />
              
              <div className="input-actions">
                <button className="input-btn" data-testid="button-mic">
                  <Mic className="h-5 w-5" />
                </button>
                
                <button 
                  className={`input-btn send-btn ${!inputValue.trim() ? 'opacity-50' : ''}`}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}