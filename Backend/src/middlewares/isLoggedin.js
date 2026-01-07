import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

export default async function(req,res, next){
    if(!req.cookies.token){
        req.flash("error", "you need to login first");
        return res.redirect("/");
    }

    try{
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        let user = await userModel
            .findOne({userName: decoded.userName})
            .select("-password");
        //this part means that we are fetching all the data of the user except password

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
        req.redirect("/");
    }
};