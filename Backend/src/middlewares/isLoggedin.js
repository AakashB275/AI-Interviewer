import jwt from 'jsonwebtoken';
import userModel from '../models/user.js';

export default async function(req,res, next){
    let token = req.cookies.token;
    
    // If no cookie token, try Authorization header (Bearer token)
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7); // Remove 'Bearer ' prefix
        }
    }
    
    if(!token){
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: "No authentication token provided. Please login first."
            });
        }
        req.flash("error", "you need to login first");
        return res.redirect("/");
    }

    try{
        let decoded = jwt.verify(token, process.env.JWT_KEY);
        let user = await userModel
            .findById(decoded.id)
            .select("-password");
        //this part means that we are fetching all the data of the user except password

        if (!user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    error: "User not found. Please login again."
                });
            }
            req.flash("error", "User not found");
            return res.redirect("/");
        }

        req.user = user;

        next();
    }
    catch(error){
        console.error("JWT verification error:", error);
        
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: "Invalid token. Please login again."
            });
        }
        req.flash("error", "something went wrong");
        return res.redirect("/");
    }
};