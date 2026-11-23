const pad = (n: number) => String(n).padStart(2, '0');
/** Date -> value for <input type="datetime-local"> (local time). */
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export type SlotId = 'tomorrow9' | 'tomorrow17' | 'in2days9';
export function quickSlots(now = new Date()): { id: SlotId; value: string }[] {
  const at = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return toLocalInput(d); };
  return [{ id: 'tomorrow9', value: at(1, 9) }, { id: 'tomorrow17', value: at(1, 17) }, { id: 'in2days9', value: at(2, 9) }];
}
