require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUrl = process.env.MONGO_URI;
const client = new MongoClient(mongoUrl);
let db;

async function connectDB() {
  await client.connect();
  db = client.db('cross_clipboard');
}

app.post('/api/clipboard/:code', async (req, res) => {
  const { code } = req.params;
  const { content, deviceId } = req.body;
  const now = new Date();

  await db.collection('clipboards').updateOne(
    { code },
    {
      $set: { content, lastUpdated: now, lockedBy: deviceId, lockedAt: now },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );

  res.sendStatus(204);
});

app.get('/api/clipboard/:code', async (req, res) => {
  const { code } = req.params;
  const doc = await db.collection('clipboards').findOne({ code });
  res.json(doc || {});
});

app.post('/api/ping/:code', async (req, res) => {
  const { code } = req.params;
  const { deviceId } = req.body;
  const now = new Date();

  await db.collection('devices').updateOne(
    { code, deviceId },
    { $set: { lastSeen: now } },
    { upsert: true }
  );

  // count devices active in last 30s
  const cutoff = new Date(Date.now() - 30000);
  const count = await db.collection('devices').countDocuments({ code, lastSeen: { $gte: cutoff } });

  res.json({ activeDevices: count });
});

connectDB().then(() => {
  app.listen(3001, () => console.log('Server running on port 3001'));
});

