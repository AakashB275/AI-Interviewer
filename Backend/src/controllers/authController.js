const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken }= require("../utils/generateTokens");

module.exports.registerUser = async function (req, res) {
    console.log("Registration request received:", req.body);
    try {
        let { email, userName, password, contact } = req.body;

        let userExist = await userModel.findOne({email:email});
        if(userExist) return res.status(401).send("You aleardy have an account. Please Login")
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
        res.cookie("token",token);
        

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
        res.cookie("token", token);
        
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

