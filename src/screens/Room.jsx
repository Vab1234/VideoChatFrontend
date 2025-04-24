import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import styled from "styled-components";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  // WebRTC Handlers (keep all your existing functionality here)
  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <Container>
      <Header>
        <h1>Video Conference</h1>
        <ConnectionStatus connected={!!remoteSocketId}>
          {remoteSocketId ? (
            <span>Connected to: <strong>{remoteSocketId}</strong></span>
          ) : (
            <span>Waiting for participant...</span>
          )}
        </ConnectionStatus>
      </Header>

      <VideoContainer>
        {myStream && (
          <VideoCard>
            <VideoHeader>
              <h3>Your Camera</h3>
              <StatusIndicator live={true} />
            </VideoHeader>
            <ReactPlayer
              playing
              muted
              width="100%"
              height="100%"
              url={myStream}
              style={{ borderRadius: "8px" }}
            />
          </VideoCard>
        )}

        {remoteStream ? (
          <VideoCard>
            <VideoHeader>
              <h3>Participant</h3>
              <StatusIndicator live={true} />
            </VideoHeader>
            <ReactPlayer
              playing
              width="100%"
              height="100%"
              url={remoteStream}
              style={{ borderRadius: "8px" }}
            />
          </VideoCard>
        ) : (
          <Placeholder>
            <CameraIcon>🎥</CameraIcon>
            <p>No active participant</p>
          </Placeholder>
        )}
      </VideoContainer>

      <Controls>
        {remoteSocketId && (
          <ControlButton primary onClick={handleCallUser}>
            Start Call
          </ControlButton>
        )}
        {myStream && (
          <ControlButton onClick={sendStreams}>
            Share Screen
          </ControlButton>
        )}
      </Controls>
    </Container>
  );
};

export default RoomPage;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: white;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  h1 {
    margin: 0;
    color: #fff;
    font-size: 2rem;
  }
`;

const ConnectionStatus = styled.div`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: ${props => props.connected ? '#2e7d32' : '#c62828'};
  border-radius: 4px;
  display: inline-block;
  margin: 1rem auto;
  font-size: 0.9rem;
`;

const VideoContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const VideoCard = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const VideoHeader = styled.div`
  padding: 1rem;
  background: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0;
    font-size: 1rem;
    color: #fff;
  }
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.live ? '#4caf50' : '#f44336'};
`;

const Placeholder = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #666;
`;

const CameraIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
`;

const ControlButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: ${props => props.primary ? '#4caf50' : '#2196f3'};
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: ${props => props.primary ? '#45a049' : '#1976d2'};
  }
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;