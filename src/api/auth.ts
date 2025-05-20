
import { z } from 'zod';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_initial: z.string().max(2).optional(),
  username: z.string().min(4, "Username must be at least 4 characters"),
  user_email: z.string().email("Invalid email format"),
  phone_number: z.string().min(10, "Invalid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UserData = z.infer<typeof UserSchema>;

export async function createUser(userData: UserData) {
  try {
    const validatedData = UserSchema.parse(userData);
    
    const response = await axios.post(`${API_URL}/auth/register`, validatedData);
    return response.data;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    if (error.response) {
      return { success: false, message: error.response.data.message || 'Failed to create user' };
    }
    return { success: false, message: 'Failed to connect to server' };
  }
}

export async function loginUser(username: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return { success: false, message: error.response.data.message || 'Login failed' };
    }
    return { success: false, message: 'Failed to connect to server' };
  }
}
