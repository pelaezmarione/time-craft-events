
import { executeQuery } from '../lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

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
    
    // Check if username or email already exists
    const existingUser = await executeQuery(
      'SELECT * FROM user WHERE username = ? OR user_email = ?',
      [validatedData.username, validatedData.user_email]
    ) as any[];
    
    if (existingUser.length > 0) {
      throw new Error('Username or email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Insert user into database
    const result = await executeQuery(
      `INSERT INTO user (last_name, first_name, middle_initial, username, user_email, phone_number, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.last_name,
        validatedData.first_name,
        validatedData.middle_initial || '',
        validatedData.username,
        validatedData.user_email,
        validatedData.phone_number,
        hashedPassword
      ]
    );
    
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: (error as Error).message || 'Failed to create user' };
  }
}

export async function loginUser(username: string, password: string) {
  try {
    // Find user by username or email
    const users = await executeQuery(
      'SELECT * FROM user WHERE username = ? OR user_email = ?',
      [username, username]
    ) as any[];
    
    if (users.length === 0) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const user = users[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Don't include password in the returned user object
    delete user.password;
    
    return { 
      success: true, 
      message: 'Login successful', 
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_email: user.user_email
      } 
    };
  } catch (error) {
    return { success: false, message: 'Login failed' };
  }
}
