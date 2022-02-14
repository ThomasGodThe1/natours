process.on('uncaughtException', err => {
  console.log(`Unhandled Exceptioni! 💥 Shutting Down!`);
  console.log(err.name, err.message);
  process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log(`DB connection succesful!`);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(`Unhandled Rejection! 💥 Shutting Down!`);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
