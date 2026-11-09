import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { connectDB } from "./src/lib/db.js";
import { initSocket } from "./src/lib/socket.js";

const server = http.createServer(app);
initSocket(server);

await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export server for Vercel
export default server;
