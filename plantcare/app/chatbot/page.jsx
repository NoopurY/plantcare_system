// app/chatbot/page.jsx - AI Plant Care Assistant
'use client';
import { useState, useRef, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import { Bot, Send, Sparkles, User, RefreshCw, AlertCircle, Leaf } from 'lucide-react';

const SUGGESTIONS = [
  "Why are the lower leaves of my Monstera turning yellow?",
  "What is the optimal watering frequency for a Snake Plant in low light?",
  "How do I recognize and treat root rot in indoor houseplants?",
  "What type of fertilizer is best suited for juvenile Ficus lyrata?"
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your VerdeBase Plant Care Assistant. I can help diagnose symptoms, advise on watering schedules, and recommend soil treatments based on your plant collection. How can I assist you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(promptText) {
    const textToSend = promptText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response || "I couldn't process that query. Please try rephrasing your plant question.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I'm having trouble connecting to the plant intelligence API right now. Please ensure your Groq API key is configured.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(134,188,66,0.15)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={24} style={{ color: 'var(--green-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                AI Botanical Assistant
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                Secondary contextual advice engine powered by LLM plant diagnostics
              </p>
            </div>
          </div>
          <span className="badge badge-healthy" style={{ fontSize: '11px' }}>
            Assistant Active
          </span>
        </div>

        {/* Chat Card */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Messages scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  flexDirection: m.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: m.sender === 'user' ? 'var(--green-muted)' : 'rgba(74,154,191,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {m.sender === 'user' ? (
                    <User size={18} style={{ color: 'var(--text-primary)' }} />
                  ) : (
                    <Bot size={18} style={{ color: '#4a9abf' }} />
                  )}
                </div>

                <div
                  style={{
                    background: m.sender === 'user' ? 'rgba(134,188,66,0.18)' : 'var(--bg-panel)',
                    border: `1px solid ${m.sender === 'user' ? 'rgba(134,188,66,0.3)' : 'var(--border)'}`,
                    borderRadius: '16px',
                    borderTopRightRadius: m.sender === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: m.sender === 'bot' ? '4px' : '16px',
                    padding: '14px 18px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      textAlign: m.sender === 'user' ? 'right' : 'left',
                      marginTop: '6px'
                    }}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '82%' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(74,154,191,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} style={{ color: '#4a9abf' }} />
                </div>
                <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--green-primary)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Synthesizing plant diagnosis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Sparkles size={12} style={{ color: 'var(--green-primary)' }} /> Suggested:
            </span>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--green-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <input
              type="text"
              className="input"
              placeholder="Ask about plant symptoms, care frequency, soil chemistry..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || loading}
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
