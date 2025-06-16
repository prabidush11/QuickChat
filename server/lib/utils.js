import jwt from "jsonwebtoken";
//const { sign } = pkg;

export const generateToken=(userId)=>{
    const token=jwt.sign({userId},process.env.JWT_SECRET);
    return token;
}