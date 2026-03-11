import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
  task: String,
  isCompleted: { type: Boolean, default: false },
  image: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Todo", todoSchema);