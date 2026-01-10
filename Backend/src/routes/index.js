import express from 'express';
import isLoggedin from '../middlewares/isLoggedin.js';

const router = express.Router();

router.get("/", function(req, res){
    res.json({ message: "Welcome to the AI Interviewer API!" });
});

router.get("/",function(req, res){
    let error = req.flash("error");
    res.render("index", {error});
})

router.get("/home", isLoggedin, function(req,res){
    res.render("home");
})

export default router;