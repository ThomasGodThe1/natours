const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      trim: true,
      maxlength: [40, 'A name must have less than or equal to 40 characters'],
      minlength: [2, 'A name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'A user must have an email address'],
      unique: true,
      validate: [validator.isEmail, 'Please enter a valid email address'],
      lowercase: true
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'A user must have a password'],
      minlength: [8, 'A password must have at least 8 characters'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'You need to confirm your password'],
      minlength: [8, 'A password must have at least 8 characters'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.pre('save', async function(next) {
  // Only run this funcion if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
