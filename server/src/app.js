import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.get("/api/status", (req, res) => res.send("Server is live"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});

export default app;
