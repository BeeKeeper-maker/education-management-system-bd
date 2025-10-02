import { Request, Response } from 'express';
import { db } from '../db';
import {
  feeCategories,
  feeStructures,
  feeStructureItems,
  studentFees,
  feePayments,
  feeDiscounts,
  students,
  users,
  classes,
  academicSessions,
     guardians,
     studentGuardians,
} from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
   import { sendFeePaymentSms, sendFeeDueSms } from '../services/sms.service';

// Get all fee categories
export const getFeeCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(feeCategories)
      .where(eq(feeCategories.isActive, true))
      .orderBy(feeCategories.name);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching fee categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee categories',
    });
  }
};

// Create fee structure
export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const { name, academicSessionId, classId, description, items } = req.body;

    // Validate required fields
    if (!name || !academicSessionId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create fee structure
    const [feeStructure] = await db
      .insert(feeStructures)
      .values({
        name,
        academicSessionId,
        classId: classId || null,
        description: description || null,
        isActive: true,
      })
      .returning();

    // Create fee structure items
    const itemsData = items.map((item: any) => ({
      feeStructureId: feeStructure.id,
      feeCategoryId: item.feeCategoryId,
      amount: item.amount.toString(),
      dueDate: item.dueDate || null,
      isOptional: item.isOptional || false,
    }));

    await db.insert(feeStructureItems).values(itemsData);

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: feeStructure,
    });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fee structure',
    });
  }
};

// Get all fee structures
export const getFeeStructures = async (req: Request, res: Response) => {
  try {
    const { academicSessionId, classId } = req.query;

    let query = db
      .select({
        id: feeStructures.id,
        name: feeStructures.name,
        description: feeStructures.description,
        isActive: feeStructures.isActive,
        academicSession: {
          id: academicSessions.id,
          name: academicSessions.name,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .leftJoin(academicSessions,
     guardians,
     studentGuardians, eq(feeStructures.academicSessionId, academicSessions.id))
      .leftJoin(classes, eq(feeStructures.classId, classes.id));

    if (academicSessionId) {
      query = query.where(eq(feeStructures.academicSessionId, academicSessionId as string));
    }

    if (classId) {
      query = query.where(eq(feeStructures.classId, classId as string));
    }

    const structures = await query.orderBy(desc(feeStructures.createdAt));

    res.status(200).json({
      success: true,
      data: structures,
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structures',
    });
  }
};

// Get fee structure by ID with items
export const getFeeStructureById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [structure] = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id));

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
    }

    const items = await db
      .select({
        id: feeStructureItems.id,
        amount: feeStructureItems.amount,
        dueDate: feeStructureItems.dueDate,
        isOptional: feeStructureItems.isOptional,
        category: {
          id: feeCategories.id,
          name: feeCategories.name,
          description: feeCategories.description,
        },
      })
      .from(feeStructureItems)
      .leftJoin(feeCategories, eq(feeStructureItems.feeCategoryId, feeCategories.id))
      .where(eq(feeStructureItems.feeStructureId, id));

    res.status(200).json({
      success: true,
      data: {
        ...structure,
        items,
      },
    });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structure',
    });
  }
};

// Assign fee structure to student
export const assignFeeToStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, feeStructureId, academicSessionId } = req.body;

    // Get fee structure items
    const items = await db
      .select()
      .from(feeStructureItems)
      .where(eq(feeStructureItems.feeStructureId, feeStructureId));

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    // Check if already assigned
    const existing = await db
      .select()
      .from(studentFees)
      .where(
        and(
          eq(studentFees.studentId, studentId),
          eq(studentFees.feeStructureId, feeStructureId),
          eq(studentFees.academicSessionId, academicSessionId)
        )
      );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Fee structure already assigned to this student',
      });
    }

    const [studentFee] = await db
      .insert(studentFees)
      .values({
        studentId,
        feeStructureId,
        academicSessionId,
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        discountAmount: '0',
        waiverAmount: '0',
        dueAmount: totalAmount.toString(),
        status: 'pending',
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Fee assigned to student successfully',
      data: studentFee,
    });
  } catch (error) {
    console.error('Error assigning fee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign fee',
    });
  }
};

