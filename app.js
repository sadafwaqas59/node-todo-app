import express from "express";
import mongoose from "mongoose";
import path from "path";
import bcrypt from "bcryptjs";
import multer from "multer";
import session from "express-session";
import User from "./models/User.js";
import Todo from "./models/Todo.js";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: true // <--- IMPORTANT: true so session works immediately
}));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/todoDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Multer storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
// Auth middleware
function isAuth(req, res, next){
  if(!req.session.userId) return res.redirect("/signin");
  next();
}

// --- Auth Routes ---

app.get("/signup", (req,res)=>res.render("signup"));

app.post("/signup", async (req,res)=>{
  const {name,email,password} = req.body;
  const hash = await bcrypt.hash(password,10);
  const user = new User({name,email,password:hash});
  await user.save();
  res.redirect("/signin");
});

app.get("/signin", (req,res)=>res.render("signin"));

app.post("/signin", async (req,res)=>{
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.send("User not found");
  const match = await bcrypt.compare(password,user.password);
  if(!match) return res.send("Invalid password");

  req.session.userId = user._id;
  req.session.save(() => res.redirect("/"));
});

app.get("/logout", (req,res)=>{
  req.session.destroy();
  res.redirect("/signin");
});

// --- Todo Routes ---

app.get("/", isAuth, async (req,res)=>{
  const todos = await Todo.find({ userId: req.session.userId });
  console.log("Todos:", todos);
  res.render("index", { todos });
});

app.post("/add", isAuth, upload.single("image"), async (req,res)=>{
  const todo = new Todo({
    task: req.body.task,
    image: req.file ? req.file.filename : null,
    userId: req.session.userId
  });
  await todo.save();
  res.redirect("/");
});

app.get("/delete/:id", isAuth, async (req,res)=>{
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.redirect("/");
});

app.get("/complete/:id", isAuth, async (req,res)=>{
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.session.userId });
  if(todo){
    todo.isCompleted = !todo.isCompleted;
    await todo.save();
  }
  res.redirect("/");
});
app.post("/edit/:id", isAuth, async (req,res)=>{
  await Todo.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, { task: req.body.task });
  res.redirect("/");
});

// Start server
app.listen(3000, ()=>console.log("Server running on port 3000"));