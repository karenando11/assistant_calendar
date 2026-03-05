import { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import '../styles/AdminUsersPage.css';

type AdminUsersPageProps = {
  apiBase: string;
  onAuthExpired: () => void;
  onBack: () => void;
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

export function AdminUsersPage({ apiBase, onAuthExpired, onBack }: AdminUsersPageProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [coachDraftByUserId, setCoachDraftByUserId] = useState<Record<number, string>>({});

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

      const nextDrafts: Record<number, string> = {};
      userItems.forEach((u: any) => {
        if ((u.role ?? '').toLowerCase() === 'client' && u.coach_id) {
          nextDrafts[Number(u.id)] = String(u.coach_id);
        }
      });
      setCoachDraftByUserId(nextDrafts);
    } catch {
      setError('Network error while loading users/coaches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSaveClientCoach = async (user: ApiUser) => {
    const nextCoachId = coachDraftByUserId[user.id];
    if (!nextCoachId) {
      setError('Please select a coach before saving.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      onAuthExpired();
      return;
    }

    setError(null);
    setSuccess(null);
    setUpdatingUserId(user.id);

    try {
      const response = await fetch(`${apiRoot}/api/user/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coach_id: Number(nextCoachId),
        }),
      });

      if (response.status === 401) {
        onAuthExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = (result && result.detail) || 'Failed to update client coach.';
        setError(typeof detail === 'string' ? detail : JSON.stringify(result));
        return;
      }

      setSuccess(`Updated coach for ${user.username}.`);
      await fetchData();
    } catch {
      setError('Network error while updating coach assignment.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user: ApiUser) => {
    const userRole = (user.role ?? '').toLowerCase();
    if (!['coach', 'client'].includes(userRole)) {
      setError('Only coach or client users can be deleted from this page.');
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ${userRole} '${user.username}'? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const typedUsername = window.prompt(
      `Type '${user.username}' to confirm deletion:`
    )?.trim();

    if (typedUsername !== user.username) {
      setError('Delete cancelled: username confirmation did not match.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      onAuthExpired();
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingUserId(user.id);

    try {
      const response = await fetch(`${apiRoot}/api/user/${user.id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        onAuthExpired();
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const detail = (result && result.detail) || 'Failed to delete user.';
        setError(typeof detail === 'string' ? detail : JSON.stringify(result));
        return;
      }

      setSuccess(`Deleted ${user.username}.`);
      await fetchData();
    } catch {
      setError('Network error while deleting user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <main className="admin-users-page">
      <header className="admin-users-page__header">
        <div>
          <h1>Admin User Management</h1>
          <p>Create users and assign coaches to clients.</p>
        </div>
        <button className="admin-users-page__back" type="button" onClick={onBack}>
          Back to calendar
        </button>
      </header>

      <div className="admin-users-page__content">
        <section className="admin-users-page__panel">
          <h3>Create User</h3>

          <div className="admin-users-page__grid">
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
              <label className="admin-users-page__full-width">
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

          {error && <p className="admin-users-page__error">{error}</p>}
          {success && <p className="admin-users-page__success">{success}</p>}

          <div className="admin-users-page__actions">
            <button type="button" className="admin-users-page__create" onClick={handleCreateUser} disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </section>

        <section className="admin-users-page__panel">
          <div className="admin-users-page__panel-header">
            <h3>Users</h3>
            <button type="button" className="admin-users-page__refresh" onClick={fetchData} disabled={loading}>
              Refresh
            </button>
          </div>

          <div className="admin-users-page__table-wrap">
            <table className="admin-users-page__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Coach</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const userRole = (user.role ?? '').toLowerCase();
                  const isClient = userRole === 'client';
                  const canDelete = userRole === 'coach' || userRole === 'client';
                  const selectedCoachId = coachDraftByUserId[user.id] ?? '';
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '-'}</td>
                      <td>{user.role ?? '-'}</td>
                      <td>
                        {isClient ? (
                          <div className="admin-users-page__coach-editor">
                            <Select
                              value={selectedCoachId}
                              onValueChange={(value) =>
                                setCoachDraftByUserId((prev) => ({
                                  ...prev,
                                  [user.id]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="admin-users-page__coach-select">
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
                            <button
                              type="button"
                              className="admin-users-page__save-coach"
                              onClick={() => handleSaveClientCoach(user)}
                              disabled={updatingUserId === user.id || !selectedCoachId}
                            >
                              {updatingUserId === user.id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-users-page__delete"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!users.length && !loading && (
                  <tr>
                    <td colSpan={6}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

