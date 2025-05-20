
import axios from 'axios';
import { API_URL, EventSchema, EventData } from './types';
import { z } from 'zod';

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
