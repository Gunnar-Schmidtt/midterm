import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uri = process.env.MONGO_URI;

const PORT = process.env.PORT || 3000;

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const yourNameAndEmoji = { name: 'Gunnar', emoji: '😁' };

async function connectToMongo() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}
connectToMongo();

app.post('/api/get-name', async (req, res) => {
  try {
    const { userName } = req.body;

    if (!userName) {
      return res.status(400).json({ error: 'missing name' });
    }

    const db = client.db('cis486');
    const collection = db.collection('exam');

    const result = await collection.findOne({ name: userName });

    if (!result) {
      return res.status(404).json({ error: 'Name not found' });
    }

    res.json({ 
      message: 'Name found', 
      name: result.name,
      emoji: result.emoji 
    });
  }
  catch (error) {
    console.error('Error retrieving name:', error);
    res.status(500).json({ error: 'Failed to retrieve name' });
  }

})

app.post('/api/init-emoji', async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name || !emoji) {
      return res.status(400).json({ error: 'Name and emoji are required' });
    }

    const db = client.db('cis486');
    const collection = db.collection('exam');

    // Check if name already exists
    const existingEntry = await collection.findOne({ name });

    if (existingEntry) {
      return res.json({ 
        message: 'Name already exists', 
        data: existingEntry 
      });
    }

    // Insert new entry
    const result = await collection.insertOne({ name, emoji });
    res.json({ message: 'Name and emoji recorded', id: result.insertedId });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// READ - Get all names
app.get('/api/names', async (req, res) => {
  try {
    const db = client.db('cis486');
    const collection = db.collection('exam');
    const names = await collection.find({}).toArray();
    res.json(names);
  } catch (error) {
    console.error('Error fetching names:', error);
    res.status(500).json({ error: 'Failed to fetch names' });
  }
});

// DELETE - Remove name
app.delete('/api/names/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = client.db('cis486');
    const collection = db.collection('exam');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Name not found' });
    }
    res.json({ message: 'Name deleted!' });
  } catch (error) {
    console.error('Error deleting name:', error);
    res.status(500).json({ error: 'Failed to delete name' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});