const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1 Get5 tour data from collection
  const tours = await Tour.find();

  //2 Build the template
  //2 Render that template using tour data from 1
  res.status(200).render('overview', {
    title: 'All tour',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1 get the data from the requested tour including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review user rating',
  });

  if (!tour) {
    return next(new AppError('No tour found with that name'), 404);
  }
  //2 Build template

  //3 Render template using data from 1
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  
  const bookings = await Booking.find({ user: req.user.id });

  // const toursPromise = bookings.map((el) => Tour.find({ _id: el.tour }));
  // const tours = await Promise.all(toursPromise);
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
  
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  const user = req.user;
  res.status(200).render('account', {
    title: 'Your Account',
    user,
  });
};
