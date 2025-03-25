import express from 'express';
import cvRoutes from './routes/cvRoutes';
import dotenv from 'dotenv';

// Load environment variables at the very top
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/api', cvRoutes); // Mount routes under /api prefix

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});