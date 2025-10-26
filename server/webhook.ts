import { Router } from 'express';
import * as db from './db';
import { calculateTravelTimeForPartner } from './googleMaps';

export const webhookRouter = Router();

/**
 * Webhook endpoint to receive installation data from Salesforce
 * POST /api/webhook/salesforce
 * 
 * Expected payload:
 * {
 *   "ServiceAppointmentId": "string",
 *   "CustomerName": "string",
 *   "CustomerCF": "string",
 *   "CustomerPhone": "string",
 *   "CustomerEmail": "string",
 *   "CustomerAddress": "string",
 *   "InstallationAddress": "string",
 *   "TechnicalNotes": "string",
 *   "ImagesToView": ["url1", "url2"],
 *   "CompletionLink": "string",
 *   "DurationMinutes": number
 * }
 */
webhookRouter.post('/salesforce', async (req, res) => {
  try {
    const {
      ServiceAppointmentId,
      CustomerName,
      CustomerCF,
      CustomerPhone,
      CustomerEmail,
      CustomerAddress,
      InstallationAddress,
      TechnicalNotes,
      ImagesToView,
      CompletionLink,
      DurationMinutes,
    } = req.body;

    // Validate required fields
    if (!ServiceAppointmentId || !CustomerName || !InstallationAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ServiceAppointmentId, CustomerName, InstallationAddress',
      });
    }

    // Check if installation already exists
    const existing = await db.getInstallationByServiceAppointmentId(ServiceAppointmentId);
    
    if (existing) {
      // Update existing installation
      await db.updateInstallation(existing.id, {
        customerName: CustomerName,
        customerCF: CustomerCF,
        customerPhone: CustomerPhone,
        customerEmail: CustomerEmail,
        customerAddress: CustomerAddress,
        installationAddress: InstallationAddress,
        technicalNotes: TechnicalNotes,
        imagesToView: ImagesToView ? JSON.stringify(ImagesToView) : null,
        completionLink: CompletionLink,
        durationMinutes: DurationMinutes,
      });

      console.log(`[Webhook] Updated installation: ${ServiceAppointmentId}`);

      return res.json({
        success: true,
        message: 'Installation updated successfully',
        installationId: existing.id,
      });
    } else {
      // Create new installation
      const installation = await db.createInstallation({
        serviceAppointmentId: ServiceAppointmentId,
        customerName: CustomerName,
        customerCF: CustomerCF,
        customerPhone: CustomerPhone,
        customerEmail: CustomerEmail,
        customerAddress: CustomerAddress,
        installationAddress: InstallationAddress,
        technicalNotes: TechnicalNotes,
        imagesToView: ImagesToView ? JSON.stringify(ImagesToView) : null,
        completionLink: CompletionLink,
        durationMinutes: DurationMinutes,
        status: 'pending',
      });

      console.log(`[Webhook] Created installation: ${ServiceAppointmentId}`);

      return res.json({
        success: true,
        message: 'Installation created successfully',
        installationId: installation.id,
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing Salesforce webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Helper endpoint to test webhook functionality
 * POST /api/webhook/test
 */
webhookRouter.post('/test', async (req, res) => {
  try {
    console.log('[Webhook] Test webhook received:', req.body);
    
    return res.json({
      success: true,
      message: 'Test webhook received successfully',
      receivedData: req.body,
    });
  } catch (error) {
    console.error('[Webhook] Error in test webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default webhookRouter;

