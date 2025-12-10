"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageSquare, Users2, Hand, Pin, PinOff, VolumeX, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface ClassroomRoomProps {
    roomId: string;
    userId: string;
    userName: string;
    isInstructor?: boolean;
}

interface PeerData {
    id: string;
    stream: MediaStream;
    userName?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

// --- Connection Status Indicator ---
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
    const statusConfig = {
        connecting: { color: 'bg-yellow-500', label: 'Connecting...', animate: true },
        connected: { color: 'bg-emerald-500', label: 'Connected', animate: false },
        disconnected: { color: 'bg-gray-400', label: 'Disconnected', animate: false },
        error: { color: 'bg-red-500', label: 'Connection Error', animate: true },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm border">
            <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                config.color,
                config.animate && "animate-pulse"
            )} />
            <span className="text-xs font-medium text-gray-700">{config.label}</span>
        </div>
    );
}

// --- Main Component ---
export function ClassroomRoom({ roomId, userId, userName, isInstructor = false }: ClassroomRoomProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<PeerData[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

    // States for UI
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [participants, setParticipants] = useState<string[]>([]);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState<{ userId: string; userName: string }[]>([]);
    const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

    // Remote Peers Ref: map userId -> RTCPeerConnection
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Toggle Functions
    const toggleMic = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
            setIsMicOn(!isMicOn);
        }
    }, [localStream, isMicOn]);

    const toggleCam = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !isCamOn);
            setIsCamOn(!isCamOn);
        }
    }, [localStream, isCamOn]);

    // Mute all (instructor only)
    const muteAll = useCallback(() => {
        if (socket && isInstructor) {
            socket.emit("mute-all", { roomId, instructorId: userId });
        }
    }, [socket, isInstructor, roomId, userId]);

    // Pin/Unpin participant
    const togglePin = useCallback((peerId: string) => {
        setPinnedPeerId(prev => prev === peerId ? null : peerId);
    }, []);

    // --- Media Setup ---
    useEffect(() => {
        async function getMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to get media", err);
                setConnectionStatus('error');
            }
        }
        getMedia();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // --- Socket & WebRTC Signaling ---
    useEffect(() => {
        if (!localStream) return;

        const socketInstance = io();
        setSocket(socketInstance);

        // Helper to create PeerConnection
        const createPeerConnection = (targetUserId: string) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);

            // Add local tracks
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });

            // Track connection state
            pc.onconnectionstatechange = () => {
                switch (pc.connectionState) {
                    case 'connected':
                        setConnectionStatus('connected');
                        break;
                    case 'disconnected':
                    case 'failed':
                        setConnectionStatus('disconnected');
                        break;
                    case 'connecting':
                        setConnectionStatus('connecting');
                        break;
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socketInstance.emit("ice-candidate", { roomId, candidate: event.candidate, target: targetUserId, userId });
                }
            };

            // Handle remote stream
            pc.ontrack = (event) => {
                const stream = event.streams[0];
                setPeers(prev => {
                    if (prev.find(p => p.id === targetUserId)) return prev;
                    return [...prev, { id: targetUserId, stream }];
                });
            };

            peerConnections.current.set(targetUserId, pc);
            return pc;
        };

        // 1. Connect & Join
        socketInstance.on("connect", () => {
            console.log("Connected to Signal Server");
            setConnectionStatus('connected');
            socketInstance.emit("join-room", roomId, userId);
            setParticipants(prev => (!prev.includes(userName) ? [...prev, userName] : prev));
        });

        socketInstance.on("disconnect", () => {
            setConnectionStatus('disconnected');
        });

        socketInstance.on("connect_error", () => {
            setConnectionStatus('error');
        });

        // 2. Handle New User (We initiate Call)
        socketInstance.on("user-connected", async (newUserId: string) => {
            console.log("User connected:", newUserId);
            setParticipants(prev => (!prev.includes(newUserId) ? [...prev, newUserId] : prev));

            const pc = createPeerConnection(newUserId);

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketInstance.emit("offer", { roomId, offer, target: newUserId, userId });
            } catch (e) {
                console.error("Error creating offer:", e);
            }
        });

        // 3. Handle Offer
        socketInstance.on("offer", async ({ offer, target, senderId }) => {
            if (!senderId || senderId === userId) return;

            console.log("Received Offer from:", senderId);
            setParticipants(prev => (!prev.includes(senderId) ? [...prev, senderId] : prev));

            const pc = createPeerConnection(senderId);

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketInstance.emit("answer", { roomId, answer, target: senderId, userId });
            } catch (e) {
                console.error("Error handling offer:", e);
            }
        });

        // 4. Handle Answer
        socketInstance.on("answer", async ({ answer, senderId }) => {
            if (!senderId || senderId === userId) return;
            const pc = peerConnections.current.get(senderId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // 5. Handle ICE
        socketInstance.on("ice-candidate", async ({ candidate, senderId }) => {
            if (!senderId || senderId === userId) return;
            const pc = peerConnections.current.get(senderId);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ICE:", e);
                }
            }
        });

        // 6. Handle raise/lower hand
        socketInstance.on("hand-raised", ({ userId: handUserId, userName: handUserName }) => {
            setRaisedHands(prev => [...prev.filter(h => h.userId !== handUserId), { userId: handUserId, userName: handUserName }]);
        });

        socketInstance.on("hand-lowered", ({ userId: handUserId }) => {
            setRaisedHands(prev => prev.filter(h => h.userId !== handUserId));
        });

        // 7. Handle mute command from instructor
        socketInstance.on("mute-command", () => {
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = false);
                setIsMicOn(false);
            }
        });

        return () => {
            socketInstance.disconnect();
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
        };
    }, [roomId, userId, localStream, userName]);

    // Determine layout based on pinned state
    const pinnedPeer = pinnedPeerId ? peers.find(p => p.id === pinnedPeerId) : null;
    const unpinnedPeers = pinnedPeerId ? peers.filter(p => p.id !== pinnedPeerId) : peers;

    return (
        <div className="flex flex-1 h-full bg-slate-100 text-gray-900 overflow-hidden">
            {/* Main Stage */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Connection Status */}
                <div className="absolute top-4 left-4 z-20">
                    <ConnectionIndicator status={connectionStatus} />
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    {/* Pinned View */}
                    {pinnedPeer && (
                        <div className="mb-4">
                            <div className="relative aspect-video bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 max-h-[60vh]">
                                <RemoteVideo stream={pinnedPeer.stream} id={pinnedPeer.id} />
                                <button
                                    onClick={() => togglePin(pinnedPeer.id)}
                                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg shadow hover:bg-white transition"
                                >
                                    <PinOff className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="absolute bottom-3 left-3 text-sm font-medium bg-white/90 px-3 py-1.5 rounded-lg shadow">
                                    📌 Pinned - User {pinnedPeer.id.slice(0, 4)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Video Grid */}
                    <div className={cn(
                        "grid gap-4 auto-rows-min",
                        pinnedPeer
                            ? "grid-cols-2 md:grid-cols-4"
                            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    )}>
                        {/* Local Video */}
                        <div
                            className={cn(
                                "relative bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200",
                                pinnedPeer ? "aspect-video" : "aspect-video"
                            )}
                            onDoubleClick={() => togglePin('local')}
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={cn("w-full h-full object-cover", !isCamOn && "hidden")}
                            />
                            {!isCamOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-cyan-100">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                                        {userName[0]}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                <span className="text-sm font-medium bg-white/90 px-3 py-1.5 rounded-lg shadow text-gray-700">
                                    You {!isMicOn && "🔇"}
                                </span>
                            </div>
                        </div>

                        {/* Remote Videos */}
                        {unpinnedPeers.map(peer => (
                            <div
                                key={peer.id}
                                className="relative aspect-video bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200"
                                onDoubleClick={() => togglePin(peer.id)}
                            >
                                <RemoteVideo stream={peer.stream} id={peer.id} />
                                <button
                                    onClick={() => togglePin(peer.id)}
                                    className="absolute top-3 right-3 p-2 bg-white/80 rounded-lg shadow opacity-0 hover:opacity-100 transition-opacity"
                                >
                                    <Pin className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Control Bar */}
                <div className="h-20 bg-white border-t border-gray-200 flex items-center justify-center gap-3 px-4 shadow-lg">
                    <Button
                        variant={isMicOn ? "secondary" : "destructive"}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={toggleMic}
                    >
                        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant={isCamOn ? "secondary" : "destructive"}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={toggleCam}
                    >
                        {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
                        <Monitor className="h-5 w-5" />
                    </Button>
                    <Button
                        variant={isHandRaised ? "default" : "secondary"}
                        size="icon"
                        className={cn(
                            "rounded-full h-12 w-12",
                            isHandRaised && "bg-yellow-500 hover:bg-yellow-600 text-white"
                        )}
                        onClick={() => {
                            if (socket) {
                                if (isHandRaised) {
                                    socket.emit("lower-hand", { roomId, userId });
                                    setIsHandRaised(false);
                                } else {
                                    socket.emit("raise-hand", { roomId, userId, userName });
                                    setIsHandRaised(true);
                                }
                            }
                        }}
                    >
                        <Hand className={cn("h-5 w-5", isHandRaised && "animate-bounce")} />
                    </Button>

                    {/* Mute All - Instructor Only */}
                    {isInstructor && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-orange-300 text-orange-600 hover:bg-orange-50"
                            onClick={muteAll}
                            title="Mute all participants"
                        >
                            <VolumeX className="h-5 w-5" />
                        </Button>
                    )}

                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-12 w-12 ml-4"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-[350px] bg-white border-l border-gray-200 flex flex-col hidden lg:flex">
                <Tabs defaultValue="chat" className="flex flex-col h-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-2 border-b border-gray-200 rounded-none h-14">
                        <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm h-10">
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="participants" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm h-10">
                            Participants ({participants.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="flex-1 m-0 flex flex-col h-[calc(100%-3.5rem)]">
                        {socket && <ChatPanelWithSocket socket={socket} roomId={roomId} userName={userName} />}
                    </TabsContent>

                    <TabsContent value="participants" className="flex-1 m-0 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">In this class</h3>
                            <div className="space-y-2">
                                {participants.map((p, i) => {
                                    const hasHandRaised = raisedHands.some(h => h.userName === p);
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white relative">
                                                {p[0]}
                                                {hasHandRaised && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                                        <Hand className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{p}</span>
                                            {hasHandRaised && (
                                                <span className="text-xs text-yellow-600">✋</span>
                                            )}
                                            {p === userName && (
                                                <span className="text-xs text-gray-400 ml-auto">(You)</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function RemoteVideo({ stream, id }: { stream: MediaStream, id: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-3 left-3 text-sm font-medium bg-white/90 px-3 py-1.5 rounded-lg shadow text-gray-700">
                User {id.slice(0, 4)}
            </span>
        </>
    );
}

function ChatPanelWithSocket({ socket, roomId, userName }: { socket: Socket, roomId: string, userName: string }) {
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMessage = (msg: { user: string, text: string }) => {
            setMessages((prev) => [...prev, msg]);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        };
        socket.on("chat-message", handleMessage);
        return () => {
            socket.off("chat-message", handleMessage);
        }
    }, [socket]);

    const sendMessage = () => {
        if (!input.trim()) return;
        const msg = { user: userName, text: input };
        socket.emit("chat-message", { roomId, msg });
        setMessages((prev) => [...prev, msg]);
        setInput("");
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the conversation!</div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-500">{m.user}</span>
                        <div className="bg-gray-100 p-3 rounded-xl text-sm rounded-tl-none self-start text-gray-700">
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        className="bg-white border-gray-300 text-gray-900 focus-visible:ring-1"
                        placeholder="Type a message..."
                    />
                    <Button onClick={sendMessage} size="icon" variant="secondary">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
