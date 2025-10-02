import { Request, Response } from 'express';
import { db } from '../db';
import { periods, timetableEntries, classes, sections, subjects, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Get all periods
export const getPeriods = async (req: Request, res: Response) => {
  try {
    const allPeriods = await db
      .select()
      .from(periods)
      .orderBy(periods.orderIndex);

    res.status(200).json({
      success: true,
      data: allPeriods,
    });
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch periods',
    });
  }
};

// Create or update timetable entry
export const createTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId, subjectId, teacherId, periodId, dayOfWeek, roomNumber } = req.body;

    // Validate required fields
    if (!classId || !sectionId || !periodId || dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check for conflicts - same teacher at same time
    if (teacherId) {
      const conflict = await db
        .select()
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.teacherId, teacherId),
            eq(timetableEntries.periodId, periodId),
            eq(timetableEntries.dayOfWeek, dayOfWeek)
          )
        );

      if (conflict.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Teacher is already assigned to another class at this time',
          conflict: conflict[0],
        });
      }
    }

    // Check if entry already exists for this class/section/period/day
    const existing = await db
      .select()
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.classId, classId),
          eq(timetableEntries.sectionId, sectionId),
          eq(timetableEntries.periodId, periodId),
          eq(timetableEntries.dayOfWeek, dayOfWeek)
        )
      );

    if (existing.length > 0) {
      // Update existing entry
      const [updated] = await db
        .update(timetableEntries)
        .set({
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          roomNumber: roomNumber || null,
          updatedAt: new Date(),
        })
        .where(eq(timetableEntries.id, existing[0].id))
        .returning();

      return res.status(200).json({
        success: true,
        message: 'Timetable entry updated successfully',
        data: updated,
      });
    }

    // Create new entry
    const [newEntry] = await db
      .insert(timetableEntries)
      .values({
        classId,
        sectionId,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        periodId,
        dayOfWeek,
        roomNumber: roomNumber || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: newEntry,
    });
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timetable entry',
    });
  }
};

// Get timetable for a class/section
export const getClassTimetable = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId } = req.query;

    if (!classId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const timetable = await db
      .select({
        id: timetableEntries.id,
        dayOfWeek: timetableEntries.dayOfWeek,
        roomNumber: timetableEntries.roomNumber,
        period: {
          id: periods.id,
          name: periods.name,
          startTime: periods.startTime,
          endTime: periods.endTime,
          orderIndex: periods.orderIndex,
          isBreak: periods.isBreak,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
        teacher: {
          id: users.id,
          name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        },
      })
      .from(timetableEntries)
      .leftJoin(periods, eq(timetableEntries.periodId, periods.id))
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(users, eq(timetableEntries.teacherId, users.id))
      .where(
        and(
          eq(timetableEntries.classId, classId as string),
          eq(timetableEntries.sectionId, sectionId as string)
        )
      )
      .orderBy(timetableEntries.dayOfWeek, periods.orderIndex);

    // Group by day of week
    const groupedTimetable = timetable.reduce((acc: any, entry) => {
      const day = entry.dayOfWeek;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedTimetable,
    });
  } catch (error) {
    console.error('Error fetching class timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable',
    });
  }
};

// Get timetable for a teacher
export const getTeacherTimetable = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const timetable = await db
      .select({
        id: timetableEntries.id,
        dayOfWeek: timetableEntries.dayOfWeek,
        roomNumber: timetableEntries.roomNumber,
        period: {
          id: periods.id,
          name: periods.name,
          startTime: periods.startTime,
          endTime: periods.endTime,
          orderIndex: periods.orderIndex,
          isBreak: periods.isBreak,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
        section: {
          id: sections.id,
          name: sections.name,
        },
      })
      .from(timetableEntries)
      .leftJoin(periods, eq(timetableEntries.periodId, periods.id))
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(classes, eq(timetableEntries.classId, classes.id))
      .leftJoin(sections, eq(timetableEntries.sectionId, sections.id))
      .where(eq(timetableEntries.teacherId, teacherId))
      .orderBy(timetableEntries.dayOfWeek, periods.orderIndex);

    // Group by day of week
    const groupedTimetable = timetable.reduce((acc: any, entry) => {
      const day = entry.dayOfWeek;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedTimetable,
    });
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher timetable',
    });
  }
};

// Delete timetable entry
export const deleteTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));

    res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete timetable entry',
    });
  }
};

// Check for conflicts
export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const { teacherId, periodId, dayOfWeek, excludeEntryId } = req.query;

    if (!teacherId || !periodId || dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    let query = db
      .select({
        id: timetableEntries.id,
        className: classes.name,
        sectionName: sections.name,
        subjectName: subjects.name,
        periodName: periods.name,
        startTime: periods.startTime,
        endTime: periods.endTime,
      })
      .from(timetableEntries)
      .leftJoin(classes, eq(timetableEntries.classId, classes.id))
      .leftJoin(sections, eq(timetableEntries.sectionId, sections.id))
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(periods, eq(timetableEntries.periodId, periods.id))
      .where(
        and(
          eq(timetableEntries.teacherId, teacherId as string),
          eq(timetableEntries.periodId, periodId as string),
          eq(timetableEntries.dayOfWeek, parseInt(dayOfWeek as string))
        )
      );

    const conflicts = await query;

    // Filter out the entry being edited
    const filteredConflicts = excludeEntryId
      ? conflicts.filter(c => c.id !== excludeEntryId)
      : conflicts;

    res.status(200).json({
      success: true,
      hasConflict: filteredConflicts.length > 0,
      conflicts: filteredConflicts,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check conflicts',
    });
  }
};