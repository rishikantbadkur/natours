const AppError = require('../utils/appError');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDb = (err) => {
  const key = Object.keys(err.keyValue).join(' ');
  const message = `The parameter (${key}) already exists with value of ${err.keyValue[key]}, please use another`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const Errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data, ${Errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid signature token! Please login again', 401);

const handleExpiredToken = () =>
  new AppError('Session expired! Please login again to continue', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.error('Error:', err);

  // Rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  /////API
  if (req.originalUrl.startsWith('/api')) {
    // operational, trusted error, send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // LOG error
    console.error('Error:', err);
    // programming or other error, dont leak error details to client
    // send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  ///// Rendered website
  if (err.isOperational) {
    // operational, trusted error, send message to client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  // LOG error
  console.error('Error:', err);
  // programming or other error, dont leak error details to client

  // send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production ') {
    let error = Object.assign(err);

    if (error.name === 'CastError') {
      error = handleCastErrorDb(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDb(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDb(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleExpiredToken();
    }

    sendErrorProd(error, req, res);
  }
};
