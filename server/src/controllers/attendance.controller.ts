import { Request, Response } from 'express';
import { db } from '../db';
import { attendance, classAttendance, students, enrollments, users, guardians, studentGuardians } from '../db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { sendAttendanceSms } from '../services/sms.service';

// Mark attendance for a class
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId, date, attendanceRecords } = req.body;
    const markedBy = req.user!.id;

    // Validate required fields
    if (!classId || !sectionId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await db
      .select()
      .from(classAttendance)
      .where(
        and(
          eq(classAttendance.classId, classId),
          eq(classAttendance.sectionId, sectionId),
          eq(classAttendance.date, date)
        )
      );

    if (existingAttendance.length > 0 && existingAttendance[0].isFinalized) {
      return res.status(400).json({
        success: false,
        message: 'Attendance for this date is already finalized'
      });
    }

    // Delete existing attendance records for this date if updating
    if (existingAttendance.length > 0) {
      await db
        .delete(attendance)
        .where(
          and(
            eq(attendance.classId, classId),
            eq(attendance.sectionId, sectionId),
            eq(attendance.date, date)
          )
        );
    }

    // Insert new attendance records
    const attendanceData = attendanceRecords.map((record: any) => ({
      studentId: record.studentId,
      classId,
      sectionId,
      date,
      status: record.status || 'present',
      remarks: record.remarks || null,
      markedBy,
    }));

    await db.insert(attendance).values(attendanceData);


       // Send SMS notifications for absent students
       const absentStudents = attendanceRecords.filter((r: any) => r.status === 'absent');
       if (absentStudents.length > 0) {
         for (const record of absentStudents) {
           try {
             // Get student details
             const [student] = await db
               .select({
                 name: users.name,
                 userId: students.userId,
               })
               .from(students)
               .innerJoin(users, eq(students.userId, users.id))
               .where(eq(students.id, record.studentId));

             if (student) {
               // Get guardian phone
               const [guardianInfo] = await db
                 .select({
                   phone: guardians.phone,
                 })
                 .from(studentGuardians)
                 .innerJoin(guardians, eq(studentGuardians.guardianId, guardians.id))
                 .where(eq(studentGuardians.studentId, record.studentId))
                 .limit(1);

               if (guardianInfo?.phone) {
                 // Send SMS notification
                 await sendAttendanceSms(
                   guardianInfo.phone,
                   student.name,
                   new Date(date).toLocaleDateString(),
                   'absent'
                 );
               }
             }
           } catch (smsError) {
             console.error('Error sending attendance SMS:', smsError);
             // Continue even if SMS fails
           }
         }
       }

    // Calculate statistics
    const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const absentCount = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter((r: any) => r.status === 'late').length;
    const excusedCount = attendanceRecords.filter((r: any) => r.status === 'excused').length;

    // Update or create class attendance summary
    if (existingAttendance.length > 0) {
      await db
        .update(classAttendance)
        .set({
          totalStudents: attendanceRecords.length,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          markedBy,
          updatedAt: new Date(),
        })
        .where(eq(classAttendance.id, existingAttendance[0].id));
    } else {
      await db.insert(classAttendance).values({
        classId,
        sectionId,
        date,
        totalStudents: attendanceRecords.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        markedBy,
        isFinalized: false,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        totalStudents: attendanceRecords.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
      },
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark attendance' 
    });
  }
};

// Get attendance for a specific date and class
export const getAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId, date } = req.query;

    if (!classId || !sectionId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const attendanceRecords = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        status: attendance.status,
        remarks: attendance.remarks,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(attendance.classId, classId as string),
          eq(attendance.sectionId, sectionId as string),
          eq(attendance.date, date as string)
        )
      )
      .orderBy(sql`${users.firstName}`);

    res.status(200).json({
      success: true,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance'
    });
  }
};

// Get attendance statistics for a class/section
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId, startDate, endDate } = req.query;

    if (!classId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    let query = db
      .select()
      .from(classAttendance)
      .where(
        and(
          eq(classAttendance.classId, classId as string),
          eq(classAttendance.sectionId, sectionId as string)
        )
      );

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(classAttendance.classId, classId as string),
          eq(classAttendance.sectionId, sectionId as string),
          gte(classAttendance.date, startDate as string),
          lte(classAttendance.date, endDate as string)
        )
      );
    }

    const stats = await query.orderBy(desc(classAttendance.date));

    // Calculate overall statistics
    const totalDays = stats.length;
    const totalPresent = stats.reduce((sum, s) => sum + s.presentCount, 0);
    const totalAbsent = stats.reduce((sum, s) => sum + s.absentCount, 0);
    const totalLate = stats.reduce((sum, s) => sum + s.lateCount, 0);
    const totalExcused = stats.reduce((sum, s) => sum + s.excusedCount, 0);
    const totalStudents = stats.length > 0 ? stats[0].totalStudents : 0;

    const averageAttendance = totalDays > 0 
      ? ((totalPresent / (totalDays * totalStudents)) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDays,
        totalPresent,
        totalAbsent,
        totalLate,
        totalExcused,
        totalStudents,
        averageAttendance: parseFloat(averageAttendance as string),
        dailyStats: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
};

// Get student-specific attendance
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = db
      .select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        className: sql<string>`classes.name`,
        sectionName: sql<string>`sections.name`,
      })
      .from(attendance)
      .leftJoin(sql`classes`, eq(attendance.classId, sql`classes.id`))
      .leftJoin(sql`sections`, eq(attendance.sectionId, sql`sections.id`))
      .where(eq(attendance.studentId, studentId));

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, startDate as string),
          lte(attendance.date, endDate as string)
        )
      );
    }

    const records = await query.orderBy(desc(attendance.date));

    // Calculate statistics
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const excusedDays = records.filter(r => r.status === 'excused').length;

    const attendancePercentage = totalDays > 0 
      ? ((presentDays / totalDays) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage: parseFloat(attendancePercentage as string),
        records,
      },
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance'
    });
  }
};

// Finalize attendance (prevent further edits)
export const finalizeAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId, date } = req.body;

    await db
      .update(classAttendance)
      .set({ isFinalized: true, updatedAt: new Date() })
      .where(
        and(
          eq(classAttendance.classId, classId),
          eq(classAttendance.sectionId, sectionId),
          eq(classAttendance.date, date)
        )
      );

    res.status(200).json({
      success: true,
      message: 'Attendance finalized successfully',
    });
  } catch (error) {
    console.error('Error finalizing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize attendance'
    });
  }
};