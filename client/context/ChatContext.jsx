// Filename: context/ChatContext.js
import { createContext, useContext, useEffect, useState, useCallback } from "react"; // ADD useCallback here
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { socket, authUser } = useContext(AuthContext);

    // WRAP getUsers IN useCallback (FIX: Stops infinite re-renders)
    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages || {});
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users");
        }
    }, []); // Empty dependency array: this function does not depend on any state/props from ChatProvider itself.
            // axios and toast are imports and are stable. setUsers/setUnseenMessages are state setters and are stable.

    // WRAP getMessages IN useCallback (Good practice for context functions)
    const getMessages = useCallback(async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(prev => {
                    // Only update messages if it's the current selected chat
                    // This prevents messages from previous chats appearing
                    return userId === selectedUser?._id ? data.messages : prev;
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages");
        }
    }, [axios, setMessages, selectedUser]); // Dependencies: axios (stable), setMessages (stable setter), selectedUser (state)

    // WRAP sendMessage IN useCallback (Good practice for context functions)
    const sendMessage = useCallback(async (messageData) => {
        if (!selectedUser) {
            toast.error("Please select a user first");
            return;
        }
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages(prev => [...prev, data.newMessage]);
            } else {
                toast.error(data.message || "Failed to send message");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    }, [axios, selectedUser, setMessages, toast]); // Dependencies: axios (stable), selectedUser (state), setMessages (stable setter), toast (stable)


    // ... (rest of useEffect for socket.io, it is fine as is)
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (selectedUser && 
                ((newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) || 
                (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id))
            ) {
                if (newMessage.senderId === selectedUser._id) {
                    newMessage.seen = true;
                    axios.put(`/api/messages/mark/${newMessage._id}`); 
                }
                setMessages(prev => [...prev, newMessage]);
            } else if (newMessage.receiverId === authUser._id) {
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        };

        const handleGetOnlineUsers = (onlineUsersList) => {
            setOnlineUsers(onlineUsersList);
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("getOnlineUsers", handleGetOnlineUsers);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("getOnlineUsers", handleGetOnlineUsers);
        };
    }, [socket, selectedUser, authUser, setMessages, setUnseenMessages, setOnlineUsers]); // Added setters to dependencies

    const value = {
        messages,
        users,
        selectedUser,
        unseenMessages,
        onlineUsers,
        getUsers, // This reference is now stable!
        getMessages, // This reference is now stable!
        sendMessage, // This reference is now stable!
        setSelectedUser,
        setMessages,
        setUnseenMessages
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};