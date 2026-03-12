import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uri = process.env.MONGO_URI;

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

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

// --- Names API ---
// CREATE - Add name
app.post('/api/names', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const db = client.db('cis486');
    const collection = db.collection('names');
    const result = await collection.insertOne({ name });
    res.json({ message: 'Name recorded', id: result.insertedId });
  } catch (error) {
    console.error('Error adding name:', error);
    res.status(500).json({ error: 'Failed to add name' });
  }
});

// READ - Get all names
app.get('/api/names', async (req, res) => {
  try {
    const db = client.db('cis486');
    const collection = db.collection('names');
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
    const collection = db.collection('names');
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

// API Health/Endpoints Documentation

// ADD NOTE - Add a dated note to a timer
app.post('/api/timers/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, date } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Note text is required' });
    }
    const db = client.db('cis486');
    const collection = db.collection('timers');
    const note = {
      text,
      date: date ? new Date(date) : new Date()
    };
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { notes: note } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    res.json({ message: 'Note added!' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});



// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});