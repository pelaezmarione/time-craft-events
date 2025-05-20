
import express from 'express';
import cors from 'cors';
import { query } from './config';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes for authentication
app.post('/api/auth/register', async (req, res) => {
  try {
    const { first_name, last_name, middle_initial, username, user_email, phone_number, password } = req.body;
    
    // Check if username or email already exists
    const existingUser = await query(
      'SELECT * FROM user WHERE username = ? OR user_email = ?',
      [username, user_email]
    ) as any[];
    
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user into database
    await query(
      `INSERT INTO user (last_name, first_name, middle_initial, username, user_email, phone_number, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        last_name,
        first_name,
        middle_initial || '',
        username,
        user_email,
        phone_number,
        hashedPassword
      ]
    );
    
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const users = await query(
      'SELECT * FROM user WHERE username = ? OR user_email = ?',
      [username, username]
    ) as any[];
    
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Don't include password in the returned user object
    delete user.password;
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_email: user.user_email
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Routes for events
app.get('/api/events/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const events = await query(
      'SELECT * FROM event WHERE user_id = ? ORDER BY start_time ASC',
      [userId]
    );
    res.json({ success: true, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
