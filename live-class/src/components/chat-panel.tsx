"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ChatPanelProps {
    roomId: string;
    userId: string;
    userName: string;
}

export function ChatPanel({ roomId, userId, userName }: ChatPanelProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        const socketInstance = io();

        socketInstance.on("connect", () => {
            socketInstance.emit("join-room", roomId, userId);
        });

        socketInstance.on("chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [roomId, userId]);

    const sendMessage = () => {
        if (!input.trim() || !socket) return;
        const msg = { user: userName, text: input };
        socket.emit("chat-message", { roomId, msg });
        setMessages((prev) => [...prev, msg]);
        setInput("");
    }

    return (
        <div className="flex flex-col h-full border-l bg-background">
            <div className="p-2 font-bold border-b">Chat</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messages.map((m, i) => (
                    <div key={i} className="text-sm">
                        <span className="font-semibold">{m.user}: </span>
                        {m.text}
                    </div>
                ))}
            </div>
            <div className="p-2 border-t flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <Button onClick={sendMessage} size="sm">Send</Button>
            </div>
        </div>
    )
}
