// Filename: controllers/messageController.js
import Message from "../models/message.js"; // Your message model
import User from "../models/User.js";     // Your user model
import cloudinary from "../lib/cloudinary.js" // Your Cloudinary setup
import { io, userSocketMap } from "../server.js"; // Importing io and userSocketMap from server.js

// Get all users except logged in user for the sidebar
export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id; // Current logged-in user's ID
        
        // 1. Get all users except the current user
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // 2. Count unseen messages for each user
        const unseenMessages = {};
        await Promise.all(filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });
            if (count > 0) {
                unseenMessages[user._id] = count;
            }
        }));

        res.status(200).json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {
        console.error("Error in getUserForSidebar:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id; // Current logged-in user's ID

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        }).sort({ createdAt: 1 }); // Sort messages by creation time

        // Mark messages as seen when fetched (only if sender is selected user and receiver is current user)
        await Message.updateMany(
            { 
                senderId: selectedUserId, 
                receiverId: myId, 
                seen: false 
            },
            { $set: { seen: true } }
        );

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load messages"
        });
    }
};

// Mark a single message as seen by ID
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params; // Message ID
        await Message.findByIdAndUpdate(id, { seen: true });
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error in markMessageAsSeen:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark message"
        });
    }
};

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id; // Receiver ID from URL params
        const senderId = req.user._id; // Sender ID from authenticated user

        let imageUrl;
        if (image) {
            // Upload image to Cloudinary if provided
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // Create new message in database
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Notify receiver via Socket.IO if they are online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};