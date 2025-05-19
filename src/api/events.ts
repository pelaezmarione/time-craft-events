
import { executeQuery } from '../lib/db';
import { z } from 'zod';

// Schema for event validation
const EventSchema = z.object({
  user_id: z.number(),
  event_type: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  location: z.string().optional(),
  category: z.string(),
  priority: z.string(),
  color_code: z.string().optional(),
  tags: z.string().optional(),
  event_status: z.string().default("active")
});

export type EventData = z.infer<typeof EventSchema>;

// Create a new event
export async function createEvent(eventData: EventData) {
  try {
    const validatedData = EventSchema.parse(eventData);
    
    const result = await executeQuery(
      `INSERT INTO event (
        user_id, event_type, title, description, start_time, 
        end_time, location, category, priority, color_code, tags, event_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.user_id,
        validatedData.event_type,
        validatedData.title,
        validatedData.description || '',
        validatedData.start_time,
        validatedData.end_time,
        validatedData.location || '',
        validatedData.category,
        validatedData.priority,
        validatedData.color_code || '',
        validatedData.tags || '',
        validatedData.event_status
      ]
    );
    
    const eventId = (result as any).insertId;
    
    // Create countdown for the event
    await executeQuery(
      `INSERT INTO countdown (event_id, time_remaining) VALUES (?, ?)`,
      [eventId, validatedData.start_time]
    );
    
    return { 
      success: true, 
      message: 'Event created successfully',
      event_id: eventId
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: (error as Error).message || 'Failed to create event' };
  }
}

// Get all events for a user
export async function getUserEvents(userId: number) {
  try {
    const events = await executeQuery(
      `SELECT e.*, 
        (SELECT time_remaining FROM countdown WHERE event_id = e.event_id LIMIT 1) as countdown
       FROM event e
       WHERE e.user_id = ? 
       ORDER BY e.start_time ASC`,
      [userId]
    );
    
    return { success: true, events };
  } catch (error) {
    return { success: false, message: 'Failed to fetch events', error };
  }
}

// Get events for a user by date range
export async function getUserEventsByDateRange(userId: number, startDate: string, endDate: string) {
  try {
    const events = await executeQuery(
      `SELECT e.*, 
        (SELECT time_remaining FROM countdown WHERE event_id = e.event_id LIMIT 1) as countdown
       FROM event e
       WHERE e.user_id = ? 
       AND (
         (e.start_time BETWEEN ? AND ?) OR 
         (e.end_time BETWEEN ? AND ?) OR
         (e.start_time <= ? AND e.end_time >= ?)
       )
       ORDER BY e.start_time ASC`,
      [userId, startDate, endDate, startDate, endDate, startDate, endDate]
    );
    
    return { success: true, events };
  } catch (error) {
    return { success: false, message: 'Failed to fetch events', error };
  }
}

// Update an event
export async function updateEvent(eventId: number, eventData: Partial<EventData>, userId: number) {
  try {
    // First verify that this event belongs to the user
    const event = await executeQuery(
      'SELECT * FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    ) as any[];
    
    if (event.length === 0) {
      return { success: false, message: 'Event not found or you do not have permission' };
    }
    
    // Create update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(eventData).forEach(([key, value]) => {
      if (key !== 'user_id' && key !== 'event_id' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return { success: false, message: 'No fields to update' };
    }
    
    // Add event_id and user_id at the end of values array for WHERE clause
    updateValues.push(eventId);
    updateValues.push(userId);
    
    // Execute update query
    await executeQuery(
      `UPDATE event SET ${updateFields.join(', ')} WHERE event_id = ? AND user_id = ?`,
      updateValues
    );
    
    // Log the update in event_update table
    await executeQuery(
      `INSERT INTO event_update (event_id, updated_at, updated_by) VALUES (?, NOW(), ?)`,
      [eventId, userId]
    );
    
    // Update countdown if start_time has changed
    if (eventData.start_time) {
      await executeQuery(
        `UPDATE countdown SET time_remaining = ? WHERE event_id = ?`,
        [eventData.start_time, eventId]
      );
    }
    
    return { success: true, message: 'Event updated successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to update event', error };
  }
}

// Delete an event
export async function deleteEvent(eventId: number, userId: number) {
  try {
    // First verify that this event belongs to the user
    const event = await executeQuery(
      'SELECT * FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    ) as any[];
    
    if (event.length === 0) {
      return { success: false, message: 'Event not found or you do not have permission' };
    }
    
    // Delete related records first (cascade delete manually)
    await executeQuery('DELETE FROM countdown WHERE event_id = ?', [eventId]);
    await executeQuery('DELETE FROM event_summary WHERE event_id = ?', [eventId]);
    await executeQuery('DELETE FROM event_update WHERE event_id = ?', [eventId]);
    
    // Delete the event
    await executeQuery(
      'DELETE FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    
    return { success: true, message: 'Event deleted successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to delete event', error };
  }
}

// Create event summary
export async function createEventSummary(eventId: number, userId: number, summaryText: string) {
  try {
    // First verify that this event belongs to the user
    const event = await executeQuery(
      'SELECT * FROM event WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    ) as any[];
    
    if (event.length === 0) {
      return { success: false, message: 'Event not found or you do not have permission' };
    }
    
    // Check if a summary already exists
    const existingSummary = await executeQuery(
      'SELECT * FROM event_summary WHERE event_id = ?',
      [eventId]
    ) as any[];
    
    if (existingSummary.length > 0) {
      // Update existing summary
      await executeQuery(
        'UPDATE event_summary SET summary_text = ? WHERE event_id = ?',
        [summaryText, eventId]
      );
    } else {
      // Create new summary
      await executeQuery(
        'INSERT INTO event_summary (event_id, summary_text) VALUES (?, ?)',
        [eventId, summaryText]
      );
    }
    
    return { success: true, message: 'Event summary saved successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to save event summary', error };
  }
}
