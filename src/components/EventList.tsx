
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, Clock } from 'lucide-react';
import EditEventDialog from './EditEventDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';
import { deleteEvent } from '@/api/events';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface EventListProps {
  events: any[];
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent & Important':
      return 'bg-red-500';
    case 'Not Urgent but Important':
      return 'bg-yellow-500';
    case 'Urgent but Not Important':
      return 'bg-orange-500';
    case 'Not Urgent & Not Important':
      return 'bg-blue-300';
    default:
      return 'bg-gray-500';
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'personal':
      return 'bg-purple-500';
    case 'school':
      return 'bg-green-500';
    case 'holiday':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const EventList: React.FC<EventListProps> = ({ events, onEventUpdated, onEventDeleted }) => {
  const { user } = useAuth();
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (event: any) => {
    setEditEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (eventId: number) => {
    setDeleteEventId(eventId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteEventId || !user) return;

    try {
      const response = await deleteEvent(deleteEventId, user.user_id);
      if (response.success) {
        toast.success('Event deleted successfully');
        onEventDeleted();
      } else {
        toast.error(response.message || 'Failed to delete event');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the event');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteEventId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events found for the selected criteria
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.event_id} className="border-l-4 overflow-hidden" style={{
          borderLeftColor: event.color_code || '#666'
        }}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  <Badge className={`${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </Badge>
                  <Badge className={`${getPriorityColor(event.priority)}`}>
                    {event.priority}
                  </Badge>
                  {event.tags && event.tags.split(',').map((tag: string, i: number) => (
                    <Badge key={i} variant="outline">{tag.trim()}</Badge>
                  ))}
                </div>
                
                {event.location && (
                  <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                )}
                
                {event.description && (
                  <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(event.start_time), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(event)}
                  title="Edit event"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(event.event_id)}
                  title="Delete event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editEvent && (
        <EditEventDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          event={editEvent}
          onEventUpdated={() => {
            onEventUpdated();
            setIsEditDialogOpen(false);
          }}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
      />
    </div>
  );
};

export default EventList;
