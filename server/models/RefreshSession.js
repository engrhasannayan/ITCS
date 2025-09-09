import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: String,
    ip:        String,
  },
  { timestamps: true }
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-purge past TTL

export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);
