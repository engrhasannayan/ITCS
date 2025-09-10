// server/models/Counter.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.model('Counter', counterSchema);

export async function nextSequence(name) {
  const res = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return res.seq;
}
