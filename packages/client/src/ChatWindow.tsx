import { KeyboardEvent, useCallback, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

function ChatWindow() {
  const { user } = useAuth();
  const { messages, sendMessage } = useSocket();
  const [message, setMessage] = useState<string>("");

  const handleSubmit = useCallback(() => {
    sendMessage(message);
  }, [message]);

  const clearMessage = useCallback(() => {
    setMessage("");
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSubmit();
        clearMessage();
      }
    },
    [clearMessage, handleSubmit]
  );

  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        maxWidth: "100%",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            maxHeight: "90%",
            overflowY: "scroll",
          }}
        >
          {messages.map((message, i) => (
            <p
              style={{
                display: "flex",
                justifyContent: "flex-start",
                margin: "2px",
                maxWidth: "100%",
                textAlign: "left",
                textWrap: "wrap",
              }}
              key={`${message.user}-${i}`}
            >
              <strong
                style={{
                  color: message.user === user?.username ? "yellow" : "",
                }}
              >
                {message.user}:
              </strong>
              &nbsp;
              {message.content}
            </p>
          ))}
        </div>
        <div style={{ display: "flex", pointerEvents: "auto" }}>
          <input
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
            style={{ flexGrow: 1, maxWidth: "480px" }}
            type="text"
            value={message}
          />
          <button
            onClick={() => {
              handleSubmit();
              clearMessage();
            }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
