const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: 'messaging_app',
  
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// User registration
app.post('/api/register', async (req, res) => {
  const { name, email, phone, role } = req.body;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const query = 'INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, email, phone, role, hashedPassword], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error registering user' });
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
  });
});

// User login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, name, email, phone, role FROM users';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching users' });
    } else {
      res.json(results);
    }
  });
});

// Send message
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, content } = req.body;
  const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
  db.query(query, [senderId, receiverId, content], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error sending message' });
    } else {
      res.status(201).json({ message: 'Message sent successfully' });
    }
  });
});

// Get messages for a user
app.get('/api/messages/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT m.*, u.name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.receiver_id = ? OR m.sender_id = ?
    ORDER BY m.created_at DESC
  `;
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching messages' });
    } else {
      res.json(results);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});