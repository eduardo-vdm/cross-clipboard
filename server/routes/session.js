const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crossclipboard';
const client = new MongoClient(uri);
const dbName = uri.split('/').pop().split('?')[0];

// Connect to Mongo once and reuse
let db;
client.connect().then(() => {
  db = client.db(dbName);
  console.log('📦 Connected to MongoDB for session routes');
}).catch(console.error);

// Create a new session
router.post('/sessions', async (req, res) => {
  try {
    const session = {
      createdAt: new Date(),
      lastModified: new Date(),
      items: [],
      version: 1
    };
    
    const result = await db.collection('sessions').insertOne(session);
    res.status(201).json({ 
      id: result.insertedId,
      ...session
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session details
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await db.collection('sessions').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      id: session._id,
      items: session.items,
      version: session.version,
      createdAt: session.createdAt,
      lastModified: session.lastModified
    });
  } catch (error) {
    console.error('Failed to get session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Delete a session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const result = await db.collection('sessions').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get all items in a session
router.get('/sessions/:id/items', async (req, res) => {
  try {
    const session = await db.collection('sessions').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session.items);
  } catch (error) {
    console.error('Failed to get items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Add a new item to a session
router.post('/sessions/:id/items', async (req, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    const newItem = {
      id: new ObjectId().toString(),
      type,
      content,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
    };

    const result = await db.collection('sessions').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $push: { items: newItem },
        $inc: { version: 1 },
        $set: { lastModified: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Failed to add item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update an item in a session
router.put('/sessions/:id/items/:itemId', async (req, res) => {
  try {
    const { content, version } = req.body;
    if (!content || !version) {
      return res.status(400).json({ error: 'Content and version are required' });
    }

    const session = await db.collection('sessions').findOne({
      _id: new ObjectId(req.params.id),
      'items.id': req.params.itemId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session or item not found' });
    }

    const item = session.items.find(item => item.id === req.params.itemId);
    if (item.version !== version) {
      return res.status(409).json({ 
        error: 'Version conflict',
        serverVersion: item.version,
        serverContent: item.content
      });
    }

    const result = await db.collection('sessions').updateOne(
      { 
        _id: new ObjectId(req.params.id),
        'items.id': req.params.itemId
      },
      { 
        $set: {
          'items.$.content': content,
          'items.$.lastModified': new Date(),
          'items.$.version': version + 1,
          lastModified: new Date()
        },
        $inc: { version: 1 }
      }
    );

    res.json({ 
      version: version + 1,
      lastModified: new Date()
    });
  } catch (error) {
    console.error('Failed to update item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item from a session
router.delete('/sessions/:id/items/:itemId', async (req, res) => {
  try {
    const result = await db.collection('sessions').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $pull: { items: { id: req.params.itemId } },
        $inc: { version: 1 },
        $set: { lastModified: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Session or item not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
