
// Import Packages

import express from "express";               // Web framework
import mongoose from "mongoose";             // MongoDB ODM
import path from "path";                     // File paths
import bcrypt from "bcryptjs";               // Password hashing
import multer from "multer";                 // File upload
import session from "express-session";       // Login sessions
import User from "./models/User.js";         // User model
import Todo from "./models/Todo.js";         // Todo model
import { fileURLToPath } from "url";         // Path utility


// App Setup

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware

app.use(express.urlencoded({ extended: true })); // Parse form data
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images


// Session Config

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: false, // Only create session if logged in
}));


// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// Connect to MongoDB

mongoose.connect("mongodb://127.0.0.1:27017/todoDB")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// File Upload Config (Multer)
const storage = multer.diskStorage({
  destination: "uploads/", 
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const types = ["image/jpeg", "image/png", "image/jpg"];
    if(types.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG/PNG images allowed"));
  }
});


// Auth Middleware

function isAuth(req, res, next){
  if(!req.session.userId) return res.redirect("/signin");
  next();
}


// AUTH ROUTES


// Signup Page
app.get("/signup", (req,res) => res.render("signup"));

// Signup Handler with Validation
app.post("/signup", async (req,res) => {
  const { name, email, password } = req.body;

  // 1. Validate input
  if(!name || !email || !password) return res.send("All fields are required");
  if(password.length < 6) return res.send("Password must be at least 6 characters");

  // 2. Check if email already exists
  const exist = await User.findOne({ email });
  if(exist) return res.send("Email already registered");

  // 3. Hash password
  const hash = await bcrypt.hash(password, 10);

  // 4. Create user
  const user = new User({ name, email, password: hash });
  await user.save();

  // 5. Redirect to login
  res.redirect("/signin");
});

// Signin Page
app.get("/signin", (req,res) => res.render("signin"));

// Signin Handler
app.post("/signin", async (req,res) => {
  const { email, password } = req.body;

  // 1. Validate
  if(!email || !password) return res.send("Email and password required");

  // 2. Find user
  const user = await User.findOne({ email });
  if(!user) return res.send("User not found");

  // 3. Compare password
  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.send("Invalid password");

  // 4. Save user session
  req.session.userId = user._id;
  res.redirect("/");
});

// Logout
app.get("/logout", (req,res) => {
  req.session.destroy();
  res.redirect("/signin");
});


// TODO ROUTES

// Dashboard
app.get("/", isAuth, async (req,res) => {
  const todos = await Todo.find({ userId: req.session.userId });
  res.render("index", { todos });
});

// Add Todo with validation & image
app.post("/add", isAuth, upload.single("image"), async (req,res) => {
  if(!req.body.task || req.body.task.trim() === "") return res.send("Task cannot be empty");

  const todo = new Todo({
    task: req.body.task,
    image: req.file ? req.file.filename : null,
    userId: req.session.userId
  });

  await todo.save();
  res.redirect("/");
});

// Delete Todo
app.get("/delete/:id", isAuth, async (req,res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.redirect("/");
});

// Toggle Complete/Incomplete
app.get("/complete/:id", isAuth, async (req,res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.session.userId });
  if(todo){
    todo.isCompleted = !todo.isCompleted;
    await todo.save();
  }
  res.redirect("/");
});

// Edit Todo with validation
app.post("/edit/:id", isAuth, async (req,res) => {
  if(!req.body.task || req.body.task.trim() === "") return res.send("Task cannot be empty");

  await Todo.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, { task: req.body.task });
  res.redirect("/");
});
// Start Server
app.listen(3000, () => console.log("Server running on port 3000"));