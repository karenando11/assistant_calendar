import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { CalendarEvent, Category, Client } from '../types/calendar';
import '../styles/EventDetailsDialog.css';

type UpdatePayload = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId: string;
  categoryId: string;
};

type Props = {
  open: boolean;
  event: CalendarEvent | null;
  categories: Category[];
  clients: Client[];
  onOpenChange: (open: boolean) => void;
  onUpdate: (payload: UpdatePayload) => Promise<void>;
};

export function EventDetailsDialog({ open, event, categories, clients, onOpenChange, onUpdate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;

    const d = new Date(event.date);
    const isoDate = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;

    setTitle(event.title || '');
    setDescription(event.notes || '');
    setDate(isoDate);
    setClientId(event.clientId || '');
    setCategoryId(event.categoryId || '');
    setStartTime(event.time || '');
    setEndTime(event.endTime || '');
    setError(null);
  }, [event]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId), [clients, clientId]);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === categoryId), [categories, categoryId]);

  if (!event) return null;

  const handleUpdate = async () => {
    if (!title || !date || !startTime || !endTime || !clientId || !categoryId) {
      setError('Title, date, client, category, start time, and end time are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onUpdate({
        id: event.id,
        title,
        description,
        date,
        startTime,
        endTime,
        clientId,
        categoryId,
      });
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update event.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="event-details-dialog">
        <DialogHeader className="event-details-dialog__header">
          <DialogTitle className="event-details-dialog__title">Edit Event</DialogTitle>
          <DialogDescription className="event-details-dialog__subtitle">
            Make changes to your event.
          </DialogDescription>
        </DialogHeader>

        <div className="event-details-dialog__form">
          <label className="event-details-dialog__field">
            <span className="event-details-dialog__label">Title *</span>
            <Input className="event-details-dialog__input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="event-details-dialog__field">
            <span className="event-details-dialog__label">Description</span>
            <Textarea className="event-details-dialog__textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <label className="event-details-dialog__field">
            <span className="event-details-dialog__label">Date *</span>
            <Input className="event-details-dialog__input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="event-details-dialog__field">
            <span className="event-details-dialog__label">Client *</span>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="event-details-dialog__select-trigger">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && <span className="event-details-dialog__hint">Selected: {selectedClient.name}</span>}
          </label>

          <label className="event-details-dialog__field">
            <span className="event-details-dialog__label">Category</span>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="event-details-dialog__select-trigger">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && <span className="event-details-dialog__hint">Selected: {selectedCategory.name}</span>}
          </label>

          <div className="event-details-dialog__time-row">
            <label className="event-details-dialog__field">
              <span className="event-details-dialog__label">Start Time</span>
              <Input className="event-details-dialog__input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>

            <label className="event-details-dialog__field">
              <span className="event-details-dialog__label">End Time</span>
              <Input className="event-details-dialog__input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          {error && <p className="event-details-dialog__hint">{error}</p>}
        </div>

        <DialogFooter className="event-details-dialog__footer">
          <button type="button" className="event-details-dialog__danger">Delete</button>

          <div className="event-details-dialog__actions-right">
            <button type="button" className="event-details-dialog__cancel" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="event-details-dialog__primary" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
