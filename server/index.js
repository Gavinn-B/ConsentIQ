import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import simplifyRouter from './routes/simplify.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', simplifyRouter);

app.listen(3000, () => console.log('Server is running on port 3000'));