import { Request, Response } from 'express';
import { db } from '../db';
import { expenseCategories, expenses, users } from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

// Get all expense categories
export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.isActive, true))
      .orderBy(expenseCategories.name);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories',
    });
  }
};

// Create expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      title,
      description,
      amount,
      expenseDate,
      paymentMethod,
      invoiceNumber,
      vendorName,
      remarks,
    } = req.body;

    const recordedBy = req.user!.id;

    // Validate required fields
    if (!categoryId || !title || !amount || !expenseDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const [expense] = await db
      .insert(expenses)
      .values({
        categoryId,
        title,
        description: description || null,
        amount: amount.toString(),
        expenseDate,
        paymentMethod,
        invoiceNumber: invoiceNumber || null,
        vendorName: vendorName || null,
        remarks: remarks || null,
        recordedBy,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record expense',
    });
  }
};

// Get all expenses
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categoryId } = req.query;

    let query = db
      .select({
        id: expenses.id,
        title: expenses.title,
        description: expenses.description,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        paymentMethod: expenses.paymentMethod,
        invoiceNumber: expenses.invoiceNumber,
        vendorName: expenses.vendorName,
        remarks: expenses.remarks,
        category: {
          id: expenseCategories.id,
          name: expenseCategories.name,
        },
        recordedBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(users, eq(expenses.recordedBy, users.id));

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(expenses.expenseDate, startDate as string),
          lte(expenses.expenseDate, endDate as string)
        )
      );
    }

    if (categoryId) {
      query = query.where(eq(expenses.categoryId, categoryId as string));
    }

    const allExpenses = await query.orderBy(desc(expenses.expenseDate));

    res.status(200).json({
      success: true,
      data: allExpenses,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
    });
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [expense] = await db
      .select({
        id: expenses.id,
        title: expenses.title,
        description: expenses.description,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        paymentMethod: expenses.paymentMethod,
        invoiceNumber: expenses.invoiceNumber,
        vendorName: expenses.vendorName,
        remarks: expenses.remarks,
        category: {
          id: expenseCategories.id,
          name: expenseCategories.name,
        },
        recordedBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(users, eq(expenses.recordedBy, users.id))
      .where(eq(expenses.id, id));

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
    });
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      title,
      description,
      amount,
      expenseDate,
      paymentMethod,
      invoiceNumber,
      vendorName,
      remarks,
    } = req.body;

    const [updated] = await db
      .update(expenses)
      .set({
        categoryId,
        title,
        description,
        amount: amount.toString(),
        expenseDate,
        paymentMethod,
        invoiceNumber,
        vendorName,
        remarks,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
    });
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(expenses).where(eq(expenses.id, id));

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
    });
  }
};

// Get expense statistics
export const getExpenseStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db
      .select({
        categoryName: expenseCategories.name,
        totalAmount: sql<number>`SUM(CAST(${expenses.amount} AS DECIMAL))`,
        expenseCount: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id));

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(expenses.expenseDate, startDate as string),
          lte(expenses.expenseDate, endDate as string)
        )
      );
    }

    const categoryStats = await query
      .groupBy(expenseCategories.name)
      .orderBy(desc(sql`SUM(CAST(${expenses.amount} AS DECIMAL))`));

    // Get total expenses
    const totalQuery = db
      .select({
        total: sql<number>`SUM(CAST(${expenses.amount} AS DECIMAL))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses);

    if (startDate && endDate) {
      totalQuery.where(
        and(
          gte(expenses.expenseDate, startDate as string),
          lte(expenses.expenseDate, endDate as string)
        )
      );
    }

    const [totals] = await totalQuery;

    res.status(200).json({
      success: true,
      data: {
        categoryStats,
        totals,
      },
    });
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
};

// Get financial summary (income vs expense)
export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total income (fee payments)
    const incomeQuery = db
      .select({
        total: sql<number>`SUM(CAST(fee_payments.amount AS DECIMAL))`,
      })
      .from(sql`fee_payments`);

    if (startDate && endDate) {
      incomeQuery.where(
        and(
          gte(sql`fee_payments.payment_date`, startDate as string),
          lte(sql`fee_payments.payment_date`, endDate as string)
        )
      );
    }

    const [income] = await incomeQuery;

    // Get total expenses
    const expenseQuery = db
      .select({
        total: sql<number>`SUM(CAST(${expenses.amount} AS DECIMAL))`,
      })
      .from(expenses);

    if (startDate && endDate) {
      expenseQuery.where(
        and(
          gte(expenses.expenseDate, startDate as string),
          lte(expenses.expenseDate, endDate as string)
        )
      );
    }

    const [expense] = await expenseQuery;

    const totalIncome = income?.total || 0;
    const totalExpense = expense?.total || 0;
    const netBalance = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        profitMargin: totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
    });
  }
};