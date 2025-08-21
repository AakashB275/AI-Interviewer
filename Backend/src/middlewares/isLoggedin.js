const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

module.exports = async function(req,res, next){
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
        req.flash("error", "something went wrong");
        req.redirect("/");
    }
};