// Filename: routes/messageRoutes.js
import express from "express";
import { protectRoute } from "../middleware/auth.js"; // Assuming this is your auth middleware
// User model might not be needed here if only used in controller, but kept for safety.
import User from "../models/User.js"; 

// IMPORT CONTROLLER FUNCTIONS (FIXED: These were undefined before)
import { 
    getUserForSidebar, 
    getMessages, 
    markMessageAsSeen, 
    sendMessage 
} from "../controllers/messageControllers.js"; 

const router = express.Router();

// GET users for sidebar (FIXED: Replaced inline logic with controller function)
router.get("/users", protectRoute, getUserForSidebar);

// GET messages for a specific chat
router.get("/:id", protectRoute, getMessages);

// PUT (update) to mark a message as seen
router.put("/mark/:id", protectRoute, markMessageAsSeen);

// POST to send a message
router.post("/send/:id", protectRoute, sendMessage);

export default router;