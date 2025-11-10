
import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = express.Router();

// Route to get the current settings
router.get('/', getSettings);

// Route to update the settings
router.post('/', updateSettings);

export default router;
