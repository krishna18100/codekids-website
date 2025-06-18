const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend'))); // Serve from 'frontend'

let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB Atlas');
        db = client.db('codekids');
        app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch(error => console.error('MongoDB connection error:', error));

// Signup endpoint
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const users = db.collection('users');
        const existingUser = await users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await users.insertOne({ username, password: hashedPassword });
        res.status(201).json({ message: `Welcome, ${username}! Account created!` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const users = db.collection('users');
        const user = await users.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({ message: `Welcome back, ${username}! Let's code!` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});