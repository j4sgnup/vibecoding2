
import { Request, Response } from 'express';
import Alert from '../models/Alert';
import { Organization } from '../models/Organization';

/**
 * Creates a new alert.
 */
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { organizationId: orgId, action, phoneNumber } = req.body;

    // Find the organization document to get its ObjectId
    const organization = await Organization.findOne({ orgId });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const newAlert = new Alert({ organizationId: organization._id, action, phoneNumber });
    await newAlert.save();

    res.status(201).json(newAlert);
  } catch (error) {
    // Handle potential duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ message: 'An alert for this organization and action already exists.' });
    }
    res.status(500).json({ message: 'Error creating alert', error });
  }
};

/**
 * Deletes an alert.
 */
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const { organizationId: orgId, action } = req.params;
    
    const organization = await Organization.findOne({ orgId });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const result = await Alert.findOneAndDelete({ organizationId: organization._id, action });

    if (!result) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.status(200).json({ message: 'Alert deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert', error });
  }
};

/**
 * Checks if an alert exists for a given organization and action.
 */
export const checkAlert = async (req: Request, res: Response) => {
  try {
    const { organizationId: orgId, action } = req.query;

    const organization = await Organization.findOne({ orgId: orgId as string });
    if (!organization) {
      // If the org doesn't exist, no alert can exist for it.
      return res.status(200).json({ exists: false });
    }

    const alert = await Alert.findOne({ organizationId: organization._id, action });

    if (alert) {
      res.status(200).json({ exists: true, alert });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking alert', error });
  }
};
