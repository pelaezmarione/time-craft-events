
// Mock database implementation for browser environment
// In a real application, this would be replaced by API calls to a backend

// Types for our data models
export interface User {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  user_email: string;
  phone_number: string;
  password: string; // In a real app, this would be hashed on the server
}

export interface Event {
  event_id: number;
  user_id: number;
  event_type: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  category: string;
  priority: string;
  color_code?: string;
  tags?: string;
  event_status: string;
}

// Mock database storage using localStorage
const USERS_KEY = 'calendar_users';
const EVENTS_KEY = 'calendar_events';

// Initialize mock database if it doesn't exist
if (!localStorage.getItem(USERS_KEY)) {
  localStorage.setItem(USERS_KEY, JSON.stringify([]));
}

if (!localStorage.getItem(EVENTS_KEY)) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
}

// Helper functions to interact with the mock database
function getUsers(): User[] {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function setUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getEvents(): Event[] {
  const events = localStorage.getItem(EVENTS_KEY);
  return events ? JSON.parse(events) : [];
}

function setEvents(events: Event[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// Mock database query execution
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  console.log('Mock query executed:', query, params);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simple query parser to determine the operation
  // This is a very simplified version and won't handle complex queries
  if (query.toLowerCase().includes('select') && query.toLowerCase().includes('from user')) {
    const users = getUsers();
    
    // Handle user queries
    if (params.length === 2) {
      // This simulates: SELECT * FROM user WHERE username = ? OR user_email = ?
      const [usernameOrEmail1, usernameOrEmail2] = params;
      return users.filter(user => 
        user.username === usernameOrEmail1 || 
        user.user_email === usernameOrEmail1 ||
        user.username === usernameOrEmail2 || 
        user.user_email === usernameOrEmail2
      );
    }
    return users;
  } 
  else if (query.toLowerCase().includes('insert into user')) {
    // Insert new user
    const users = getUsers();
    const newUser: User = {
      user_id: users.length + 1,
      username: params[3],
      last_name: params[0],
      first_name: params[1],
      middle_initial: params[2],
      user_email: params[4],
      phone_number: params[5],
      password: params[6]
    };
    
    users.push(newUser);
    setUsers(users);
    
    return { insertId: newUser.user_id };
  } 
  else if (query.toLowerCase().includes('select') && query.toLowerCase().includes('from event')) {
    // Query events
    let events = getEvents();
    
    if (params.length >= 1) {
      const userId = params[0];
      events = events.filter(event => event.user_id === userId);
      
      // If date range filtering is provided
      if (params.length >= 3) {
        const startDate = new Date(params[1]);
        const endDate = new Date(params[2]);
        
        events = events.filter(event => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          
          return (eventStart >= startDate && eventStart <= endDate) || 
                 (eventEnd >= startDate && eventEnd <= endDate) ||
                 (eventStart <= startDate && eventEnd >= endDate);
        });
      }
    }
    
    // Add countdown field to simulate JOIN
    events = events.map(event => ({
      ...event,
      countdown: event.start_time
    }));
    
    return events;
  } 
  else if (query.toLowerCase().includes('insert into event')) {
    // Insert new event
    const events = getEvents();
    const newEvent: Event = {
      event_id: events.length + 1,
      user_id: params[0],
      event_type: params[1],
      title: params[2],
      description: params[3],
      start_time: params[4],
      end_time: params[5],
      location: params[6],
      category: params[7],
      priority: params[8],
      color_code: params[9],
      tags: params[10],
      event_status: params[11]
    };
    
    events.push(newEvent);
    setEvents(events);
    
    return { insertId: newEvent.event_id };
  } 
  else if (query.toLowerCase().includes('update event set')) {
    // Update event
    const events = getEvents();
    const eventId = params[params.length - 2];
    const userId = params[params.length - 1];
    
    const index = events.findIndex(e => e.event_id === eventId && e.user_id === userId);
    if (index !== -1) {
      // Extract field names from the query
      const updateClause = query.match(/SET\s+([^WHERE]+)/i)?.[1] || '';
      const fieldNames = updateClause.split(',').map(field => 
        field.split('=')[0].trim().replace(/`/g, '')
      );
      
      // Update the event with new values
      // This is simplified and won't handle all SQL update scenarios
      for (let i = 0; i < fieldNames.length; i++) {
        const fieldName = fieldNames[i] as keyof Event;
        if (fieldName && i < params.length - 2) {
          (events[index] as any)[fieldName] = params[i];
        }
      }
      
      setEvents(events);
    }
    
    return { affectedRows: index !== -1 ? 1 : 0 };
  } 
  else if (query.toLowerCase().includes('delete from event')) {
    // Delete event
    const events = getEvents();
    const eventId = params[0];
    const userId = params.length > 1 ? params[1] : undefined;
    
    const newEvents = events.filter(e => 
      !(e.event_id === eventId && (userId === undefined || e.user_id === userId))
    );
    
    setEvents(newEvents);
    
    return { affectedRows: events.length - newEvents.length };
  }
  
  // Handle other queries as needed
  
  return [];
}
