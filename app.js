const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Todo = require("./models/Todo");

const app = express();

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

// server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
