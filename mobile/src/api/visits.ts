import { api } from "./client";
import type { Visit } from "./types";

export async function getVisit(id: string): Promise<Visit> {
  const res = await api.get(`/visits/${id}`);
  return res.data.visit;
}
export async function updateVisit(id: string, data: { note?: string | null; rating?: number | null }): Promise<Visit> {
  const res = await api.patch(`/visits/${id}`, data);
  return res.data.visit;
}
export async function deleteVisit(id: string): Promise<void> {
  await api.delete(`/visits/${id}`);
}
