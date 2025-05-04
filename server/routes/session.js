'const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop().split('?')[0]; // extract db name from URI

// Connect to Mongo once and reuse
let db;
client.connect().then(() => {
  db = client.db(dbName);
  console.log('📦 Connected to MongoDB for session routes');
}).catch(console.error);

// Create session routes

module.exports = router;
