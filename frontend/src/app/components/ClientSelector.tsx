import { ChevronDown } from 'lucide-react';
import type { Client } from '../types/calendar';
import '../styles/ClientSelector.css';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
}

export function ClientSelector({
  clients,
  selectedClientId,
  onClientChange,
}: ClientSelectorProps) {
  return (
    <div className="client-selector">
      <label htmlFor="client-select" className="client-selector__label">
        Select Client
      </label>
      <div className="client-selector__wrapper">
        <select
          id="client-select"
          className="client-selector__select"
          value={selectedClientId || 'all'}
          onChange={(e) =>
            onClientChange(e.target.value === 'all' ? null : e.target.value)
          }
        >
          <option value="all">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <ChevronDown className="client-selector__icon" />
      </div>
    </div>
  );
}
