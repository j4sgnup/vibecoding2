
import { Request, Response } from 'express';
import Alert from '../models/Alert';
import { AuditLog } from '../models/AuditLog';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { sendWhatsAppMessage } from '../services/notificationService';
import { getFeatureSettings } from './settingsController';

/**
 * Simulates an event, creates an audit log, and sends a WhatsApp notification if an alert is configured.
 */
export const simulateEvent = async (req: Request, res: Response) => {
  try {
    const { organizationId, actionType } = req.body;
    const { isTwilioEnabled } = getFeatureSettings();

    // 1. Fetch necessary data for a realistic log
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found for simulation.' });
    }

    // Use a real user as the actor for consistency
    const actor = await User.findOne({ orgId: organization.orgId });
    if (!actor) {
      return res.status(404).json({ message: 'Could not find a user in the specified organization to act as the simulator.' });
    }

    // 2. Create a new, valid audit log for the simulated event
    const newAuditLog = new AuditLog({
      timestamp: new Date(),
      actorId: actor._id,
      actorName: actor.name,
      actorEmail: actor.email,
      actionType: actionType,
      targetEntityName: organization.name,
      status: 'success',
      location: 'Simulation',
      orgId: organization.orgId,
      details: {
        simulation: true,
        reason: `Simulated event for alert testing.`,
        organizationName: organization.name,
        organizationId: organization.orgId
      },
    });
    await newAuditLog.save();

    // 3. Check if an alert exists for this organization and action
    const alert = await Alert.findOne({ organizationId: organization._id, action: actionType });

    if (alert) {
      if (isTwilioEnabled) {
        // 4. If an alert exists and Twilio is enabled, send a WhatsApp message
        const messageBody = `Alert: A simulated event '${actionType}' occurred for ${organization.name}.`;
        await sendWhatsAppMessage(messageBody);
        return res.status(200).json({ 
          message: 'Simulation successful. Audit log created and WhatsApp alert sent.',
          auditLog: newAuditLog 
        });
      } else {
        return res.status(200).json({ 
          message: 'Simulation successful. Audit log created, but Twilio is disabled. No message sent.',
          auditLog: newAuditLog 
        });
      }
    }

    res.status(200).json({ 
      message: 'Simulation successful. Audit log created, but no alert was configured for this event.',
      auditLog: newAuditLog 
    });

  } catch (error) {
    console.error('Error during simulation:', error);
    res.status(500).json({ message: 'Error during simulation', error });
  }
};
