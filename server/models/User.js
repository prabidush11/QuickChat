import { mongoose } from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6, select: false },
    profilePic: { type: String, default: "" },
    bio: { type: String }
}, { timestamps: true });

// Case-insensitive email index
userSchema.index({ email: 1 }, { collation: { locale: 'en', strength: 2 } });

export default mongoose.model("User", userSchema);