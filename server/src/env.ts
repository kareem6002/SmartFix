// Loads .env files before anything else reads process.env (import this first).
// Looks in server/.env and in the project root (next to docker-compose.yml). Real environment variables always win.
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '../.env' });
