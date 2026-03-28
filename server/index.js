import express from 'express';
import cors from 'cors';
import summarizeRouter from './routes/summarize.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', summarizeRouter);

app.listen(3000, () => console.log('Server is running on port 3000'));