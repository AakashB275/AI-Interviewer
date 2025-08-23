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
const cors = require("cors");
const contactRouter = require("./src/routes/contactRouter");


console.log("Using DB URI:", dbauth);

app.use(cors({
  origin: 'http://localhost:5173', // Your React dev server URL
  credentials: true // Allow cookies to be sent
}));

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
// app.use(express.static(path.join(__dirname, "public")));
// app.set("view engine", "ejs");


// API Routes
app.use('/api/users', usersRouter);
app.use('/api', indexRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.use("/api/contact", contactRouter);


// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Frontend/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});