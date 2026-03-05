import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import '../styles/AdminUserDialog.css';

type AdminUserDialogProps = {
  apiBase: string;
  onAuthExpired: () => void;
};

type ApiUser = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  coach_id?: number | null;
  coach_name?: string | null;
};

type CoachOption = {
  id: number;
  username: string;
  name: string;
  email: string;
};

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'coach', label: 'Coach' },
  { value: 'client', label: 'Client' },
] as const;

export function AdminUserDialog({ apiBase, onAuthExpired }: AdminUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'coach' | 'client'>('client');
  const [coachId, setCoachId] = useState<string>('');

  const apiRoot = useMemo(() => apiBase.replace(/\/$/, ''), [apiBase]);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      onAuthExpired();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userRes, coachRes] = await Promise.all([
        fetch(`${apiRoot}/api/user/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${apiRoot}/api/coach/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (userRes.status === 401 || coachRes.status === 401) {
        onAuthExpired();
        return;
      }

      if (!userRes.ok) {
        setError('Unable to load users. Admin access is required.');
        return;
      }

      if (!coachRes.ok) {
        setError('Unable to load coaches.');
        return;
      }

      const userData = await userRes.json();
      const coachData = await coachRes.json();

      const userItems = Array.isArray(userData) ? userData : userData.results ?? [];
      const coachItems = Array.isArray(coachData) ? coachData : coachData.results ?? [];

      setUsers(userItems);
      setCoaches(
        coachItems.map((c: any) => ({
          id: Number(c.id),
          username: c.username ?? '',
          name: c.name ?? c.username ?? 'Coach',
          email: c.email ?? '',
        }))
      );
    } catch {
      setError('Network error while loading users/coaches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open]);

  const resetForm = () => {
    setUsername('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('client');
    setCoachId('');
  };

  const handleCreateUser = async () => {
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (role === 'client' && !coachId) {
      setError('Please choose a coach for client users.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      onAuthExpired();
      return;
    }

    const payload: Record<string, unknown> = {
      username: username.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      role,
    };

    if (role === 'client') {
      payload.coach_id = Number(coachId);
    }

    setSaving(true);

    try {
      const response = await fetch(`${apiRoot}/api/user/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        onAuthExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = (result && result.detail) || 'Failed to create user.';
        setError(typeof detail === 'string' ? detail : JSON.stringify(result));
        return;
      }

      setSuccess('User created successfully.');
      resetForm();
      await fetchData();
    } catch {
      setError('Network error while creating user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="admin-user-trigger" type="button">
          User Admin
        </button>
      </DialogTrigger>

      <DialogContent className="admin-user-dialog">
        <DialogHeader>
          <DialogTitle>Admin User Management</DialogTitle>
          <DialogDescription>Create users and assign coaches to clients.</DialogDescription>
        </DialogHeader>

        <div className="admin-user-dialog__content">
          <section className="admin-user-dialog__panel">
            <h3>Create User</h3>

            <div className="admin-user-dialog__grid">
              <label>
                <span>Role</span>
                <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'coach' | 'client')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label>
                <span>Username</span>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>

              <label>
                <span>First Name</span>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>

              <label>
                <span>Last Name</span>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>

              <label>
                <span>Email</span>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              <label>
                <span>Password</span>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>

              {role === 'client' && (
                <label className="admin-user-dialog__full-width">
                  <span>Coach</span>
                  <Select value={coachId} onValueChange={setCoachId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={String(coach.id)}>
                          {coach.name} ({coach.username}) - #{coach.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
            </div>

            {error && <p className="admin-user-dialog__error">{error}</p>}
            {success && <p className="admin-user-dialog__success">{success}</p>}
          </section>

          <section className="admin-user-dialog__panel">
            <div className="admin-user-dialog__panel-header">
              <h3>Users</h3>
              <button type="button" className="admin-user-dialog__refresh" onClick={fetchData} disabled={loading}>
                Refresh
              </button>
            </div>

            <div className="admin-user-dialog__table-wrap">
              <table className="admin-user-dialog__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Coach</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '-'}</td>
                      <td>{user.role ?? '-'}</td>
                      <td>
                        {user.coach_id ? `${user.coach_name ?? 'Coach'} (#${user.coach_id})` : '-'}
                      </td>
                    </tr>
                  ))}
                  {!users.length && !loading && (
                    <tr>
                      <td colSpan={5}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <DialogFooter className="admin-user-dialog__footer">
          <button type="button" className="admin-user-dialog__create" onClick={handleCreateUser} disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
