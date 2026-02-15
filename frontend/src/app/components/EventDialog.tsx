import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from './ui/select';

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
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  function reset() {
    setTitle('');
    setDescription('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setClientId(undefined);
    setCategoryId(undefined);
  }

  function handleCreate() {
    if (!title || !date) return;
    onCreate?.({ title, description, date, startTime, endTime, clientId, categoryId });
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>+ New Event</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Title
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Description
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes or description" />
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              Date
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              Start time
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              End time
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              Client
              <Select value={clientId} onValueChange={(v) => setClientId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              Category
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        <DialogFooter style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <DialogClose asChild>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
