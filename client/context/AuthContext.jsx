import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [socket, setSocket] = useState(null);

    const setAuthToken = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    };

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            console.log("Auth check failed:", error);
        }
    };

    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        
        const newSocket = io(backendUrl, {
            auth: { token: localStorage.getItem('token') },
            query: { userId: userData._id }
        });

        newSocket.on('connect_error', (err) => {
            console.log('Socket connection error:', err);
        });

        setSocket(newSocket);
    };

    const login = async (state, credentials) => {
        try {
            const endpoint = state === "signup" ? "/api/auth/signup" : "/api/auth/login";
            const { data } = await axios.post(endpoint, credentials);
            
            if (data.success) {
                setAuthToken(data.token);
                await checkAuth();
                toast.success(state === "signup" 
                    ? "Account created successfully" 
                    : "Logged in successfully");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || 
                (state === "signup" ? "Signup failed" : "Login failed"));
            return false;
        }
    };

    const logout = () => {
        setAuthToken(null);
        setAuthUser(null);
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        toast.success("Logged out successfully");
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
            return false;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            checkAuth();
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ 
            authUser, 
            login, 
            logout, 
            socket,
            updateProfile,
            axios,
        }}>
            {children}
        </AuthContext.Provider>
    );
};