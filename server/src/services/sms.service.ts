import { db } from '../db';
import { smsLogs, users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * SMS Service - Mock Implementation
 * This service provides a mock SMS gateway that logs messages to the database
 * In production, integrate with real providers like Twilio, Nexmo, etc.
 */

interface SendSmsOptions {
  recipientUserId?: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  messageType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sentBy?: string;
}

/**
 * Send SMS to a single recipient
 */
export const sendSms = async (options: SendSmsOptions): Promise<any> => {
  try {
    const {
      recipientUserId,
      recipientPhone,
      recipientName,
      message,
      messageType,
      relatedEntityType,
      relatedEntityId,
      sentBy,
    } = options;

    // Mock SMS sending - In production, call actual SMS provider API
    const mockResponse = await mockSmsProvider(recipientPhone, message);

    // Log SMS to database
    const [smsLog] = await db.insert(smsLogs).values({
      recipientUserId: recipientUserId || null,
      recipientPhone,
      recipientName: recipientName || null,
      message,
      messageType,
      status: mockResponse.success ? 'sent' : 'failed',
      provider: 'mock',
      providerId: mockResponse.messageId,
      errorMessage: mockResponse.error || null,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
      sentBy: sentBy || null,
      deliveredAt: mockResponse.success ? new Date() : null,
      cost: mockResponse.cost || null,
    }).returning();

    console.log(`📱 SMS ${mockResponse.success ? 'SENT' : 'FAILED'}: ${recipientPhone} - ${message.substring(0, 50)}...`);

    return {
      success: mockResponse.success,
      smsLog,
      error: mockResponse.error,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * Send SMS to multiple recipients
 */
export const sendBulkSms = async (
  recipients: Array<{
    userId?: string;
    phone: string;
    name?: string;
  }>,
  message: string,
  messageType: string,
  sentBy?: string
): Promise<any> => {
  try {
    const results = await Promise.all(
      recipients.map(recipient =>
        sendSms({
          recipientUserId: recipient.userId,
          recipientPhone: recipient.phone,
          recipientName: recipient.name,
          message,
          messageType,
          sentBy,
        })
      )
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    console.log(`📱 BULK SMS: ${successCount} sent, ${failedCount} failed`);

    return {
      total: results.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

/**
 * Send SMS notification for attendance
 */
export const sendAttendanceSms = async (
  guardianPhone: string,
  studentName: string,
  date: string,
  status: string
): Promise<any> => {
  const message = `Dear Guardian, ${studentName} was marked ${status.toUpperCase()} on ${date}. - EduPro`;
  
  return sendSms({
    recipientPhone: guardianPhone,
    message,
    messageType: 'attendance',
  });
};

/**
 * Send SMS notification for fee payment
 */
export const sendFeePaymentSms = async (
  guardianPhone: string,
  studentName: string,
  amount: number,
  receiptNumber: string
): Promise<any> => {
  const message = `Dear Guardian, Fee payment of $${amount} received for ${studentName}. Receipt: ${receiptNumber}. Thank you! - EduPro`;
  
  return sendSms({
    recipientPhone: guardianPhone,
    message,
    messageType: 'fee',
  });
};

/**
 * Send SMS notification for fee due
 */
export const sendFeeDueSms = async (
  guardianPhone: string,
  studentName: string,
  dueAmount: number,
  dueDate: string
): Promise<any> => {
  const message = `Dear Guardian, Fee of $${dueAmount} is due for ${studentName} by ${dueDate}. Please pay at your earliest convenience. - EduPro`;
  
  return sendSms({
    recipientPhone: guardianPhone,
    message,
    messageType: 'fee',
  });
};

/**
 * Send SMS notification for overdue library book
 */
export const sendLibraryOverdueSms = async (
  userPhone: string,
  userName: string,
  bookTitle: string,
  dueDate: string,
  fine: number
): Promise<any> => {
  const message = `Dear ${userName}, "${bookTitle}" is overdue (due: ${dueDate}). Fine: $${fine}. Please return immediately. - EduPro Library`;
  
  return sendSms({
    recipientPhone: userPhone,
    message,
    messageType: 'library',
  });
};

/**
 * Send SMS notification for exam schedule
 */
export const sendExamScheduleSms = async (
  guardianPhone: string,
  studentName: string,
  examName: string,
  examDate: string
): Promise<any> => {
  const message = `Dear Guardian, ${examName} for ${studentName} is scheduled on ${examDate}. Best wishes! - EduPro`;
  
  return sendSms({
    recipientPhone: guardianPhone,
    message,
    messageType: 'exam',
  });
};

/**
 * Send SMS notification for announcement
 */
export const sendAnnouncementSms = async (
  recipientPhone: string,
  recipientName: string,
  announcementTitle: string
): Promise<any> => {
  const message = `Dear ${recipientName}, New announcement: ${announcementTitle}. Check EduPro for details. - EduPro`;
  
  return sendSms({
    recipientPhone: recipientPhone,
    message,
    messageType: 'announcement',
  });
};

/**
 * Mock SMS Provider
 * Simulates an SMS gateway response
 * Replace this with actual provider integration (Twilio, Nexmo, etc.)
 */
async function mockSmsProvider(phone: string, message: string): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      messageId: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cost: '0.05', // Mock cost per SMS
    };
  } else {
    return {
      success: false,
      error: 'Mock error: Network timeout',
    };
  }
}

/**
 * Get user phone number
 */
export const getUserPhone = async (userId: string): Promise<string | null> => {
  try {
    const [user] = await db
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, userId));

    return user?.phone || null;
  } catch (error) {
    console.error('Error fetching user phone:', error);
    return null;
  }
};