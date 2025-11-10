
import express from 'express';
import { simulateEvent } from '../controllers/simulationController';

const router = express.Router();

// Route to trigger a simulation
router.post('/event', simulateEvent);

export default router;
