const express = require("express");
const isLoggedin = require("../middlewares/isLoggedin");
const router = express.Router();

// router.get("/", function(req, res){
//     res.json({ message: "Welcome to the AI Interviewer Backend API!" });
// });

router.get("/",function(req, res){
    let error = req.flash("error");
    res.render("index", {error});
})

router.get("/home", isLoggedin, function(req,res){
    res.render("home");
})

module.exports = router;