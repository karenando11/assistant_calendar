import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from './ui/select';
import '../styles/EventDialog.css';

interface EventDialogProps {
  clients: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  onCreate?: (data: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    clientId?: string;
    categoryId?: string;
  }) => void;
}

export function EventDialog({ clients, categories, onCreate }: EventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId), [clients, clientId]);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === categoryId), [categories, categoryId]);

  function reset() {
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('');
    setEndTime('');
    setClientId(undefined);
    setCategoryId(undefined);
  }

  function handleCreate() {
    if (!title || !date) return;

    onCreate?.({
      title,
      description,
      date,
      startTime,
      endTime,
      clientId,
      categoryId,
    });

    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="event-dialog-trigger" type="button">
          <span className="event-dialog-trigger__plus">+</span>
          <span>New</span>
        </button>
      </DialogTrigger>

      <DialogContent className="event-dialog">
        <DialogHeader className="event-dialog__header">
          <DialogTitle className="event-dialog__title">New Event</DialogTitle>
          <DialogDescription className="event-dialog__subtitle">
            Add a new event to your calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="event-dialog__form">
          <label className="event-dialog__field">
            <span className="event-dialog__label">Title *</span>
            <Input
              className="event-dialog__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </label>

          <label className="event-dialog__field">
            <span className="event-dialog__label">Description</span>
            <Textarea
              className="event-dialog__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
            />
          </label>

          <label className="event-dialog__field">
            <span className="event-dialog__label">Date *</span>
            <Input
              className="event-dialog__input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="event-dialog__field">
            <span className="event-dialog__label">Client *</span>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="event-dialog__select-trigger">
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
            {selectedClient && <span className="event-dialog__hint">{selectedClient.name}</span>}
          </label>

          <label className="event-dialog__field">
            <span className="event-dialog__label">Category</span>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="event-dialog__select-trigger">
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
            {selectedCategory && <span className="event-dialog__hint">{selectedCategory.name}</span>}
          </label>

          <div className="event-dialog__time-row">
            <label className="event-dialog__field">
              <span className="event-dialog__label">Start Time</span>
              <Input
                className="event-dialog__input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label className="event-dialog__field">
              <span className="event-dialog__label">End Time</span>
              <Input
                className="event-dialog__input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
        </div>

        <DialogFooter className="event-dialog__footer">
          <DialogClose asChild>
            <button type="button" className="event-dialog__cancel">
              Cancel
            </button>
          </DialogClose>
          <button type="button" className="event-dialog__primary" onClick={handleCreate}>
            Create
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
