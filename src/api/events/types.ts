
import { z } from 'zod';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Schema for event validation
export const EventSchema = z.object({
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
