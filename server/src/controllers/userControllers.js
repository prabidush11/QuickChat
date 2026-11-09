import jwt from 'jsonwebtoken';
import cloudinary from "../lib/cloudinary.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const sanitizeUser = (user) => {
    const { password, __v, ...userData } = user._doc;
    return userData;
};

export const signup = async (req, res) => {
    try {
        const { fullName, email, password, bio } = req.body;

        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: "Email already in use" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({ 
            fullName, 
            email, 
            password: hashedPassword, 
            bio 
        });

        const token = generateToken(newUser._id);
        res.status(201).json({
            success: true,
            userData: sanitizeUser(newUser),
            token,
            message: "Account created successfully"
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password required" 
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            token,
            userData: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const checkAuth = (req, res) => {
    res.status(200).json({ 
        success: true, 
        user: sanitizeUser(req.user) 
    });
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        let updateData = { bio, fullName };

        if (profilePic) {
            const upload = await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = upload.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        );

        res.status(200).json({ 
            success: true, 
            user: sanitizeUser(updatedUser) 
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Update failed" 
        });
    }
};