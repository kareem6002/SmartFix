// Vercel entry point: wraps the Express API, connecting to MongoDB once per warm instance.
import express from 'express';
import mongoose from 'mongoose';
import { app as api } from './src/app';
import { seed } from './src/seed';

let ready: Promise<void> | null = null;
function init() {
  if (!ready) {
    ready = (async () => {
      await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/smartfix');
      await seed();
    })().catch(e => { ready = null; throw e; });
  }
  return ready;
}

const server = express();
server.use(async (_req, res, next) => {
  try { await init(); next(); }
  catch (e) {
    console.error('DB connection failed', e);
    res.status(500).json({ error: 'Database connection failed' });
  }
});
server.use(api);

export default server;
