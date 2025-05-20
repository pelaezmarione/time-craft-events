
import axios from 'axios';
import { API_URL } from './types';

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
