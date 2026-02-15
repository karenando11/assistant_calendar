import { FormEvent, useState } from 'react';
import './styles/App.css';
import { Calendar, ListTodo } from 'lucide-react';
import { ClientSelector } from './components/ClientSelector';
import { ToDoList } from './components/ToDoList';
import { CalendarView } from './components/CalendarView';
import { EventDialog } from './components/EventDialog';
import { LoginView } from './components/LoginView';
import { clients, categories, events as initialEvents } from './data/mockData';

type View = 'todo' | 'calendar';

type AuthPayload = {
  username: string;
  access: string;
  refresh: string;
};

export default function App() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<View>('calendar');
  const [eventsState, setEventsState] = useState(initialEvents);
  const [authUser, setAuthUser] = useState<string | null>(() => localStorage.getItem('auth_username'));

  const handleCreateEvent = (data: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    clientId?: string;
    categoryId?: string;
  }) => {
    const newEvent = {
      id: Date.now().toString(),
      title: data.title,
      notes: data.description,
      // keep date as a Date object (CalendarView expects Date)
      date: (() => {
        const d = new Date(data.date);
        if (data.startTime) {
          const [h = 0, m = 0] = (data.startTime || '').split(':').map(Number);
          d.setHours(h, m, 0, 0);
        }
        return d;
      })(),
      time: data.startTime || '',
      clientId: data.clientId || '',
      categoryId: data.categoryId || '',
    };
    setEventsState((prev) => [newEvent, ...prev]);
  };

  const handleLoginSuccess = (payload: AuthPayload) => {
    localStorage.setItem('access_token', payload.access);
    localStorage.setItem('refresh_token', payload.refresh);
    localStorage.setItem('auth_username', payload.username);
    setAuthUser(payload.username);
  };

  const handleLogout = (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_username');
    setAuthUser(null);
  };

  if (!authUser) {
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
            <span className="app__user">Signed in as {authUser}</span>
            <EventDialog
              clients={clients}
              categories={categories}
              onCreate={handleCreateEvent}
            />
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
        <div
          className={`app__todo ${
            mobileView === 'todo' ? 'app__todo--visible' : ''
          }`}
        >
          <ToDoList
            events={filteredEvents}
            categories={categories}
            clients={clients}
          />
        </div>

        <div
          className={`app__calendar ${
            mobileView === 'calendar' ? 'app__calendar--visible' : ''
          }`}
        >
          <CalendarView
            events={filteredEvents}
            categories={categories}
            clients={clients}
          />
        </div>
      </div>
    </div>
  );
}
