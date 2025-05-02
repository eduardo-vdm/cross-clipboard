const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://crossclip_app:clip123secure@localhost:27017/cross_clipboard?authSource=cross_clipboard';

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const userCount = await db.collection('users').countDocuments();
    if (userCount > 0) {
      console.log('ℹ️ Seed skipped: users already exist.');
      return;
    }

    await db.collection('users').insertMany([
      { name: 'Alice Dev', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob Dev', email: 'bob@example.com', role: 'viewer' }
    ]);

    console.log('✅ Dev seed complete.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await client.close();
  }
}

seed();
