import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    previousTokenHash: { type: String, default: null },
    rotatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
      match: [/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, 'Name contains unsupported characters.']
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email address cannot exceed 254 characters.'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.']
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      maxlength: [72, 'Password cannot exceed 72 characters.'],
      validate: {
        validator(value) {
          return !this.isModified('password') || (/[A-Za-z]/.test(value) && /\d/.test(value) && Buffer.byteLength(value, 'utf8') <= 72);
        },
        message: 'Password must include a letter and a number and fit within 72 UTF-8 bytes.'
      }
    },
    authVersion: { type: Number, default: 0, select: false, min: 0 },
    refreshTokens: {
      type: [refreshSessionSchema],
      default: [],
      validate: { validator: (sessions) => sessions.length <= 5, message: 'No more than five active devices are allowed.' }
    },
    // Kept temporarily so accounts created before cookie based sessions can be migrated on refresh.
    refreshToken: { type: String, default: null, select: false }
  },
  { timestamps: true, strict: 'throw' }
);

userSchema.index({ 'refreshTokens.tokenHash': 1 }, { sparse: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
