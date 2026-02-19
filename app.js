import express from "express";
import mongoose from "mongoose";
import Todo from "./models/Todo.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/todoDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* =========================
   GET /  → Show all tasks
========================= */
app.get("/", async (req, res) => {
  const todos = await Todo.find();
  res.render("index", { todos });
});

/* =========================
   POST /add-task → Add task
========================= */
app.post("/add-task", async (req, res) => {
  const { task } = req.body;

  await Todo.create({ task });

  res.redirect("/");
});

/* =========================
   POST /delete-task/:id
========================= */
app.post("/delete-task/:id", async (req, res) => {
  const { id } = req.params;

  await Todo.findByIdAndDelete(id);

  res.redirect("/");
});
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