// Collect fee payment
export const collectFeePayment = async (req: Request, res: Response) => {
  try {
    const {
      studentFeeId,
      studentId,
      amount,
      paymentDate,
      paymentMethod,
      transactionId,
      remarks,
    } = req.body;

    const collectedBy = req.user!.id;

    // Validate required fields
    if (!studentFeeId || !studentId || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get student fee details
    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, studentFeeId));

    if (!studentFee) {
      return res.status(404).json({
        success: false,
        message: 'Student fee not found',
      });
    }

    const dueAmount = parseFloat(studentFee.dueAmount);
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > dueAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds due amount',
      });
    }

    // Generate receipt number
    const receiptNumber = `RCP${Date.now()}`;

    // Create payment record
    const [payment] = await db
      .insert(feePayments)
      .values({
        studentFeeId,
        studentId,
        amount: amount.toString(),
        paymentDate,
        paymentMethod,
        transactionId: transactionId || null,
        receiptNumber,
        remarks: remarks || null,
        collectedBy,
      })
      .returning();

    // Update student fee
    const newPaidAmount = parseFloat(studentFee.paidAmount) + paymentAmount;
    const newDueAmount = dueAmount - paymentAmount;
    const newStatus = newDueAmount === 0 ? 'paid' : newDueAmount < parseFloat(studentFee.totalAmount) ? 'partial' : 'pending';

    await db
      .update(studentFees)
      .set({
        paidAmount: newPaidAmount.toString(),
        dueAmount: newDueAmount.toString(),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(studentFees.id, studentFeeId));

   
       // Send SMS notification to guardian
       try {
         const [student] = await db
           .select({
             name: users.name,
           })
           .from(students)
           .innerJoin(users, eq(students.userId, users.id))
           .where(eq(students.id, studentId));

         if (student) {
           const [guardianInfo] = await db
             .select({
               phone: guardians.phone,
             })
             .from(studentGuardians)
             .innerJoin(guardians, eq(studentGuardians.guardianId, guardians.id))
             .where(eq(studentGuardians.studentId, studentId))
             .limit(1);

           if (guardianInfo?.phone) {
             await sendFeePaymentSms(
               guardianInfo.phone,
               student.name,
               paymentAmount,
               receiptNumber
             );
           }
         }
       } catch (smsError) {
         console.error('Error sending fee payment SMS:', smsError);
       }
   
       res.status(201).json({
      success: true,
      message: 'Payment collected successfully',
      data: {
        payment,
        receiptNumber,
      },
    });
  } catch (error) {
    console.error('Error collecting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to collect payment',
    });
  }
};

// Get student fees
export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicSessionId } = req.query;

    let query = db
      .select({
        id: studentFees.id,
        totalAmount: studentFees.totalAmount,
        paidAmount: studentFees.paidAmount,
        discountAmount: studentFees.discountAmount,
        waiverAmount: studentFees.waiverAmount,
        dueAmount: studentFees.dueAmount,
        status: studentFees.status,
        feeStructure: {
          id: feeStructures.id,
          name: feeStructures.name,
        },
        academicSession: {
          id: academicSessions.id,
          name: academicSessions.name,
        },
        createdAt: studentFees.createdAt,
      })
      .from(studentFees)
      .leftJoin(feeStructures, eq(studentFees.feeStructureId, feeStructures.id))
      .leftJoin(academicSessions,
     guardians,
     studentGuardians, eq(studentFees.academicSessionId, academicSessions.id))
      .where(eq(studentFees.studentId, studentId));

    if (academicSessionId) {
      query = query.where(
        and(
          eq(studentFees.studentId, studentId),
          eq(studentFees.academicSessionId, academicSessionId as string)
        )
      );
    }

    const fees = await query.orderBy(desc(studentFees.createdAt));

    res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student fees',
    });
  }
};

// Get payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = db
      .select({
        id: feePayments.id,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        paymentMethod: feePayments.paymentMethod,
        transactionId: feePayments.transactionId,
        receiptNumber: feePayments.receiptNumber,
        remarks: feePayments.remarks,
        collectedBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: feePayments.createdAt,
      })
      .from(feePayments)
      .leftJoin(users, eq(feePayments.collectedBy, users.id))
      .where(eq(feePayments.studentId, studentId));

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(feePayments.studentId, studentId),
          gte(feePayments.paymentDate, startDate as string),
          lte(feePayments.paymentDate, endDate as string)
        )
      );
    }

    const payments = await query.orderBy(desc(feePayments.paymentDate));

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
    });
  }
};

// Get fee collection report
export const getFeeCollectionReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, classId } = req.query;

    let query = db
      .select({
        date: feePayments.paymentDate,
        totalAmount: sql<number>`SUM(CAST(${feePayments.amount} AS DECIMAL))`,
        paymentCount: sql<number>`COUNT(*)`,
      })
      .from(feePayments);

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(feePayments.paymentDate, startDate as string),
          lte(feePayments.paymentDate, endDate as string)
        )
      );
    }

    const report = await query
      .groupBy(feePayments.paymentDate)
      .orderBy(desc(feePayments.paymentDate));

    // Get outstanding dues
    const outstandingQuery = db
      .select({
        totalDue: sql<number>`SUM(CAST(${studentFees.dueAmount} AS DECIMAL))`,
        studentCount: sql<number>`COUNT(DISTINCT ${studentFees.studentId})`,
      })
      .from(studentFees)
      .where(sql`CAST(${studentFees.dueAmount} AS DECIMAL) > 0`);

    const [outstanding] = await outstandingQuery;

    res.status(200).json({
      success: true,
      data: {
        dailyCollection: report,
        outstanding,
      },
    });
  } catch (error) {
    console.error('Error fetching fee collection report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
    });
  }
};