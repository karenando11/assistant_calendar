import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent, Category, Client } from '../types/calendar';
import '../styles/CalendarView.css';

interface CalendarViewProps {
  events: CalendarEvent[];
  categories: Category[];
  clients: Client[];
}

export function CalendarView({ events, categories, clients }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 14));

  const getCategory = (categoryId: string) =>
    categories.find((c) => c.id === categoryId);

  const getClient = (clientId: string) =>
    clients.find((c) => c.id === clientId);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      return (
        event.date.getFullYear() === currentDate.getFullYear() &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date(2026, 1, 14);
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar__day calendar__day--empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const today = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`calendar__day ${today ? 'calendar__day--today' : ''}`}
      >
        <div className="calendar__day-number">{day}</div>
        <div className="calendar__day-events">
          {dayEvents.map((event) => {
            const category = getCategory(event.categoryId);
            const client = getClient(event.clientId);
            return (
              <div
                key={event.id}
                className="calendar__event"
                style={{ backgroundColor: category?.color }}
              >
                <span className="calendar__event-title">{event.title}</span>
                <span className="calendar__event-time">{event.time}</span>
                <span className="calendar__event-client">{client?.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar__header">
        <button
          className="calendar__nav-button"
          onClick={previousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <h2 className="calendar__month">{monthName}</h2>
        <button
          className="calendar__nav-button"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="calendar__grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar__weekday">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>

      <div className="calendar__legend">
        <span className="calendar__legend-title">Categories:</span>
        {categories.map((category) => (
          <div key={category.id} className="calendar__legend-item">
            <div
              className="calendar__legend-dot"
              style={{ backgroundColor: category.color }}
            />
            <span className="calendar__legend-label">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
