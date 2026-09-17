import { apiFetch } from '../client';
import type { RabbitHole } from '../../types/rabbit-hole';

export function createRabbitHoles(titles: string[]) {
  return apiFetch<RabbitHole[]>('/rabbit-holes', {
    method: 'POST',
    body: JSON.stringify({ titles }),
  });
}

export function listRabbitHoles() {
  return apiFetch<RabbitHole[]>('/rabbit-holes');
}

export function getTodayRabbitHole() {
  return apiFetch<RabbitHole | null>('/rabbit-holes/today', {
    notFoundValue: null,
  });
}

export function skipRabbitHole(id: string) {
  return apiFetch<RabbitHole>(`/rabbit-holes/${id}/skip`, { method: 'PATCH' });
}

export function finishRabbitHole(id: string) {
  return apiFetch<RabbitHole>(`/rabbit-holes/${id}/finish`, {
    method: 'PATCH',
  });
}

export function nextRabbitHole() {
  return apiFetch<RabbitHole>('/rabbit-holes/next', { method: 'POST' });
}

export function resetRabbitHoles() {
  return apiFetch<void>('/rabbit-holes/reset', { method: 'POST' });
}

export function deleteRabbitHole(id: string) {
  return apiFetch<void>(`/rabbit-holes/${id}`, { method: 'DELETE' });
}

export function updateRabbitHole(id: string, title: string) {
  return apiFetch<RabbitHole>(`/rabbit-holes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}
