// Default profile photo, chosen by role + gender. Returns null when there is no matching photo
// (admins, or accounts without a gender) - the UI then shows an initial / shield instead.
const WITH_PHOTO = ['customer', 'technician', 'engineer', 'company'];
export const avatarSrc = (role?: string, gender?: string): string | null =>
  role && WITH_PHOTO.includes(role) && (gender === 'male' || gender === 'female') ? `/avatars/${role}-${gender}.webp` : null;
