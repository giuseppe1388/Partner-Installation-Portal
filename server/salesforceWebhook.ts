import * as db from "./db";

interface ScheduleWebhookPayload {
  ServiceAppointmentId: string;
  StartDateTime: string;
  EndDateTime: string;
}

/**
 * Send scheduled installation data to Salesforce webhook
 * @param installationId Installation ID
 * @returns Success status
 */
export async function sendScheduleToSalesforce(installationId: number): Promise<boolean> {
  try {
    // Get installation data
    const installation = await db.getInstallationById(installationId);
    if (!installation) {
      console.error('[SalesforceWebhook] Installation not found:', installationId);
      return false;
    }

    if (!installation.scheduledStart || !installation.scheduledEnd) {
      console.error('[SalesforceWebhook] Installation not scheduled:', installationId);
      return false;
    }

    // Get partner and team data
    const partner = installation.partnerId ? await db.getPartnerById(installation.partnerId) : null;
    const team = installation.teamId ? await db.getTeamById(installation.teamId) : null;

    if (!partner || !team) {
      console.error('[SalesforceWebhook] Partner or team not found');
      return false;
    }

    // Get Salesforce webhook URL from configuration
    const webhookConfig = await db.getApiConfig('salesforce_webhook_url');
    if (!webhookConfig || !webhookConfig.configValue) {
      console.warn('[SalesforceWebhook] Salesforce webhook URL not configured');
      return false;
    }

    const webhookUrl = webhookConfig.configValue;

    // Prepare payload (only dates, Partner and Team are managed in Salesforce)
    const payload: ScheduleWebhookPayload = {
      ServiceAppointmentId: installation.serviceAppointmentId,
      StartDateTime: new Date(installation.scheduledStart).toISOString(),
      EndDateTime: new Date(installation.scheduledEnd).toISOString(),
    };

    console.log('[SalesforceWebhook] Sending payload to Salesforce:', payload);

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[SalesforceWebhook] Failed to send webhook:', response.statusText);
      return false;
    }

    const responseData = await response.json();
    console.log('[SalesforceWebhook] Webhook sent successfully:', responseData);

    return true;
  } catch (error) {
    console.error('[SalesforceWebhook] Error sending webhook to Salesforce:', error);
    return false;
  }
}

