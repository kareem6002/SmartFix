import { describe, it, expect } from 'vitest';
import { avatarSrc } from './avatar';
describe('avatarSrc', () => {
  it('picks the photo by role and gender for all four photo roles', () => {
    for (const role of ['customer', 'technician', 'engineer', 'company'])
      for (const g of ['male', 'female']) expect(avatarSrc(role, g)).toBe(`/avatars/${role}-${g}.webp`);
  });
  it('has no photo for admins or unknown gender', () => {
    expect(avatarSrc('admin', 'male')).toBeNull();
    expect(avatarSrc('customer')).toBeNull();
    expect(avatarSrc('technician', 'other')).toBeNull();
    expect(avatarSrc(undefined, 'male')).toBeNull();
  });
});
