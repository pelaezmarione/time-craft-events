
import axios from 'axios';
import { API_URL, EventData } from './types';

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
