import { useEffect, useState } from 'react';
import './styles/App.css';
import { Calendar, ListTodo } from 'lucide-react';
import { ClientSelector } from './components/ClientSelector';
import { ToDoList } from './components/ToDoList';
import { CalendarView } from './components/CalendarView';
import { EventDialog } from './components/EventDialog';
import { EventDetailsDialog } from './components/EventDetailsDialog';
import { LoginView } from './components/LoginView';
import { LoggedOutView } from './components/LoggedOutView';
import type { CalendarEvent, Category, Client } from './types/calendar';

type View = 'todo' | 'calendar';

type AuthPayload = {
  username: string;
  access: string;
  refresh: string;
};

export default function App() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<View>('calendar');
  const [eventsState, setEventsState] = useState<CalendarEvent[]>([]);
  const [authUser, setAuthUser] = useState<string | null>(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    return localStorage.getItem('auth_username') || 'User';
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

  const resetAppData = () => {
    setCategories([]);
    setClients([]);
    setEventsState([]);
    setSelectedEvent(null);
    setSelectedClientId(null);
  };

  const handleAuthExpired = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_username');
    setAuthUser(null);
    setSessionExpired(true);
    resetAppData();
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAuthUser(null);
        setSessionExpired(false);
        resetAppData();
        return;
      }

      try {
        const [eventRes, categoryRes, clientRes] = await Promise.all([
          fetch(`${apiBase}/api/event/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiBase}/api/category/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiBase}/api/client/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if ([eventRes, categoryRes, clientRes].some((res) => res.status === 401)) {
          handleAuthExpired();
          return;
        }

        if (!eventRes.ok) {
          console.error('Failed to load events');
        } else {
          const eventData = await eventRes.json();
          const eventItems = Array.isArray(eventData) ? eventData : eventData.results ?? [];

          setEventsState(
            eventItems.map((e: any) => ({
              id: String(e.id),
              title: e.title,
              notes: e.description ?? '',
              date: new Date(`${e.event_date}T${e.start_time}`),
              time: (e.start_time ?? '').slice(0, 5),
              endTime: (e.end_time ?? '').slice(0, 5),
              duration: 60,
              clientId: String(e.client ?? ''),
              categoryId: String(e.category ?? ''),
            }))
          );
        }

        if (!categoryRes.ok) {
          console.error('Failed to load categories');
        } else {
          const categoryData = await categoryRes.json();
          const categoryItems = Array.isArray(categoryData) ? categoryData : categoryData.results ?? [];

          setCategories(
            categoryItems.map((c: any) => ({
              id: String(c.id),
              name: c.name,
              color: c.color ?? '#A8C5DA',
            }))
          );
        }

        if (!clientRes.ok) {
          console.error('Failed to load clients');
        } else {
          const clientData = await clientRes.json();
          const clientItems = Array.isArray(clientData) ? clientData : clientData.results ?? [];

          setClients(
            clientItems.map((c: any) => ({
              id: String(c.id),
              name: c.name,
              email: c.email ?? '',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load app data:', error);
      }
    };

    fetchData();
  }, [authUser, apiBase]);


  const handleCreateEvent = async (data: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    clientId?: string;
    categoryId?: string;
  }) => {
    if (!data.clientId || !data.categoryId || !data.startTime || !data.endTime) {
      throw new Error('Client, category, start time, and end time are required.');
    }

    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Missing access token');

    const response = await fetch(`${apiBase}/api/event/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        event_date: data.date,
        start_time: `${data.startTime}:00`,
        end_time: `${data.endTime}:00`,
        client: Number(data.clientId),
        category: Number(data.categoryId),
      }),
    });

    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Session expired.');
    }

    const result = await response.json();
    if (!response.ok) {
      console.error('Create event failed:', result);
      throw new Error('Failed to create event');
    }

    setEventsState((prev) => [
      {
        id: String(result.id),
        title: result.title,
        notes: result.description ?? '',
        date: new Date(`${result.event_date}T${result.start_time}`),
        time: result.start_time?.slice(0, 5) ?? '',
        endTime: result.end_time?.slice(0, 5) ?? '',
        duration: 60,
        clientId: String(result.client ?? ''),
        categoryId: String(result.category ?? ''),
      },
      ...prev,
    ]);
  };

  const handleUpdateEvent = async (data: {
    id: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    clientId: string;
    categoryId: string;
  }) => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Missing access token');

    const response = await fetch(`${apiBase}/api/event/${data.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        event_date: data.date,
        start_time: `${data.startTime}:00`,
        end_time: `${data.endTime}:00`,
        client: Number(data.clientId),
        category: Number(data.categoryId),
      }),
    });

    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Session expired.');
    }

    const result = await response.json();
    if (!response.ok) {
      console.error('Update event failed:', result);
      throw new Error(result.detail || 'Failed to update event');
    }

    setEventsState((prev) =>
      prev.map((event) =>
        event.id === String(result.id)
          ? {
              ...event,
              title: result.title,
              notes: result.description ?? '',
              date: new Date(`${result.event_date}T${result.start_time}`),
              time: result.start_time?.slice(0, 5) ?? '',
              endTime: result.end_time?.slice(0, 5) ?? '',
              clientId: String(result.client ?? ''),
              categoryId: String(result.category ?? ''),
            }
          : event
      )
    );

    setSelectedEvent((prev) =>
      prev && prev.id === String(result.id)
        ? {
            ...prev,
            title: result.title,
            notes: result.description ?? '',
            date: new Date(`${result.event_date}T${result.start_time}`),
            time: result.start_time?.slice(0, 5) ?? '',
            endTime: result.end_time?.slice(0, 5) ?? '',
            clientId: String(result.client ?? ''),
            categoryId: String(result.category ?? ''),
          }
        : prev
    );
  };

  const handleLoginSuccess = (payload: AuthPayload) => {
    localStorage.setItem('access_token', payload.access);
    localStorage.setItem('refresh_token', payload.refresh);
    localStorage.setItem('auth_username', payload.username);
    setAuthUser(payload.username);
    setSessionExpired(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_username');
    setAuthUser(null);
    setSessionExpired(false);
    resetAppData();
  };

  if (!authUser) {
    if (sessionExpired) {
      return <LoggedOutView onLoginAgain={() => setSessionExpired(false)} />;
    }

    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const filteredEvents = selectedClientId
    ? eventsState.filter((event) => event.clientId === selectedClientId)
    : eventsState;

  return (
    <div className="app">
      <div className="app__controls">
        <div className="app__top-row">
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
          <div className="app__actions">
            <EventDialog clients={clients} categories={categories} onCreate={handleCreateEvent} />
            <button className="app__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="app__view-toggle">
          <div className="view-toggle">
            <button
              className={`view-toggle__button ${
                mobileView === 'todo' ? 'view-toggle__button--active' : ''
              }`}
              onClick={() => setMobileView('todo')}
            >
              <ListTodo size={18} />
              Tasks
            </button>
            <button
              className={`view-toggle__button ${
                mobileView === 'calendar' ? 'view-toggle__button--active' : ''
              }`}
              onClick={() => setMobileView('calendar')}
            >
              <Calendar size={18} />
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="app__content">
        <div className={`app__todo ${mobileView === 'todo' ? 'app__todo--visible' : ''}`}>
          <ToDoList
            events={filteredEvents}
            categories={categories}
            clients={clients}
            onEventClick={setSelectedEvent}
          />
        </div>

        <div className={`app__calendar ${mobileView === 'calendar' ? 'app__calendar--visible' : ''}`}>
          <CalendarView
            events={filteredEvents}
            categories={categories}
            clients={clients}
            onEventClick={setSelectedEvent}
          />
        </div>
      </div>

      <EventDetailsDialog
        open={!!selectedEvent}
        event={selectedEvent}
        categories={categories}
        clients={clients}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        onUpdate={handleUpdateEvent}
      />
      <span className="app__user">Signed in as {authUser}</span>
    </div>
  );
}

