
import { Request, Response } from 'express';

// In-memory store for settings
let settings = {
  isAiEnabled: true,
  isTwilioEnabled: true,
};

/**
 * Retrieves the current settings.
 */
export const getSettings = (req: Request, res: Response) => {
  res.status(200).json(settings);
};

/**
 * Updates the settings.
 */
export const updateSettings = (req: Request, res: Response) => {
  const { isAiEnabled, isTwilioEnabled } = req.body;

  if (typeof isAiEnabled === 'boolean') {
    settings.isAiEnabled = isAiEnabled;
  }
  if (typeof isTwilioEnabled === 'boolean') {
    settings.isTwilioEnabled = isTwilioEnabled;
  }

  res.status(200).json(settings);
};

// Export the settings object so other modules can access it
export const getFeatureSettings = () => settings;
