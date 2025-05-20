
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

// Get events by date range
app.get('/api/events/:userId/range', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { start, end } = req.query;
    
    const events = await query(
      `SELECT e.*, c.time_remaining AS countdown FROM event e
       LEFT JOIN countdown c ON e.event_id = c.event_id
       WHERE e.user_id = ? AND 
       ((e.start_time >= ? AND e.start_time <= ?) OR
        (e.end_time >= ? AND e.end_time <= ?) OR
        (e.start_time <= ? AND e.end_time >= ?))
       ORDER BY e.start_time ASC`,
      [userId, start, end, start, end, start, end]
    );
    
    res.json({ success: true, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  try {
    const { 
      user_id, 
      event_type, 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      category, 
      priority, 
      color_code, 
      tags,
      event_status = 'active'
    } = req.body;
    
    const result = await query(
      `INSERT INTO event (
        user_id, event_type, title, description, start_time, end_time, 
        location, category, priority, color_code, tags, event_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, 
        event_type, 
        title, 
        description, 
        start_time, 
        end_time, 
        location, 
        category, 
        priority, 
        color_code, 
        tags,
        event_status
      ]
    );
    
    const insertId = (result as any).insertId;
    
    res.status(201).json({ 
      success: true, 
      message: 'Event created successfully', 
      eventId: insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update an event
app.put('/api/events/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { userId, ...updateData } = req.body;
    
    // Build the dynamic update query
    let updateFields = [];
    let queryParams = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      updateFields.push(`${key} = ?`);
      queryParams.push(value);
    }
    
    // Add the WHERE conditions at the end
    queryParams.push(eventId);
    queryParams.push(userId);
    
    const result = await query(
      `UPDATE event SET ${updateFields.join(', ')} WHERE event_id = ? AND user_id = ?`,
      queryParams
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to update it' 
      });
    }
    
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete an event
app.delete('/api/events/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.query.userId as string;
    
    const result = await query(
      'DELETE FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to delete it' 
      });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create event summary
app.post('/api/events/:eventId/summary', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { userId, summaryText } = req.body;
    
    // Check if event belongs to user
    const events = await query(
      'SELECT * FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    ) as any[];
    
    if (events.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission' 
      });
    }
    
    // Insert summary
    await query(
      'INSERT INTO event_summary (event_id, summary_text) VALUES (?, ?)',
      [eventId, summaryText]
    );
    
    res.status(201).json({ success: true, message: 'Summary added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
