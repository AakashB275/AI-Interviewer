const express = require("express");
const app = express();
const db = require("./config/mongoose-connect");
const cookieParser = require("cookie-parser");
const path = require("path");
const usersRouter = require("./src/routes/usersRouter");
const config = require("config");
const dbauth = config.get("MONGODB_URI");
const expressSession = require("express-session");
const flash = require("connect-flash");

console.log("Using DB URI:", dbauth);


require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(
    expressSession({
        resave:false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
)
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");


// app.get("/", (req,res)=>{
//     res.send("hey");
// });
app.use("/users", usersRouter);

app.listen(3000);