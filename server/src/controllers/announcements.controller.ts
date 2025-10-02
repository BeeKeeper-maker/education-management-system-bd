import { Request, Response } from 'express';
import { db } from '../db';
import { announcements, notifications, users, students, enrollments, classes } from '../db/schema';
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';

/**
 * Create a new announcement
 * POST /api/announcements
 */
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      targetAudience,
      targetClasses,
      priority = 'normal',
      isPinned = false,
      expiresAt,
      attachments,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate required fields
    if (!title || !content || !targetAudience) {
      return res.status(400).json({ message: 'Title, content, and target audience are required' });
    }

    // Create announcement
    const [announcement] = await db.insert(announcements).values({
      title,
      content,
      targetAudience,
      targetClasses: targetClasses || null,
      priority,
      isPinned,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      attachments: attachments || null,
      createdBy: userId,
    }).returning();

    // Create notifications for targeted users
    await createNotificationsForAnnouncement(announcement);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

/**
 * Get all announcements with filters
 * GET /api/announcements
 */
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      targetAudience,
      priority,
      isPinned,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    if (targetAudience) {
      conditions.push(eq(announcements.targetAudience, targetAudience as string));
    }

    if (priority) {
      conditions.push(eq(announcements.priority, priority as string));
    }

    if (isPinned !== undefined) {
      conditions.push(eq(announcements.isPinned, isPinned === 'true'));
    }

    if (search) {
      conditions.push(
        or(
          sql`${announcements.title} ILIKE ${`%${search}%`}`,
          sql`${announcements.content} ILIKE ${`%${search}%`}`
        )
      );
    }

    // Fetch announcements
    const announcementsList = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        targetAudience: announcements.targetAudience,
        targetClasses: announcements.targetClasses,
        priority: announcements.priority,
        isPinned: announcements.isPinned,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
        attachments: announcements.attachments,
        createdAt: announcements.createdAt,
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      announcements: announcementsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

/**
 * Get single announcement
 * GET /api/announcements/:id
 */
export const getAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [announcement] = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        targetAudience: announcements.targetAudience,
        targetClasses: announcements.targetClasses,
        priority: announcements.priority,
        isPinned: announcements.isPinned,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
        attachments: announcements.attachments,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(eq(announcements.id, id));

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Failed to fetch announcement' });
  }
};

/**
 * Update announcement
 * PUT /api/announcements/:id
 */
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      targetAudience,
      targetClasses,
      priority,
      isPinned,
      expiresAt,
      attachments,
    } = req.body;

    const [announcement] = await db
      .update(announcements)
      .set({
        title,
        content,
        targetAudience,
        targetClasses: targetClasses || null,
        priority,
        isPinned,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachments: attachments || null,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({
      message: 'Announcement updated successfully',
      announcement,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
};

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [announcement] = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

/**
 * Get announcements for a specific user
 * GET /api/announcements/user/:userId
 */
export const getUserAnnouncements = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build conditions based on user role
    const conditions = [
      or(
        eq(announcements.targetAudience, 'all'),
        eq(announcements.targetAudience, user.role)
      ),
    ];

    // If user is a student, also check class-specific announcements
    if (user.role === 'student') {
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, userId),
            eq(enrollments.status, 'active')
          )
        );

      if (enrollment) {
        conditions.push(
          sql`${announcements.targetClasses} @> ${JSON.stringify([enrollment.classId])}`
        );
      }
    }

    // Fetch announcements
    const announcementsList = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        isPinned: announcements.isPinned,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
        attachments: announcements.attachments,
      })
      .from(announcements)
      .where(or(...conditions))
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt))
      .limit(parseInt(limit as string));

    res.json({ announcements: announcementsList });
  } catch (error) {
    console.error('Error fetching user announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

/**
 * Get announcement statistics
 * GET /api/announcements/stats
 */
export const getAnnouncementStats = async (req: Request, res: Response) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        pinned: sql<number>`count(*) filter (where ${announcements.isPinned} = true)`,
        urgent: sql<number>`count(*) filter (where ${announcements.priority} = 'urgent')`,
        active: sql<number>`count(*) filter (where ${announcements.expiresAt} is null or ${announcements.expiresAt} > now())`,
      })
      .from(announcements);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

/**
 * Helper function to create notifications for announcement
 */
async function createNotificationsForAnnouncement(announcement: any) {
  try {
    let targetUserIds: string[] = [];

    // Determine target users based on audience
    if (announcement.targetAudience === 'all') {
      const allUsers = await db.select({ id: users.id }).from(users);
      targetUserIds = allUsers.map(u => u.id);
    } else if (announcement.targetAudience === 'class_specific' && announcement.targetClasses) {
      // Get students in specific classes
      const studentsInClasses = await db
        .select({ userId: students.userId })
        .from(students)
        .innerJoin(enrollments, eq(students.id, enrollments.studentId))
        .where(
          and(
            inArray(enrollments.classId, announcement.targetClasses),
            eq(enrollments.status, 'active')
          )
        );
      targetUserIds = studentsInClasses.map(s => s.userId);
    } else {
      // Get users by role
      const roleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, announcement.targetAudience));
      targetUserIds = roleUsers.map(u => u.id);
    }

    // Create notifications for all target users
    if (targetUserIds.length > 0) {
      const notificationData = targetUserIds.map(userId => ({
        userId,
        title: announcement.title,
        message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        type: 'announcement',
        relatedEntityType: 'announcement',
        relatedEntityId: announcement.id,
        actionUrl: `/announcements/${announcement.id}`,
      }));

      await db.insert(notifications).values(notificationData);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}