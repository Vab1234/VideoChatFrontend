import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();

  const containerStyle = {
    display: "flex",
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    padding: "20px"
  };

  const cardStyle = {
    backgroundColor: "#2d2d2d",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  };

  const inputStyle = {
    width: "100%",
    padding: "14px",
    backgroundColor: "#333",
    border: "2px solid #404040",
    borderRadius: "8px",
    color: "white",
    fontSize: "16px",
    transition: "all 0.3s ease"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#888",
    fontSize: "14px",
    fontWeight: "500"
  };

  const buttonStyle = {
    padding: "14px 24px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4CAF50",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    marginTop: "16px"
  };

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      navigate(`/room/${data.room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => socket.off("room:join", handleJoinRoom);
  }, [socket, handleJoinRoom]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ 
          color: "white", 
          textAlign: "center", 
          marginBottom: "32px",
          fontSize: "28px"
        }}>
          Join Video Call
        </h1>
        
        <form onSubmit={handleSubmitForm} style={formStyle}>
          <div>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="room" style={labelStyle}>Room Code</label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={inputStyle}
              placeholder="Enter room code"
              required
            />
          </div>

          <button 
            type="submit" 
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = "#45a049"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#4CAF50"}
          >
            Join Room
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;