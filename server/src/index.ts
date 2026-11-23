import './env';
import mongoose from 'mongoose';
import { app } from './app'; import { seed } from './seed';
(async () => {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/smartfix');
  await seed();
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => console.log('API on :' + PORT));
})();
