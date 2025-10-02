import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Receipt, 
  Download, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FeeStructure {
  id: string;
  name: string;
  totalAmount: number;
  items: FeeStructureItem[];
}

interface FeeStructureItem {
  id: string;
  categoryName: string;
  amount: number;
  dueDate: string;
}

interface StudentFee {
  id: string;
  feeStructure: FeeStructure;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  dueDate: string;
  assignedDate: string;
}

interface PaymentHistory {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  collectedBy: string;
  discountAmount?: number;
  remarks?: string;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function StudentFeeView() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate statistics
  const totalFees = studentFees.reduce((sum, fee) => sum + fee.totalAmount, 0);
  const totalPaid = studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalDue = studentFees.reduce((sum, fee) => sum + fee.dueAmount, 0);
  const paymentPercentage = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  // Prepare chart data
  const chartData = studentFees
    .filter(fee => fee.dueAmount > 0)
    .map(fee => ({
      name: fee.feeStructure.name,
      value: fee.dueAmount,
    }));

  // Load student fees
  useEffect(() => {
    loadStudentFees();
  }, []);

  const loadStudentFees = async () => {
    setIsLoading(true);
    try {
      const [feesResponse, paymentsResponse] = await Promise.all([
        fetch(`/api/fees/student/${user?.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`/api/fees/payments/${user?.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (!feesResponse.ok) throw new Error('Failed to load fees');

      const feesData = await feesResponse.json();
      const paymentsData = paymentsResponse.ok ? await paymentsResponse.json() : { payments: [] };

      setStudentFees(feesData.fees || []);
      setPaymentHistory(paymentsData.payments || []);
    } catch (error) {
      console.error('Load fees error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download receipt
  const handleDownloadReceipt = (receiptNumber: string) => {
    toast({
      title: 'Download Started',
      description: `Downloading receipt ${receiptNumber}`,
    });
    // TODO: Implement PDF download
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading fee information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Fees</h1>
        <p className="text-muted-foreground">View your fee structures and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All assigned fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {paymentPercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {(100 - paymentPercentage).toFixed(1)}% remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentHistory.length}</div>
            <p className="text-xs text-muted-foreground">Transactions made</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="fees" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fees">Fee Structures</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="breakdown">Fee Breakdown</TabsTrigger>
        </TabsList>

        {/* Fee Structures Tab */}
        <TabsContent value="fees" className="space-y-4">
          {studentFees.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Fee Structures</h3>
                  <p>No fees have been assigned to you yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentFees.map((fee) => (
                <Card key={fee.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    fee.status === 'paid' ? 'bg-green-500' :
                    fee.status === 'partial' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{fee.feeStructure.name}</CardTitle>
                      <Badge
                        variant={
                          fee.status === 'paid' ? 'default' :
                          fee.status === 'partial' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {fee.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Amount Summary */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-semibold">${fee.totalAmount.toFixed(2)}</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-xs text-muted-foreground">Paid</div>
                        <div className="font-semibold text-green-600">
                          ${fee.paidAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-xs text-muted-foreground">Due</div>
                        <div className="font-semibold text-red-600">
                          ${fee.dueAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Payment Progress</span>
                        <span>{((fee.paidAmount / fee.totalAmount) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(fee.paidAmount / fee.totalAmount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Fee Items */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Fee Components:</div>
                      <div className="space-y-1">
                        {fee.feeStructure.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                          >
                            <span className="text-muted-foreground">{item.categoryName}</span>
                            <span className="font-medium">${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Message */}
                    {fee.status === 'overdue' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>Payment overdue. Please pay as soon as possible.</span>
                      </div>
                    )}
                    {fee.status === 'paid' && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4" />
                        <span>All payments completed. Thank you!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          {paymentHistory.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
                  <p>You haven't made any payments yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All your fee payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.map((payment, index) => (
                    <Card key={payment.id} className="relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{payment.receiptNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${payment.amount.toFixed(2)}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {payment.paymentMethod}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
                          <div>
                            <span className="text-muted-foreground">Collected By:</span>
                            <div className="font-medium">{payment.collectedBy}</div>
                          </div>
                          {payment.discountAmount && payment.discountAmount > 0 && (
                            <div>
                              <span className="text-muted-foreground">Discount:</span>
                              <div className="font-medium text-red-600">
                                -${payment.discountAmount.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        {payment.remarks && (
                          <div className="mt-3 text-sm text-muted-foreground italic">
                            Note: {payment.remarks}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleDownloadReceipt(payment.receiptNumber)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fee Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Dues by Category</CardTitle>
                <CardDescription>Visual breakdown of pending payments</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                    <p className="font-medium">All Fees Paid!</p>
                    <p className="text-sm">You have no outstanding dues</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Timeline</CardTitle>
                <CardDescription>Recent payment activities</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No payment history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.slice(0, 5).map((payment, index) => (
                      <div key={payment.id} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              Payment #{paymentHistory.length - index}
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              ${payment.amount.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Summary</CardTitle>
              <CardDescription>Complete overview of all fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Fee Structure</th>
                      <th className="text-right p-2">Total Amount</th>
                      <th className="text-right p-2">Paid Amount</th>
                      <th className="text-right p-2">Due Amount</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentFees.map((fee) => (
                      <tr key={fee.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{fee.feeStructure.name}</td>
                        <td className="text-right p-2">${fee.totalAmount.toFixed(2)}</td>
                        <td className="text-right p-2 text-green-600">
                          ${fee.paidAmount.toFixed(2)}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          ${fee.dueAmount.toFixed(2)}
                        </td>
                        <td className="text-center p-2">
                          <Badge
                            variant={
                              fee.status === 'paid' ? 'default' :
                              fee.status === 'partial' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {fee.status}
                          </Badge>
                        </td>
                        <td className="text-center p-2 text-muted-foreground">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted">
                      <td className="p-2">TOTAL</td>
                      <td className="text-right p-2">${totalFees.toFixed(2)}</td>
                      <td className="text-right p-2 text-green-600">${totalPaid.toFixed(2)}</td>
                      <td className="text-right p-2 text-red-600">${totalDue.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}