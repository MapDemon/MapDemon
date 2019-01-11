'use strict'

// Dependencies
const express = require('express');
const superagent = require('superagent');
const app = express();
const pg = require('pg');
const PORT = process.env.PORT || 3000;

// Load environment variables from .env file
require('dotenv').config();

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


// Route Functions

function home(request, response) {
  response.render('pages/index');
}

// Server Listener
app.listen( PORT, () => console.log(`LISTENING ON PORT:${PORT}`));
