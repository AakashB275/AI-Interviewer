const express = require("express");
const router = express.Router();
const isLoggedin = require("../middlewares/isLoggedin");

const {createContact} = require("../controllers/contactController");

router.get("/", (req, res) => {
    res.send("hey");
});

router.post("/submit",createContact);

module.exports = router;