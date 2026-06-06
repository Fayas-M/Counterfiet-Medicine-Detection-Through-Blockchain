import { useState, useEffect } from 'react';
import { mockBlockchain, Medicine, Report } from '../services/mockBlockchain';
import { mockAuth, User } from '../services/mockAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Package, Activity, TrendingUp, Shield, Check, X, Users, UserPlus, Loader2, Flag } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingManufacturers, setPendingManufacturers] = useState<User[]>([]);
  const [showAddManufacturer, setShowAddManufacturer] = useState(false);
  const [newManufacturer, setNewManufacturer] = useState({ name: '', email: '', password: '', address: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadData();
    loadPendingUsers();
  }, []);

  const loadPendingUsers = () => {
    setPendingManufacturers(mockAuth.getPendingUsers('manufacturer'));
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (approvingUser && walletAddress.trim()) {
      mockAuth.updateUserStatus(approvingUser, 'approved', walletAddress.trim());
      toast.success('Manufacturer approved!');
      loadPendingUsers();
      setApprovingUser(null);
      setWalletAddress('');
    }
  };

  const handleReject = (email: string) => {
    mockAuth.updateUserStatus(email, 'rejected');
    toast.success('Manufacturer rejected!');
    loadPendingUsers();
  };

  const handleCreateManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const result = await mockAuth.adminCreateUser(
      newManufacturer.email,
      newManufacturer.password,
      newManufacturer.name,
      'manufacturer',
      newManufacturer.address || undefined
    );
    
    setIsAdding(false);
    if (result.success) {
      toast.success('Manufacturer added successfully!');
      setShowAddManufacturer(false);
      setNewManufacturer({ name: '', email: '', password: '', address: '' });
    } else {
      toast.error(result.error || 'Failed to add manufacturer');
    }
  };

  const loadData = () => {
    const allMedicines = mockBlockchain.getAllMedicines();
    setMedicines(allMedicines);
    const allReports = mockBlockchain.getAllReports();
    setReports(allReports);
  };

  const totalMedicines = medicines.length;
  const inDistribution = medicines.filter(m => !m.sold && m.currentOwner !== m.manufacturer).length;
  const sold = medicines.filter(m => m.sold).length;
  const inStock = medicines.filter(m => !m.sold && m.currentOwner === m.manufacturer).length;

  const manufacturers = new Set(medicines.map(m => m.manufacturer)).size;
  const totalValue = medicines.reduce((sum, m) => sum + m.price, 0);

  return (
    <div className="container mx-auto px-6 py-12 max-w-[1400px]">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and analytics</p>
        </div>
        <Dialog open={showAddManufacturer} onOpenChange={setShowAddManufacturer}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Add Manufacturer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Manufacturer</DialogTitle>
              <DialogDescription>
                Manually add a pre-approved manufacturer to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateManufacturer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input 
                  id="name" 
                  value={newManufacturer.name}
                  onChange={e => setNewManufacturer({...newManufacturer, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={newManufacturer.email}
                  onChange={e => setNewManufacturer({...newManufacturer, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={newManufacturer.password}
                  onChange={e => setNewManufacturer({...newManufacturer, password: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address (Optional)</Label>
                <Input 
                  id="address" 
                  value={newManufacturer.address}
                  onChange={e => setNewManufacturer({...newManufacturer, address: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Manufacturer...
                  </>
                ) : (
                  'Add Manufacturer'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Medicines</CardDescription>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-3xl">{totalMedicines}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>In Distribution</CardDescription>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <CardTitle className="text-3xl">{inDistribution}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Sold to Consumers</CardDescription>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-3xl">{sold}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>In Stock</CardDescription>
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle className="text-3xl">{inStock}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardDescription>Active Manufacturers</CardDescription>
            <CardTitle className="text-2xl">{manufacturers}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardDescription>Total Medicine Value</CardDescription>
            <CardTitle className="text-2xl">₹{totalValue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardDescription>Average Price</CardDescription>
            <CardTitle className="text-2xl">
              ₹{totalMedicines > 0 ? (totalValue / totalMedicines).toFixed(2) : '0.00'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Medicines</TabsTrigger>
          <TabsTrigger value="active">In Distribution</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingManufacturers.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0">
                {pendingManufacturers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {reports.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 bg-red-600">
                {reports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Registered Medicines</CardTitle>
              <CardDescription>Complete list of medicines in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No medicines registered yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Current Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transfers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.map((medicine) => (
                        <TableRow key={medicine.id}>
                          <TableCell className="font-mono text-xs">{medicine.serialNumber}</TableCell>
                          <TableCell>{medicine.name}</TableCell>
                          <TableCell>{medicine.brand}</TableCell>
                          <TableCell>₹{medicine.price}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {medicine.manufacturer.substring(0, 10)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {medicine.currentOwner.substring(0, 10)}...
                          </TableCell>
                          <TableCell>
                            {medicine.sold ? (
                              <Badge variant="secondary">Sold</Badge>
                            ) : medicine.currentOwner === medicine.manufacturer ? (
                              <Badge>In Stock</Badge>
                            ) : (
                              <Badge variant="outline">In Transit</Badge>
                            )}
                          </TableCell>
                          <TableCell>{medicine.history.length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Medicines in Distribution</CardTitle>
              <CardDescription>Currently in the supply chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Current Owner</TableHead>
                      <TableHead>Transfers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.filter(m => !m.sold).map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-mono text-xs">{medicine.serialNumber}</TableCell>
                        <TableCell>{medicine.name}</TableCell>
                        <TableCell>{medicine.brand}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {medicine.currentOwner.substring(0, 10)}...
                        </TableCell>
                        <TableCell>{medicine.history.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <CardTitle>Sold Medicines</CardTitle>
              <CardDescription>Completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Final Owner</TableHead>
                      <TableHead>Total Transfers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.filter(m => m.sold).map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-mono text-xs">{medicine.serialNumber}</TableCell>
                        <TableCell>{medicine.name}</TableCell>
                        <TableCell>{medicine.brand}</TableCell>
                        <TableCell>₹{medicine.price}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {medicine.currentOwner.substring(0, 10)}...
                        </TableCell>
                        <TableCell>{medicine.history.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Approvals</CardTitle>
              <CardDescription>Review and approve new manufacturer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingManufacturers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending manufacturer requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingManufacturers.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell className="font-semibold">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-gray-500">Today</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(user.email)}
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setApprovingUser(user.email)}
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Medicine Reports</CardTitle>
              <CardDescription>Reports submitted by consumers regarding potential counterfeits</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reports submitted</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Manufacturer ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(report.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-red-600">
                            {report.serialNumber}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {report.medicineName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {report.message}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {report.manufacturer.substring(0, 10)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={(open) => !open && setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Manufacturer</DialogTitle>
            <DialogDescription>
              Assign a wallet address to the new manufacturer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApproveSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="assignWallet">Wallet Address</Label>
              <Input 
                id="assignWallet" 
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="0x..."
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Confirm Approval
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
