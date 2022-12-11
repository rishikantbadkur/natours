const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

async function connect() {
  await mongoose
    .connect(DB, {
      useNewUrlParser: true,
    })
    .then(() => {
      console.log('DB Connection successfull');
    });
}

connect();

const port = 8000;

const server = app.listen(port, () => {
  console.log('server listening on port 8000....');
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
