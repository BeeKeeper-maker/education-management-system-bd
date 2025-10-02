import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  expenseDate: string;
  vendor?: string;
  invoiceNumber?: string;
  paymentMethod: string;
  recordedBy: string;
  createdAt: string;
}

export default function ExpenseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    invoiceNumber: '',
    paymentMethod: 'cash',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [expenses, searchQuery, filterCategory, filterDateFrom, filterDateTo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, expensesRes, statsRes] = await Promise.all([
        fetch('/api/expenses/categories', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/expenses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/expenses/reports/statistics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!categoriesRes.ok || !expensesRes.ok) throw new Error('Failed to load data');

      const categoriesData = await categoriesRes.json();
      const expensesData = await expensesRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setCategories(categoriesData.categories || []);
      setExpenses(expensesData.expenses || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.vendor?.toLowerCase().includes(query) ||
          expense.invoiceNumber?.toLowerCase().includes(query) ||
          expense.categoryName.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((expense) => expense.categoryId === filterCategory);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(
        (expense) => new Date(expense.expenseDate) >= new Date(filterDateFrom)
      );
    }
    if (filterDateTo) {
      filtered = filtered.filter(
        (expense) => new Date(expense.expenseDate) <= new Date(filterDateTo)
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleCreateExpense = async () => {
    if (!formData.categoryId || !formData.amount || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create expense');
      }

      toast({
        title: 'Success',
        description: 'Expense recorded successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Create expense error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create expense',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update expense');
      }

      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });

      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Update expense error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update expense',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete expense');

      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });

      loadData();
    } catch (error) {
      console.error('Delete expense error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      categoryId: expense.categoryId,
      amount: expense.amount.toString(),
      description: expense.description,
      expenseDate: format(new Date(expense.expenseDate), 'yyyy-MM-dd'),
      vendor: expense.vendor || '',
      invoiceNumber: expense.invoiceNumber || '',
      paymentMethod: expense.paymentMethod,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      description: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      vendor: '',
      invoiceNumber: '',
      paymentMethod: 'cash',
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Vendor', 'Invoice', 'Payment Method'];
    const rows = filteredExpenses.map((expense) => [
      format(new Date(expense.expenseDate), 'yyyy-MM-dd'),
      expense.categoryName,
      expense.description,
      expense.amount.toFixed(2),
      expense.vendor || '',
      expense.invoiceNumber || '',
      expense.paymentMethod,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Export Successful',
      description: 'Expenses exported to CSV',
    });
  };

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground">Record and track institutional expenses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>Enter expense details</DialogDescription>
            </DialogHeader>
            <ExpenseForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              onSubmit={handleCreateExpense}
              isSubmitting={isSubmitting}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredExpenses
                .filter((exp) => {
                  const expDate = new Date(exp.expenseDate);
                  const now = new Date();
                  return (
                    expDate.getMonth() === now.getMonth() &&
                    expDate.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, exp) => sum + exp.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Expense categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredExpenses.length > 0
                ? (totalExpenses / filteredExpenses.length).toFixed(2)
                : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
            >
              Clear Filters
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No expenses found</p>
              <p className="text-sm">Try adjusting your filters or add a new expense</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Vendor</th>
                    <th className="text-left p-2">Invoice</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-center p-2">Payment</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{expense.categoryName}</Badge>
                      </td>
                      <td className="p-2 max-w-xs truncate">{expense.description}</td>
                      <td className="p-2">{expense.vendor || '-'}</td>
                      <td className="p-2">{expense.invoiceNumber || '-'}</td>
                      <td className="text-right p-2 font-semibold">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="secondary">{expense.paymentMethod}</Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-muted">
                    <td colSpan={5} className="p-2 text-right">
                      TOTAL:
                    </td>
                    <td className="text-right p-2">${totalExpenses.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <ExpenseForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onSubmit={handleEditExpense}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedExpense(null);
              resetForm();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Expense Form Component
function ExpenseForm({
  formData,
  setFormData,
  categories,
  onSubmit,
  isSubmitting,
  onCancel,
}: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: ExpenseCategory) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          placeholder="Enter expense description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Expense Date *</Label>
          <Input
            id="expenseDate"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor/Payee</Label>
          <Input
            id="vendor"
            placeholder="Enter vendor name"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            placeholder="Enter invoice number"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}