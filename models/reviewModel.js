const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: String,
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must be written by a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // });
  // this.populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } catch (err) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function(doc, next) {
  // this points to current review

  this.constructor.calcAverageRatings(this.tour);
  next();
});

// reviewSchema.pre(/^findOneAnd/, async function(next) {
//   this.r = await this.findOne();
//   console.log(this.r);
//   next();
// });

reviewSchema.post(/^findOneAnd/, async function(doc, next) {
  doc.constructor.calcAverageRatings(doc.tour);
  // console.log(`This is this ${doc}`);
  // console.log(`Review has changed ${doc.isModified('rating')}`);
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// POST /tour/2432rgkdfb/reviews
