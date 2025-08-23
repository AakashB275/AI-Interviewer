const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken }= require("../utils/generateTokens");

module.exports.registerUser = async function (req, res) {
    console.log("Registration request received:", req.body);
    try {
        if (!email || !userName || !password || !contact) {
            return res.status(400).json({ 
                success: false,
                error: "All fields are required" 
            });
        }
        let { email, userName, password, contact } = req.body;

        let userExist = await userModel.findOne({email:email});
        if(userExist) return res.status(401).send("You aleardy have an account. Please Login")

        let userNameExist = await userModel.findOne({ userName: userName });
        if (userNameExist) {
            return res.status(409).json({ 
                success: false,
                error: "Username already taken. Please choose another" 
            });
        }
        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create the user with hashed password
        let user = await userModel.create({
            email,
            userName,
            password: hashedPassword,
            contact
        });

        let token = generateToken(user);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // send back clean response
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName,
                contact: user.contact,
                // password: user.password 
            }
        });
    } catch (err) {
        console.error("Error in register:", err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports.loginUser = async function(req, res){
    try {
        if (!userName || !password) {
            return res.status(400).json({ 
                success: false,
                error: "Username and password are required" 
            });
        }
        let { userName, password } = req.body;

        let user = await userModel.findOne({ userName });
        if (!user) {
            return res.status(401).json({ error: "Username or Password incorrect" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password, function(err, result){
            if(result) {
                let token = generateToken(user);
                res.cookie("token",token);
                res.send("you can login");
            }
        });
        
        if (!isMatch) {
            return res.status(401).json({ error: "Username or Password incorrect" });
        }

        // Generate token and send success response
        let token = generateToken(user);
         res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName,
                contact: user.contact
            }
        });

    } catch (err) {
        console.error("Error in login:", err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports.logoutUser = async function(req, res) {
    try {
        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (err) {
        console.error("Error in logout:", err.message);
        return res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
}

module.exports.getCurrentUser = async function(req, res) {
    try {
        // req.user is set by the isLoggedIn middleware
        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (err) {
        console.error("Error getting current user:", err.message);
        return res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
}
