// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const app = express();
const db = require("./config/mongoose-connect");
const cookieParser = require("cookie-parser");
const path = require("path");
const usersRouter = require("./src/routes/usersRouter");
const indexRouter = require("./src/routes/index");
const config = require("config");
const dbauth = config.get("MONGODB_URI");
const expressSession = require("express-session");
const flash = require("connect-flash");

console.log("Using DB URI:", dbauth);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET, // Changed from EXPRESS_SESSION_SECRET to SESSION_SECRET
        cookie: {
            secure: false, // Set to true in production with HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});