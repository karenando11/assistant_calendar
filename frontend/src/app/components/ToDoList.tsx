import { Clock, User, Tag, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarEvent, Category, Client } from '../types/calendar';
import '../styles/ToDoList.css';

interface ToDoListProps {
  events: CalendarEvent[];
  categories: Category[];
  clients: Client[];
}

export function ToDoList({ events, categories, clients }: ToDoListProps) {
  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const getCategory = (categoryId: string) =>
    categories.find((c) => c.id === categoryId);

  const getClient = (clientId: string) =>
    clients.find((c) => c.id === clientId);

  const formatDate = (date: Date) => {
    const today = new Date(2026, 1, 14);
    const tomorrow = new Date(2026, 1, 15);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Group events by status (overdue, today, upcoming)
  const today = new Date(2026, 1, 14);
  today.setHours(0, 0, 0, 0);
  
  const overdueEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  const upcomingEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const renderTodoItem = (event: CalendarEvent) => {
    const category = getCategory(event.categoryId);
    const client = getClient(event.clientId);

    return (
      <div
        key={event.id}
        className="todo-item"
        style={{   backgroundColor: category?.color ? `${category.color}60` : '#ffffff' }}
      >
        <input type="checkbox" className="todo-item__checkbox" />
        <div className="todo-item__content">
          <div className="todo-item__header">
            <h3 className="todo-item__title">{event.title}</h3>
          </div>
          {event.notes && (
            <p className="todo-item__description">{event.notes}</p>
          )}
          <div className="todo-item__meta">
            <span className="todo-item__meta-item">
              <User size={14} />
              {client?.name}
            </span>
            <span className="todo-item__meta-item">
              <Tag size={14} />
              {category?.name}
            </span>
            <span className="todo-item__meta-item todo-item__meta-item--date">
              <CalendarIcon size={14} />
              {formatDate(event.date)}
            </span>
          </div>
          <div className="todo-item__time">
            <Clock size={14} />
            {event.time}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (eventsToRender: CalendarEvent[], title?: string) => (
    <div className="todo-list__section">
      {title && <h3 className="todo-list__section-title">{title}</h3>}
      <div className="todo-list__items">{eventsToRender.map(renderTodoItem)}</div>
    </div>
  );

  return (
    <div className="todo-list">
      <div className="todo-list__header">
        <h2 className="todo-list__title">To Do View</h2>
      </div>

      {overdueEvents.length > 0 && renderSection(overdueEvents, 'OVERDUE')}
      {renderSection(upcomingEvents)}
    </div>
  );
}
