import * as db from "./db";

interface ScheduleWebhookPayload {
  eventType: string;
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
      eventType: 'schedule',
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



/**
 * Send cancellation data to Salesforce webhook
 * @param installationId Installation ID
 * @returns Success status
 */
export async function sendCancellationToSalesforce(installationId: number): Promise<boolean> {
  try {
    const installation = await db.getInstallationById(installationId);
    if (!installation) {
      console.error('[SalesforceWebhook] Installation not found:', installationId);
      return false;
    }

    const webhookConfig = await db.getApiConfig('salesforce_webhook_url');
    if (!webhookConfig || !webhookConfig.configValue) {
      console.warn('[SalesforceWebhook] Salesforce webhook URL not configured');
      return false;
    }

    const webhookUrl = webhookConfig.configValue;

    const payload = {
      eventType: 'cancellation',
      ServiceAppointmentId: installation.serviceAppointmentId,
      Status: 'Cancelled',
    };

    console.log('[SalesforceWebhook] Sending cancellation payload to Salesforce:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[SalesforceWebhook] Failed to send cancellation webhook:', response.statusText);
      return false;
    }

    const responseData = await response.json();
    console.log('[SalesforceWebhook] Cancellation webhook sent successfully:', responseData);

    return true;
  } catch (error) {
    console.error('[SalesforceWebhook] Error sending cancellation webhook to Salesforce:', error);
    return false;
  }
}




/**
 * Send rejection data to Salesforce webhook
 * @param installationId Installation ID
 * @param rejectionReason Reason for rejection
 * @returns Success status
 */
export async function sendRejectionToSalesforce(installationId: number, rejectionReason: string): Promise<boolean> {
  try {
    const installation = await db.getInstallationById(installationId);
    if (!installation) {
      console.error('[SalesforceWebhook] Installation not found:', installationId);
      return false;
    }

    const webhookConfig = await db.getApiConfig('salesforce_webhook_url');
    if (!webhookConfig || !webhookConfig.configValue) {
      console.warn('[SalesforceWebhook] Salesforce webhook URL not configured');
      return false;
    }

    const webhookUrl = webhookConfig.configValue;

    const payload = {
      eventType: 'rejection',
      ServiceAppointmentId: installation.serviceAppointmentId,
      Status: 'Rejected',
      RejectionReason: rejectionReason,
    };

    console.log('[SalesforceWebhook] Sending rejection payload to Salesforce:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[SalesforceWebhook] Failed to send rejection webhook:', response.statusText);
      return false;
    }

    const responseData = await response.json();
    console.log('[SalesforceWebhook] Rejection webhook sent successfully:', responseData);

    return true;
  } catch (error) {
    console.error('[SalesforceWebhook] Error sending rejection webhook to Salesforce:', error);
    return false;
  }
}




/**
 * Send acceptance data to Salesforce webhook
 * @param installationId Installation ID
 * @returns Success status
 */
export async function sendAcceptanceToSalesforce(installationId: number): Promise<boolean> {
  try {
    const installation = await db.getInstallationById(installationId);
    if (!installation) {
      console.error('[SalesforceWebhook] Installation not found:', installationId);
      return false;
    }

    const webhookConfig = await db.getApiConfig('salesforce_webhook_url');
    if (!webhookConfig || !webhookConfig.configValue) {
      console.warn('[SalesforceWebhook] Salesforce webhook URL not configured');
      return false;
    }

    const webhookUrl = webhookConfig.configValue;

    const payload = {
      eventType: 'acceptance',
      ServiceAppointmentId: installation.serviceAppointmentId,
      Status: 'Accepted',
    };

    console.log('[SalesforceWebhook] Sending acceptance payload to Salesforce:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[SalesforceWebhook] Failed to send acceptance webhook:', response.statusText);
      return false;
    }

    const responseData = await response.json();
    console.log('[SalesforceWebhook] Acceptance webhook sent successfully:', responseData);

    return true;
  } catch (error) {
    console.error('[SalesforceWebhook] Error sending acceptance webhook to Salesforce:', error);
    return false;
  }
}

