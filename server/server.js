// Filename: server.js
import express from "express";
import "dotenv/config"; // Ensure dotenv is configured for environment variables
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js"; // Your database connection function
import userRouter from "./routes/userRoutes.js"; // Assuming you have userRoutes
import { Server } from "socket.io";
import messageRouter from "./routes/messageRoutes.js"; // THIS WAS ADDED/CORRECTED

const app = express();
const server = http.createServer(app);

// Define and export userSocketMap for tracking connected users (FIXED: was missing export)
export const userSocketMap = {}; // Maps userId to socketId

// Socket.io setup
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Make sure this matches your frontend URL
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling (ADDED: Essential for userSocketMap and online users)
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Get userId from handshake query (ensure your frontend sends this when connecting to socket)
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        // Emit updated online users to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        // Remove user from map on disconnect
        for (const id in userSocketMap) {
            if (userSocketMap[id] === socket.id) {
                delete userSocketMap[id];
                break;
            }
        }
        // Emit updated online users to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});


// Middleware
app.use(express.json({ limit: "4mb" })); // To parse JSON bodies
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true // Allow sending cookies/auth headers
}));

// Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter); // THIS WAS ADDED/CORRECTED: Mounting message routes
app.get("/api/status", (req, res) => res.send("Server is live"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ success: false, message: "Server error" });
});

// Start server

await connectDB(); // Connect to MongoDB
if(process.env.NODE_ENV!=="production"){
    const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

//export server for vercel
export default server;
