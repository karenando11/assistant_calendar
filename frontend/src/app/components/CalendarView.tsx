import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import type { CalendarEvent, Category, Client } from '../types/calendar';
import '../styles/CalendarView.css';

interface CalendarViewProps {
  events: CalendarEvent[];
  categories: Category[];
  clients: Client[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ events, categories, clients, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);

  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getClient = (clientId: string) => clients.find((c) => c.id === clientId);

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

  const toSoftCardColor = (hex?: string) => {
    if (!hex) return '#f8fafc';
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return '#f8fafc';

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, 0.24)`;
  };

  const previousMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(next);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(next);
    setSelectedDay(null);
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

  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return getEventsForDay(selectedDay).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [selectedDay, events, currentDate]);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  const formatSelectedDate = () => {
    if (selectedDay === null) return 'No day selected';
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
        onClick={() => {
          setSelectedDay(day);
          setDayEventsOpen(true);
        }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
              >
                <span className="calendar__event-dot" />
                <span className="calendar__event-text">
                  [{client?.name || 'No Client'}] {event.time || ''} {event.title}
                </span>
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
        <button className="calendar__nav-button" onClick={previousMonth} aria-label="Previous month">
          <ChevronLeft />
        </button>
        <h2 className="calendar__month">{monthName}</h2>
        <button className="calendar__nav-button" onClick={nextMonth} aria-label="Next month">
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
            <div className="calendar__legend-dot" style={{ backgroundColor: category.color }} />
            <span className="calendar__legend-label">{category.name}</span>
          </div>
        ))}
      </div>

      <Dialog open={dayEventsOpen} onOpenChange={setDayEventsOpen}>
        <DialogContent className="calendar__day-dialog">
          <DialogHeader>
            <DialogTitle>{formatSelectedDate()}</DialogTitle>
            <DialogDescription>Events scheduled for this day.</DialogDescription>
          </DialogHeader>

          {selectedDay === null && <p className="calendar__day-list-empty">Click a day to view its events.</p>}
          {selectedDay !== null && selectedDayEvents.length === 0 && (
            <p className="calendar__day-list-empty">No events for this day.</p>
          )}

          {selectedDayEvents.length > 0 && (
            <ul className="calendar__day-list-items">
              {selectedDayEvents.map((event) => {
                const category = getCategory(event.categoryId);
                const client = getClient(event.clientId);

                return (
                  <li
                    key={`day-list-${event.id}`}
                    className="calendar__day-list-item"
                    style={{
                      backgroundColor: toSoftCardColor(category?.color),
                      borderLeft: `4px solid ${category?.color || '#cbd5e1'}`,
                    }}
                    onClick={() => {
                      onEventClick?.(event);
                      setDayEventsOpen(false);
                    }}
                  >
                    <div className="calendar__day-list-main">
                      <div className="calendar__day-list-title">{event.title}</div>
                      {event.notes && <p className="calendar__day-list-notes">{event.notes}</p>}
                      <div className="calendar__day-list-meta">
                        <span>{event.time || '--:--'}</span>
                        <span>{client?.name || 'No Client'}</span>
                        <span>{category?.name || 'Uncategorized'}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
