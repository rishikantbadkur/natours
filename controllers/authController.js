const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    PasswordChangedAt: req.body.PasswordChangedAt,
    role: req.body.role,
    guides: req.body.guides,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and passwords exists..
  if (!email || !password) {
    return next(new AppError('Please provide email and Password', 400));
  }

  // Check if user exists with the given enail and password
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If everything okay send token to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1 Getting token and check if it's there
  let token;
  // Looking for the token on the request header.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // we also have to look at the cookies for JWT token
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to continue', 401)
    );
  }
  // 2 Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded); Decoded contains user id, issued at and expired at time of token

  // 3 Check if user still exists.
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does not exists.', 401)
    );
  }
  // 4 Check if user changes password after the token was issued
  const passChange = currentUser.checkPasswordChange(decoded.iat);
  if (passChange) {
    return next(
      new AppError('Password was changed recently, please login again')
    );
  }

  // 5 Grant Access to protected routes..

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.loggedIn = async (req, res, next) => {
  // 1 Getting token and check if it's there
  try {
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;

      // 2 Verification token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      // console.log(decoded); Decoded contains user id, issued at and expired at time of token

      // 3 Check if user still exists.
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      // 4 Check if user changes password after the token was issued
      const passChange = currentUser.checkPasswordChange(decoded.iat);
      if (passChange) {
        return next();
      }

      // 5 Grant the logged in view template with currentuser in locals.

      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles.. admin  lead-guide should be present in the user in query
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform that operation', 403)
      );
    }
    next();
  };

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with this email id', 404));
  }
  // Generate randon token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to users email

  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    
    await new Email(user, resetUrl).sendPawwordReset();

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Something went wrong while sending you an email, try again later'
      ),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2 If the token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Password reset link has expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4 If everything ok, send token to the client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 Get user from collection
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );

  //2 Check if posted current password is correct.
  const userPassword = req.body.passwordCurrent;

  const correctPassword = await user.correctPassword(
    userPassword,
    user.password
  );

  if (!correctPassword) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3 If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
