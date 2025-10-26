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
 *   "CustomerSurname": "string",
 *   "CustomerCF": "string",
 *   "CustomerPhone": "string",
 *   "CustomerEmail": "string",
 *   "CustomerAddress": "string",
 *   "InstallationAddress": "string",
 *   "InstallationType": "string",
 *   "TechnicalNotes": "string",
 *   "InstallerNotes": "string",
 *   "ImagesToView": ["url1", "url2"],
 *   "CompletionLink": "string",
 *   "PdfUrl": "string",
 *   "DurationMinutes": number,
 *   "ScheduledStart": "ISO datetime string",
 *   "ScheduledEnd": "ISO datetime string"
 * }
 */
webhookRouter.post('/salesforce', async (req, res) => {
  try {
    const {
      ServiceAppointmentId,
      CustomerName,
      CustomerSurname,
      CustomerCF,
      CustomerPhone,
      CustomerEmail,
      CustomerAddress,
      InstallationAddress,
      InstallationType,
      TechnicalNotes,
      InstallerNotes,
      ImagesToView,
      CompletionLink,
      PdfUrl,
      DurationMinutes,
      ScheduledStart,
      ScheduledEnd,
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
        customerSurname: CustomerSurname,
        customerCF: CustomerCF,
        customerPhone: CustomerPhone,
        customerEmail: CustomerEmail,
        customerAddress: CustomerAddress,
        installationAddress: InstallationAddress,
        installationType: InstallationType,
        technicalNotes: TechnicalNotes,
        installerNotes: InstallerNotes,
        imagesToView: ImagesToView ? JSON.stringify(ImagesToView) : null,
        completionLink: CompletionLink,
        pdfUrl: PdfUrl,
        durationMinutes: DurationMinutes,
        scheduledStart: ScheduledStart ? new Date(ScheduledStart) : undefined,
        scheduledEnd: ScheduledEnd ? new Date(ScheduledEnd) : undefined,
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
        customerSurname: CustomerSurname,
        customerCF: CustomerCF,
        customerPhone: CustomerPhone,
        customerEmail: CustomerEmail,
        customerAddress: CustomerAddress,
        installationAddress: InstallationAddress,
        installationType: InstallationType,
        technicalNotes: TechnicalNotes,
        installerNotes: InstallerNotes,
        imagesToView: ImagesToView ? JSON.stringify(ImagesToView) : null,
        completionLink: CompletionLink,
        pdfUrl: PdfUrl,
        durationMinutes: DurationMinutes,
        scheduledStart: ScheduledStart ? new Date(ScheduledStart) : undefined,
        scheduledEnd: ScheduledEnd ? new Date(ScheduledEnd) : undefined,
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
 * Webhook endpoint to delete installation when partner changes in Salesforce
 * POST /api/webhook/salesforce/delete
 * 
 * Expected payload:
 * {
 *   "ServiceAppointmentId": "string"
 * }
 */
webhookRouter.post('/salesforce/delete', async (req, res) => {
  try {
    const { ServiceAppointmentId } = req.body;

    if (!ServiceAppointmentId) {
      return res.status(400).json({
        success: false,
        error: 'ServiceAppointmentId is required',
      });
    }

    console.log('[Webhook Delete] Received delete request for:', ServiceAppointmentId);

    // Find installation by ServiceAppointmentId
    const installation = await db.getInstallationByServiceAppointmentId(ServiceAppointmentId);
    
    if (!installation) {
      console.warn('[Webhook Delete] Installation not found:', ServiceAppointmentId);
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
      });
    }

    // Delete installation
    await db.deleteInstallation(installation.id);

    console.log('[Webhook Delete] Deleted installation:', installation.id);
    
    return res.json({
      success: true,
      message: 'Installation deleted successfully',
      installationId: installation.id,
    });
  } catch (error) {
    console.error('[Webhook Delete] Error:', error);
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

