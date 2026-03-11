import express from "express";
import mongoose from "mongoose";
import path from "path";
import bcrypt from "bcryptjs";
import multer from "multer"; 
import session from "express-session";
import User from "./models/User.js";
import { fileURLToPath } from "url";

const app = express();

// create __dirname manually for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/todoDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


//  ROUTES

//  GET / → fetch all tasks
app.get("/", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.render("index", { todos });
  } catch (err) {
    console.log(err);
  }
});

//  POST /add-task → add new task
app.post("/add-task", async (req, res) => {
  try {
    const newTodo = new Todo({
      task: req.body.task
    });

    await newTodo.save();
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

// POST /delete-task/:id → delete task
app.post("/delete-task/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
  app.post("/complete-task/:id", async (req, res) => {
  try {
    await Todo.findByIdAndUpdate(req.params.id, {
      isCompleted: true,
    });
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
//POST /edit-task/:id → Update task text
app.post("/edit-task/:id", async (req, res) => {
  try {
    await Todo.findByIdAndUpdate(req.params.id, {
      task: req.body.task,
    });
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
});
  // signup route
  app.post("/signup", async(req,res)=>{

 const {name,email,password} = req.body;

 const hash = await bcrypt.hash(password,10);

 const user = new User({
  name,
  email,
  password:hash
 });

 await user.save();

 res.redirect("/signin");
});
//signin route
app.post("/signin", async(req,res)=>{

 const {email,password} = req.body;

 const user = await User.findOne({email});

 if(!user){
  return res.send("User not found");
 }

 const match = await bcrypt.compare(password,user.password);

 if(!match){
  return res.send("Invalid password");
 }

 req.session.userId = user._id;

 res.redirect("/");
});
function isAuth(req,res,next){

 if(!req.session.userId){
  return res.redirect("/signin");
 }

 next();
}
app.get("/", isAuth, async(req,res)=>{

 const todos = await Todo.find({
  userId:req.session.userId
 });

 res.render("index",{todos});
});
app.post("/add", isAuth, async(req,res)=>{

 const todo = new Todo({
  task:req.body.task,
  userId:req.session.userId
 });

 await todo.save();

 res.redirect("/");
});
app.get("/delete/:id", isAuth, async(req,res)=>{

 await Todo.findOneAndDelete({
  _id:req.params.id,
  userId:req.session.userId
 });

 res.redirect("/");
});
app.get("/logout",(req,res)=>{

 req.session.destroy();

 res.redirect("/signin");

});
const storage = multer.diskStorage({

 destination:"uploads/",

 filename:(req,file,cb)=>{
  cb(null,Date.now()+"-"+file.originalname);
 }

});

const upload = multer({storage});
app.post("/add", isAuth, upload.single("image"), async(req,res)=>{

 const todo = new Todo({

  task:req.body.task,
  image:req.file.filename,
  userId:req.session.userId

 });

 await todo.save();

 res.redirect("/");
});
// server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
