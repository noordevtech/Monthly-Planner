import { type TimeSlot } from "@shared/schema";

export function parseTimeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2})h(\d{0,2})$/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + minutes;
}

export function slotDurationHours(slot: { startTime: string; endTime: string }): number {
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);
  if (end <= start) return 0;
  return (end - start) / 60;
}

export function totalHoursFromSlots(slots: TimeSlot[]): number {
  return slots.reduce((sum, slot) => sum + slotDurationHours(slot), 0);
}
