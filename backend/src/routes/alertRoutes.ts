
import express from 'express';
import { createAlert, deleteAlert, checkAlert } from '../controllers/alertController';

const router = express.Router();

// Route to create a new alert
router.post('/', createAlert);

// Route to delete an alert by organizationId and action
router.delete('/:organizationId/:action', deleteAlert);

// Route to check if an alert exists
router.get('/check', checkAlert);

export default router;
