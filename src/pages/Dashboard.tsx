
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserEventsByDateRange } from '@/api/events';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import EventList from '@/components/EventList';
import AddEventDialog from '@/components/AddEventDialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ChevronLeft, ChevronRight, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [user, currentMonth]);

  const fetchEvents = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await getUserEventsByDateRange(user.user_id, start, end);
      
      if (response.success) {
        setEvents(response.events as any[]);
      } else {
        toast.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('An error occurred while fetching events');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleCloseAddEvent = () => {
    setIsAddEventOpen(false);
  };

  const handleEventAdded = () => {
    fetchEvents();
    setIsAddEventOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to highlight dates with events
  const isDayWithEvent = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.some(event => {
      const eventStart = event.start_time.substring(0, 10);
      return eventStart === dateStr;
    });
  };

  // Get events for the selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start_time).toDateString();
    return new Date(selectedDate).toDateString() === eventDate;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calendar of Events</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {user?.first_name || 'User'}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-white">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Card */}
          <Card className="lg:col-span-2 bg-white shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-6 w-6" />
                    {format(currentMonth, 'MMMM yyyy')}
                  </div>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePreviousMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleAddEvent}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border w-full"
                modifiers={{
                  hasEvent: (date) => isDayWithEvent(date),
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderBottom: '2px solid rgb(59, 130, 246)',
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Events List Card */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between items-center">
                  <span>Events for {format(selectedDate, 'MMMM d, yyyy')}</span>
                  <Button 
                    size="sm" 
                    onClick={handleAddEvent}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {selectedDateEvents.length === 0 
                  ? 'No events scheduled for this day'
                  : `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? 's' : ''} scheduled`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventList 
                events={selectedDateEvents}
                onEventUpdated={fetchEvents}
                onEventDeleted={fetchEvents}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>View all your upcoming events</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="school">School</TabsTrigger>
                  <TabsTrigger value="holiday">Holiday</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <EventList 
                    events={events}
                    onEventUpdated={fetchEvents}
                    onEventDeleted={fetchEvents}
                  />
                </TabsContent>
                <TabsContent value="personal">
                  <EventList 
                    events={events.filter(e => e.event_type === 'personal')}
                    onEventUpdated={fetchEvents}
                    onEventDeleted={fetchEvents}
                  />
                </TabsContent>
                <TabsContent value="school">
                  <EventList 
                    events={events.filter(e => e.event_type === 'school')}
                    onEventUpdated={fetchEvents}
                    onEventDeleted={fetchEvents}
                  />
                </TabsContent>
                <TabsContent value="holiday">
                  <EventList 
                    events={events.filter(e => e.event_type === 'holiday')}
                    onEventUpdated={fetchEvents}
                    onEventDeleted={fetchEvents}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <AddEventDialog
        open={isAddEventOpen}
        onClose={handleCloseAddEvent}
        onEventAdded={handleEventAdded}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Dashboard;
