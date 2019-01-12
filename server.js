'use strict'

// Dependencies
const express = require('express');
const superagent = require('superagent');
const app = express();
const pg = require('pg');
const { catchAsync } = require('./utils');

const PORT = process.env.PORT || 3000;

// Load environment variables from .env file
require('dotenv').config();

// .env variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Application Setup
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');


// Database Setup
// const client = new pg.Client(process.env.DATABASE_URL);
// client.connect();
// client.on('error', err => console.error(err));


// Routes
app.get('/home', home);
app.get('/creation', createMap);
app.get('/viewmap', viewMap);
app.get('/about', aboutPage)

app.use('/api/discord', require('./api/discord'));

// Route Functions

function home(request, response) {
  response.render('pages/index');
}

function createMap(request, response) {
  response.render('pages/creation');
}

function viewMap(request, response) {
  response.render('pages/viewmap')
}

function aboutPage(request, response) {
  response.render('pages/about')
}

// Server Listener
app.listen( PORT, () => console.log(`LISTENING ON PORT:${PORT}`));

// Error Handlers
app.use((err, req, res, next) => {
  switch (err.message) {
  case 'NoCodeProvided':
    return res.status(400).send({
      status: 'ERROR',
      error: err.message,
    });
  default:
    return res.status(500).send({
      status: 'ERROR',
      error: err.message,
    });
  }
});
