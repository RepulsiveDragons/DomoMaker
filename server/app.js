require('dotenv').config();
const path = require('path'); 
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/DomoMaker';
mongoose.connect(dbURI).catch((err) => {
  if(err){
      console.log('Could not connect to database');
      throw err;
  }
});
const url = process.env.REDISCLOUD_URL;
console.log(url);
const redisClient = redis.createClient({
  //url: process.env.REDISCLOUD_URL,
  url: 'redis://default:KgC0dXLPCCcSBuyzuRwoUsbvXefVlx1o@redis-14530.c84.us-east-1-2.ec2.cloud.redislabs.com:14530',
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
  const app = express();

  app.use(helmet());
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted`)));
  app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true}));
  app.use(bodyParser.json());
  app.use(session({
    key: 'sessionid',
    store: new RedisStore({
      client: redisClient,
    }),
    secret: 'Domo Arigato',
    resave: false,
    saveUnitialized: false,
  }))
  app.engine('handlebars', expressHandlebars.engine({ defaultLayout: ''}));
  app.set('view engine', 'handlebars');
  app.set('views',`${__dirname}/../views`);

  router(app);

  app.listen(port, (err) => {
    if (err) {throw err;}
    console.log(`Listening on port ${port}`);
  })
})
