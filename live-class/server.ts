import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        // console.log("Client connected", socket.id);

        socket.on("join-room", (roomId, userId) => {
            socket.join(roomId);
            // Store mapping if needed, or just emit
            socket.to(roomId).emit("user-connected", userId || socket.id);
        });

        // Signaling for WebRTC
        // payload: { roomId, offer/answer/candidate, target }

        socket.on("offer", (payload) => {
            // payload has target userId. 
            // We should emit to target if exists, or broadcast (but exclude sender)
            // Ideally target is socketId? Or we map userId -> socketId.
            // For now, simpler: user joins room with userId. socket.join(roomId).
            // But we don't know socketId of target easily without a map.
            // HACK: Broadcast to room, client filters if it's for them?
            // BETTER: Clients use socket.id for signaling targets?
            // "user-connected" sends the userId.

            // Let's just broadcast and include senderId (socket.id is easy senderId).
            // Actually, client sends `target: userId`. If we don't track userId->socketId, we can't emit to specific socket easily.
            // Let's just broadcast to Room (except sender) and let Client ignore if not for them.
            socket.to(payload.roomId).emit("offer", { ...payload, senderId: payload.userId || socket.id });
        });

        socket.on("answer", (payload) => {
            socket.to(payload.roomId).emit("answer", { ...payload, senderId: payload.userId || socket.id });
        });

        socket.on("ice-candidate", (payload) => {
            socket.to(payload.roomId).emit("ice-candidate", { ...payload, senderId: payload.userId || socket.id });
        });

        socket.on("chat-message", ({ roomId, msg }) => {
            socket.to(roomId).emit("chat-message", msg);
        });

        // Raise hand feature
        socket.on("raise-hand", ({ roomId, userId, userName }) => {
            io.to(roomId).emit("hand-raised", { userId, userName });
        });

        socket.on("lower-hand", ({ roomId, userId }) => {
            io.to(roomId).emit("hand-lowered", { userId });
        });

        // Mute all participants (instructor feature)
        socket.on("mute-all", ({ roomId, instructorId }) => {
            socket.to(roomId).emit("mute-command", { instructorId });
        });

        socket.on("disconnect", () => {
            // handle disconnect
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
