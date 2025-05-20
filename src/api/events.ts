
import { z } from 'zod';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    
    const response = await axios.post(`${API_URL}/events`, validatedData);
    return response.data;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    if (error.response) {
      return { success: false, message: error.response.data.message || 'Failed to create event' };
    }
    return { success: false, message: 'Failed to connect to server' };
  }
}

// Get all events for a user
export async function getUserEvents(userId: number) {
  try {
    const response = await axios.get(`${API_URL}/events/${userId}`);
    return response.data;
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch events', error };
  }
}

// Get events for a user by date range
export async function getUserEventsByDateRange(userId: number, startDate: string, endDate: string) {
  try {
    const response = await axios.get(
      `${API_URL}/events/${userId}/range?start=${startDate}&end=${endDate}`
    );
    return response.data;
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch events', error };
  }
}

// Update an event
export async function updateEvent(eventId: number, eventData: Partial<EventData>, userId: number) {
  try {
    const response = await axios.put(`${API_URL}/events/${eventId}`, { ...eventData, userId });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return { success: false, message: error.response.data.message || 'Failed to update event' };
    }
    return { success: false, message: 'Failed to connect to server' };
  }
}

// Delete an event
export async function deleteEvent(eventId: number, userId: number) {
  try {
    const response = await axios.delete(`${API_URL}/events/${eventId}?userId=${userId}`);
    return response.data;
  } catch (error: any) {
    return { success: false, message: 'Failed to delete event', error };
  }
}

// Create event summary
export async function createEventSummary(eventId: number, userId: number, summaryText: string) {
  try {
    const response = await axios.post(`${API_URL}/events/${eventId}/summary`, {
      userId,
      summaryText
    });
    return response.data;
  } catch (error: any) {
    return { success: false, message: 'Failed to save event summary', error };
  }
}
