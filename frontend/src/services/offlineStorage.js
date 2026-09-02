import { apiFetch } from './api';

const QUEUE_KEY = 'avighna_offline_incidents_queue';

export const queueOfflineIncident = (incidentData) => {
  const existing = getOfflineQueue();
  const newItem = {
    ...incidentData,
    local_id: `offline_${Date.now()}`,
    queued_at: new Date().toISOString(),
    status: 'OFFLINE_PENDING'
  };
  existing.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  return newItem;
};

export const getOfflineQueue = () => {
  const str = localStorage.getItem(QUEUE_KEY);
  if (!str) return [];
  try { return JSON.parse(str); } catch (e) { return []; }
};

export const syncOfflineIncidents = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0 };

  let syncedCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      syncedCount++;
    } catch (e) {
      console.warn('Failed to sync item:', item, e);
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced: syncedCount, remaining: remaining.length };
};
