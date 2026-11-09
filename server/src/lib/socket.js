import { Server } from "socket.io";

// Maps userId to socketId
export const userSocketMap = {};

// Initialized in initSocket(); ESM live binding keeps importers up to date
export let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const id in userSocketMap) {
        if (userSocketMap[id] === socket.id) {
          delete userSocketMap[id];
          break;
        }
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};
