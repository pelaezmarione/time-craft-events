
import axios from 'axios';
import { API_URL } from './types';

// Delete an event
export async function deleteEvent(eventId: number, userId: number) {
  try {
    const response = await axios.delete(`${API_URL}/events/${eventId}?userId=${userId}`);
    return response.data;
  } catch (error: any) {
    return { success: false, message: 'Failed to delete event', error };
  }
}
