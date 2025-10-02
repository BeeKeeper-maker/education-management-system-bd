import { Request, Response } from 'express';
import { db } from '../db';
import { smsLogs, users } from '../db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { sendSms, sendBulkSms } from '../services/sms.service';

/**
 * Send SMS to a single recipient
 * POST /api/sms/send
 */
export const sendSingleSms = async (req: Request, res: Response) => {
  try {
    const {
      recipientUserId,
      recipientPhone,
      recipientName,
      message,
      messageType = 'general',
      relatedEntityType,
      relatedEntityId,
    } = req.body;

    const userId = req.user?.id;

    if (!recipientPhone || !message) {
      return res.status(400).json({ message: 'Recipient phone and message are required' });
    }

    const result = await sendSms({
      recipientUserId,
      recipientPhone,
      recipientName,
      message,
      messageType,
      relatedEntityType,
      relatedEntityId,
      sentBy: userId,
    });

    if (result.success) {
      res.json({
        message: 'SMS sent successfully',
        smsLog: result.smsLog,
      });
    } else {
      res.status(500).json({
        message: 'Failed to send SMS',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
};

/**
 * Send SMS to multiple recipients
 * POST /api/sms/send-bulk
 */
export const sendBulkSmsHandler = async (req: Request, res: Response) => {
  try {
    const {
      recipients,
      message,
      messageType = 'general',
    } = req.body;

    const userId = req.user?.id;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients array is required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await sendBulkSms(recipients, message, messageType, userId);

    res.json({
      message: 'Bulk SMS sent',
      total: result.total,
      success: result.success,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ message: 'Failed to send bulk SMS' });
  }
};

/**
 * Get SMS logs with filters
 * GET /api/sms/logs
 */
export const getSmsLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      messageType,
      status,
      recipientPhone,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    if (messageType) {
      conditions.push(eq(smsLogs.messageType, messageType as string));
    }

    if (status) {
      conditions.push(eq(smsLogs.status, status as string));
    }

    if (recipientPhone) {
      conditions.push(sql`${smsLogs.recipientPhone} ILIKE ${`%${recipientPhone}%`}`);
    }

    if (startDate) {
      conditions.push(sql`${smsLogs.sentAt} >= ${new Date(startDate as string)}`);
    }

    if (endDate) {
      conditions.push(sql`${smsLogs.sentAt} <= ${new Date(endDate as string)}`);
    }

    // Fetch SMS logs
    const logs = await db
      .select({
        id: smsLogs.id,
        recipientPhone: smsLogs.recipientPhone,
        recipientName: smsLogs.recipientName,
        message: smsLogs.message,
        messageType: smsLogs.messageType,
        status: smsLogs.status,
        provider: smsLogs.provider,
        errorMessage: smsLogs.errorMessage,
        sentAt: smsLogs.sentAt,
        deliveredAt: smsLogs.deliveredAt,
        cost: smsLogs.cost,
        sentBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(smsLogs)
      .leftJoin(users, eq(smsLogs.sentBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(smsLogs.sentAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(smsLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get statistics
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        sent: sql<number>`count(*) filter (where ${smsLogs.status} = 'sent')`,
        failed: sql<number>`count(*) filter (where ${smsLogs.status} = 'failed')`,
        pending: sql<number>`count(*) filter (where ${smsLogs.status} = 'pending')`,
      })
      .from(smsLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      logs,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching SMS logs:', error);
    res.status(500).json({ message: 'Failed to fetch SMS logs' });
  }
};

/**
 * Get SMS statistics
 * GET /api/sms/stats
 */
export const getSmsStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const conditions = [];

    if (startDate) {
      conditions.push(sql`${smsLogs.sentAt} >= ${new Date(startDate as string)}`);
    }

    if (endDate) {
      conditions.push(sql`${smsLogs.sentAt} <= ${new Date(endDate as string)}`);
    }

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        sent: sql<number>`count(*) filter (where ${smsLogs.status} = 'sent')`,
        failed: sql<number>`count(*) filter (where ${smsLogs.status} = 'failed')`,
        pending: sql<number>`count(*) filter (where ${smsLogs.status} = 'pending')`,
        totalCost: sql<number>`sum(cast(${smsLogs.cost} as decimal))`,
        byType: sql<any>`
          json_object_agg(
            ${smsLogs.messageType},
            count(*)
          )
        `,
      })
      .from(smsLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    res.status(500).json({ message: 'Failed to fetch SMS statistics' });
  }
};