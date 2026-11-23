// Photo validation shared by request attachments and portfolio photos (base64 data URLs).
export const MAX_IMAGES = 3;
export const MAX_PHOTO_CHARS = 450_000;          // per stored photo (base64 data URL); the client compresses to ~300 KB
export const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
