export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  clientId: string;
  categoryId: string;
  date: Date;
  time: string;
  endTime?: string;
  duration: number;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
}
