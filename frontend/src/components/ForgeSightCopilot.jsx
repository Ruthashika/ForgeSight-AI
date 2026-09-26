import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Minimize2,
} from "lucide-react";

function ForgeSightCopilot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi! I'm ForgeSight Copilot. Ask me about the predictive model, dataset, machine failures, sensor importance, or maintenance strategy.",
    },
  ]);

  const quickQuestions = [
    "What model are you using?",
    "How accurate is ForgeSight?",
    "What causes the most failures?",
    "Which sensor is most important?",
  ];

  const askCopilot = async (question) => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || loading) {
      return;
    }

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        text: cleanQuestion,
      },
    ];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://forgesight-ai.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: cleanQuestion,
            history: updatedMessages.map((item) => ({
              role: item.role,
              content: item.text,
            })),
            mode: "normal",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Copilot could not respond."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            data.reply ||
            "I received your request, but no response was generated.",
        },
      ]);
    } catch (error) {
      console.error("ForgeSight Copilot error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            "I couldn't connect to the ForgeSight intelligence service. Please make sure Ollama and the FastAPI backend are running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askCopilot(message);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMinimize = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          className="copilot-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open ForgeSight Copilot"
        >
          <div className="copilot-pulse"></div>

          <Bot size={23} />

          <span>Copilot</span>
        </button>
      )}

      {/* Copilot window */}
      {open && (
        <div
          className="copilot-window"
          role="dialog"
          aria-modal="false"
          aria-label="ForgeSight Copilot"
        >
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-brand">
              <div className="copilot-avatar">
                <Bot size={20} />
              </div>

              <div>
                <strong>ForgeSight Copilot</strong>

                <span>
                  AI maintenance intelligence
                </span>
              </div>
            </div>

            <div className="copilot-controls">
              <button
                type="button"
                onClick={handleMinimize}
                aria-label="Minimize Copilot"
                title="Minimize Copilot"
              >
                <Minimize2 size={16} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close Copilot"
                title="Close Copilot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="copilot-messages">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`copilot-message ${item.role}`}
              >
                {item.role === "assistant" && (
                  <div className="message-avatar">
                    <Sparkles size={13} />
                  </div>
                )}

                <div className="message-bubble">
                  {item.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="copilot-message assistant">
                <div className="message-avatar">
                  <Sparkles size={13} />
                </div>

                <div
                  className="message-bubble typing"
                  aria-label="Copilot is typing"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="copilot-quick">
              <span>Suggested questions</span>

              <div>
                {quickQuestions.map((question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() => askCopilot(question)}
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            className="copilot-input-area"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Ask ForgeSight..."
              disabled={loading}
              aria-label="Ask ForgeSight Copilot"
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ForgeSightCopilot;
