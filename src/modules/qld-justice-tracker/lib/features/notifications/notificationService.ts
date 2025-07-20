import { getSupabaseAdmin } from '@/lib/supabase/server';
import { withRetry } from '@/lib/supabase/errors';
import { format } from 'date-fns';

export type NotificationType = 'data_update' | 'threshold_alert' | 'trend_change' | 'system_event';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationChannel = 'email' | 'webhook' | 'dashboard' | 'sms';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  enabled: boolean;
  conditions: {
    table?: string;
    field?: string;
    operator: 'gt' | 'lt' | 'eq' | 'change_pct';
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly';
  };
  channels: NotificationChannel[];
  recipients: string[];
  cooldownMinutes: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  ruleId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  recipients: string[];
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    notification: Notification;
    rule: NotificationRule;
    metadata?: any;
  };
}

export class NotificationService {
  private supabase = getSupabaseAdmin();

  /**
   * Create a new notification rule
   */
  async createRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule> {
    return withRetry(async () => {
      const newRule: NotificationRule = {
        ...rule,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('notification_rules')
        .insert(newRule)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification rule: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Update an existing notification rule
   */
  async updateRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('notification_rules')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification rule: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Delete a notification rule
   */
  async deleteRule(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await this.supabase
        .from('notification_rules')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete notification rule: ${error.message}`);
      }
    });
  }

  /**
   * Get all notification rules
   */
  async getRules(): Promise<NotificationRule[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('notification_rules')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notification rules: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Check data changes and trigger notifications
   */
  async checkDataChanges(table: string, changeData: any): Promise<Notification[]> {
    const rules = await this.getRules();
    const activeRules = rules.filter(rule => 
      rule.enabled && 
      (!rule.conditions.table || rule.conditions.table === table)
    );

    const notifications: Notification[] = [];

    for (const rule of activeRules) {
      try {
        const shouldTrigger = await this.evaluateRule(rule, changeData);
        
        if (shouldTrigger && this.canTrigger(rule)) {
          const notification = await this.createNotification(rule, changeData);
          notifications.push(notification);
          
          // Update last triggered time
          await this.updateRule(rule.id, {
            lastTriggered: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return notifications;
  }

  /**
   * Create and send a notification
   */
  async createNotification(
    rule: NotificationRule,
    triggerData?: any
  ): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      type: rule.type,
      priority: this.determinePriority(rule, triggerData),
      title: this.generateTitle(rule, triggerData),
      message: this.generateMessage(rule, triggerData),
      data: triggerData,
      channels: rule.channels,
      recipients: rule.recipients,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    // Save notification to database
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Send notification through configured channels
    await this.sendNotification(data);

    return data;
  }

  /**
   * Send notification through all configured channels
   */
  async sendNotification(notification: Notification): Promise<void> {
    const sendPromises = notification.channels.map(channel =>
      this.sendToChannel(notification, channel)
    );

    try {
      await Promise.allSettled(sendPromises);
      
      // Update status to sent
      await this.supabase
        .from('notifications')
        .update({
          status: 'sent',
          sentAt: new Date().toISOString(),
          attempts: notification.attempts + 1,
        })
        .eq('id', notification.id);
        
    } catch (error) {
      // Update status to failed
      await this.supabase
        .from('notifications')
        .update({
          status: 'failed',
          attempts: notification.attempts + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', notification.id);
        
      throw error;
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case 'webhook':
        await this.sendWebhook(notification);
        break;
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'dashboard':
        await this.sendToDashboard(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      default:
        console.warn(`Unsupported notification channel: ${channel}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
    if (!webhookUrl) return;

    const payload: WebhookPayload = {
      event: 'notification',
      timestamp: new Date().toISOString(),
      data: {
        notification,
        rule: await this.getRule(notification.ruleId),
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Email notification would be sent:', {
      to: notification.recipients,
      subject: notification.title,
      body: notification.message,
    });
  }

  /**
   * Send dashboard notification
   */
  private async sendToDashboard(notification: Notification): Promise<void> {
    // Store in dashboard notifications table for real-time display
    await this.supabase
      .from('dashboard_notifications')
      .insert({
        id: crypto.randomUUID(),
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        type: notification.type,
        read: false,
        createdAt: new Date().toISOString(),
      });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<void> {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('SMS notification would be sent:', {
      to: notification.recipients,
      message: `${notification.title}: ${notification.message}`,
    });
  }

  /**
   * Evaluate if a rule should trigger
   */
  private async evaluateRule(rule: NotificationRule, data: any): Promise<boolean> {
    const { conditions } = rule;

    if (!conditions.field || !(data as any)[conditions.field]) {
      return false;
    }

    const value = (data as any)[conditions.field];

    switch (conditions.operator) {
      case 'gt':
        return value > conditions.value;
      case 'lt':
        return value < conditions.value;
      case 'eq':
        return value === conditions.value;
      case 'change_pct':
        return await this.checkPercentageChange(rule, data);
      default:
        return false;
    }
  }

  /**
   * Check percentage change over time
   */
  private async checkPercentageChange(rule: NotificationRule, data: any): Promise<boolean> {
    const { conditions } = rule;
    const field = conditions.field!;
    const table = conditions.table!;
    
    // Get historical data based on timeframe
    const daysBack = conditions.timeframe === 'daily' ? 1 :
                    conditions.timeframe === 'weekly' ? 7 : 30;
    
    const { data: historicalData } = await this.supabase
      .from(table)
      .select(field)
      .gte('date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true })
      .limit(2);

    if (!historicalData || historicalData.length < 2) {
      return false;
    }

    const oldValue = (historicalData[0] as any)[field];
    const newValue = (data as any)[field];
    
    if (oldValue === 0) return false;
    
    const changePercent = ((newValue - oldValue) / oldValue) * 100;
    return Math.abs(changePercent) >= conditions.value;
  }

  /**
   * Check if rule can trigger (cooldown period)
   */
  private canTrigger(rule: NotificationRule): boolean {
    if (!rule.lastTriggered) return true;
    
    const lastTriggered = new Date(rule.lastTriggered);
    const cooldownEnd = new Date(lastTriggered.getTime() + rule.cooldownMinutes * 60000);
    
    return new Date() > cooldownEnd;
  }

  /**
   * Determine notification priority
   */
  private determinePriority(rule: NotificationRule, data?: any): NotificationPriority {
    // Default priority based on rule type
    const basePriority = rule.type === 'threshold_alert' ? 'high' :
                        rule.type === 'trend_change' ? 'medium' :
                        rule.type === 'system_event' ? 'critical' : 'low';

    // Adjust based on data values if available
    if (data && rule.conditions.field && (data as any)[rule.conditions.field]) {
      const value = (data as any)[rule.conditions.field];
      const threshold = rule.conditions.value;
      
      if (rule.conditions.operator === 'gt' && value > threshold * 2) {
        return 'critical';
      }
    }

    return basePriority;
  }

  /**
   * Generate notification title
   */
  private generateTitle(rule: NotificationRule, data?: any): string {
    const baseTitle = rule.name || 'Youth Justice Data Alert';
    
    if (data && rule.conditions.field) {
      const value = (data as any)[rule.conditions.field];
      return `${baseTitle}: ${rule.conditions.field} = ${value}`;
    }
    
    return baseTitle;
  }

  /**
   * Generate notification message
   */
  private generateMessage(rule: NotificationRule, data?: any): string {
    let message = rule.description || 'A notification rule has been triggered.';
    
    if (data && rule.conditions.field) {
      const value = (data as any)[rule.conditions.field];
      const condition = `${rule.conditions.operator} ${rule.conditions.value}`;
      message += ` Current value: ${value} (condition: ${condition})`;
    }
    
    message += ` Triggered at ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    
    return message;
  }

  /**
   * Get a notification rule by ID
   */
  private async getRule(id: string): Promise<NotificationRule> {
    const { data, error } = await this.supabase
      .from('notification_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch notification rule: ${error.message}`);
    }

    return data;
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark dashboard notification as read
   */
  async markNotificationRead(id: string): Promise<void> {
    await this.supabase
      .from('dashboard_notifications')
      .update({ read: true })
      .eq('id', id);
  }

  /**
   * Get unread dashboard notifications
   */
  async getUnreadNotifications(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('dashboard_notifications')
      .select('*')
      .eq('read', false)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch unread notifications: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();