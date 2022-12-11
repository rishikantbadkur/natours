const path = require('path');
const express = require('express');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppEror = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');

const app = express();

//Setting view engines
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global middlewares..

//To serve static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security HTTP Headers
app.use(helmet());

//Development logging...
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Rate limiting from a single Ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this Ip! please try again in an hour',
});

app.use('/api', limiter);

//Body parser, reading data from body into req.body // Also resding data from cookie
app.use(express.json( { limit: '10kb'}));
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true, limit: '10kb'} ))

//Data sanitization against against NoSql query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Routes...
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


app.all('*', (req, res, next) => {
  next(new AppEror(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
