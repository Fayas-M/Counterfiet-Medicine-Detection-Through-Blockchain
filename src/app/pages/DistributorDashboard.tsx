import { useState, useEffect } from 'react';
import { mockAuth, User } from '../services/mockAuth';
import { mockBlockchain, Medicine } from '../services/mockBlockchain';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Search, Send, Loader2, Package, Truck, Check, X, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function DistributorDashboard() {
  const user = mockAuth.getCurrentUser();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [verifySerial, setVerifySerial] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState<Medicine | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [retailerAddress, setRetailerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRetailers, setPendingRetailers] = useState<User[]>([]);
  const [showAddRetailer, setShowAddRetailer] = useState(false);
  const [newRetailer, setNewRetailer] = useState({ name: '', email: '', password: '', address: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadMedicines();
    loadPendingUsers();
  }, []);

  const loadPendingUsers = () => {
    setPendingRetailers(mockAuth.getPendingUsers('retailer'));
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (approvingUser && walletAddress.trim()) {
      mockAuth.updateUserStatus(approvingUser, 'approved', walletAddress.trim());
      toast.success('Retailer approved!');
      loadPendingUsers();
      setApprovingUser(null);
      setWalletAddress('');
    }
  };

  const handleReject = (email: string) => {
    mockAuth.updateUserStatus(email, 'rejected');
    toast.success('Retailer rejected!');
    loadPendingUsers();
  };

  const handleCreateRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const result = await mockAuth.adminCreateUser(
      newRetailer.email,
      newRetailer.password,
      newRetailer.name,
      'retailer',
      newRetailer.address || undefined
    );
    
    setIsAdding(false);
    if (result.success) {
      toast.success('Retailer added successfully!');
      setShowAddRetailer(false);
      setNewRetailer({ name: '', email: '', password: '', address: '' });
    } else {
      toast.error(result.error || 'Failed to add retailer');
    }
  };

  const loadMedicines = () => {
    if (user) {
      const userMedicines = mockBlockchain.getMedicinesByOwner(user.address);
      setMedicines(userMedicines);
    }
  };

  const handleVerify = async () => {
    if (!verifySerial.trim()) return;

    setLoading(true);
    const medicine = await mockBlockchain.verifyMedicine(verifySerial.trim());
    
    if (medicine) {
      setVerifiedMedicine(medicine);
      toast.success('Medicine verified successfully');
    } else {
      setVerifiedMedicine(null);
      toast.error('Medicine not found - Possible counterfeit!');
    }

    setLoading(false);
  };

  const handleTransfer = async () => {
    if (!selectedMedicine || !user || !retailerAddress.trim()) return;

    setLoading(true);

    try {
      const result = await mockBlockchain.transferToRetailer(
        selectedMedicine.serialNumber,
        retailerAddress.trim(),
        user.address
      );

      if (result.success) {
        toast.success('Medicine transferred to retailer');
        setShowTransferDialog(false);
        setRetailerAddress('');
        setSelectedMedicine(null);
        loadMedicines();
      } else {
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }

    setLoading(false);
  };

  const openTransferDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowTransferDialog(true);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-[1400px]">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Distributor Dashboard</h1>
          <p className="text-gray-600">Manage distribution inventory and transfer to retailers</p>
        </div>
        <Dialog open={showAddRetailer} onOpenChange={setShowAddRetailer}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Add Retailer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Retailer</DialogTitle>
              <DialogDescription>
                Manually add a pre-approved retailer to your network.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRetailer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="retName">Organization Name</Label>
                <Input 
                  id="retName" 
                  value={newRetailer.name}
                  onChange={e => setNewRetailer({...newRetailer, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retEmail">Email Address</Label>
                <Input 
                  id="retEmail" 
                  type="email" 
                  value={newRetailer.email}
                  onChange={e => setNewRetailer({...newRetailer, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retPassword">Password</Label>
                <Input 
                  id="retPassword" 
                  type="password" 
                  value={newRetailer.password}
                  onChange={e => setNewRetailer({...newRetailer, password: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retAddress">Wallet Address (Optional)</Label>
                <Input 
                  id="retAddress" 
                  value={newRetailer.address}
                  onChange={e => setNewRetailer({...newRetailer, address: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Retailer...
                  </>
                ) : (
                  'Add Retailer'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Managed</CardDescription>
            <CardTitle className="text-3xl">{medicines.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Transit</CardDescription>
            <CardTitle className="text-3xl">
              {medicines.filter(m => !m.sold && m.currentOwner === user?.address).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="verify">
            <Search className="w-4 h-4 mr-2" />
            Verify Medicine
          </TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Retailers
            {pendingRetailers.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0">
                {pendingRetailers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Distribution Inventory</CardTitle>
              <CardDescription>Medicines currently in your possession</CardDescription>
            </CardHeader>
            <CardContent>
              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No medicines in inventory</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.map((medicine) => (
                        <TableRow key={medicine.id}>
                          <TableCell className="font-mono text-sm">{medicine.serialNumber}</TableCell>
                          <TableCell>{medicine.name}</TableCell>
                          <TableCell>{medicine.brand}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {medicine.manufacturer.substring(0, 12)}...
                          </TableCell>
                          <TableCell>
                            {!medicine.sold ? (
                              <Badge>In Distribution</Badge>
                            ) : (
                              <Badge variant="secondary">Delivered</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!medicine.sold && (
                              <Button 
                                size="sm"
                                onClick={() => openTransferDialog(medicine)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Transfer to Retailer
                              </Button>
                            )}
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

        {/* Verify Tab */}
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify Medicine</CardTitle>
              <CardDescription>
                Enter serial number from QR code to verify authenticity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="verifySerial">Serial Number</Label>
                    <Input
                      id="verifySerial"
                      placeholder="Enter serial number"
                      value={verifySerial}
                      onChange={(e) => setVerifySerial(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleVerify} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {verifiedMedicine && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-green-900">Medicine Verified ✓</CardTitle>
                          <CardDescription className="text-green-700">
                            This medicine is authentic
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-600">Authentic</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-green-900">
                      <p><strong>Name:</strong> {verifiedMedicine.name}</p>
                      <p><strong>Brand:</strong> {verifiedMedicine.brand}</p>
                      <p><strong>Serial Number:</strong> {verifiedMedicine.serialNumber}</p>
                      <p><strong>Manufacturer:</strong> {verifiedMedicine.manufacturer}</p>
                      <p><strong>Current Owner:</strong> {verifiedMedicine.currentOwner}</p>
                      <p><strong>Status:</strong> {verifiedMedicine.sold ? 'Sold' : 'In Distribution'}</p>
                      <div className="pt-2 border-t border-green-200">
                        <p className="font-semibold mb-2">Supply Chain History:</p>
                        <div className="space-y-1">
                          {verifiedMedicine.history.map((event, idx) => (
                            <div key={idx} className="text-xs">
                              <p>
                                {event.eventType === 'registered' && '📦 Registered by Manufacturer'}
                                {event.eventType === 'transferred_to_distributor' && '🚚 Transferred to Distributor'}
                                {event.eventType === 'transferred_to_retailer' && '🏪 Transferred to Retailer'}
                                {event.eventType === 'sold' && '✅ Sold to Customer'}
                              </p>
                              <p className="text-green-700">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {verifySerial && !verifiedMedicine && !loading && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-900">⚠ Counterfeit Detected</CardTitle>
                      <CardDescription className="text-red-700">
                        This medicine could not be verified on the blockchain
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-red-900">
                      <p>This serial number does not exist in our system. This product may be counterfeit.</p>
                      <p className="mt-2">Please report it to authorities.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Retailer Approvals</CardTitle>
              <CardDescription>Review and approve new retailer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRetailers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending retailer requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRetailers.map((ret) => (
                        <TableRow key={ret.uid}>
                          <TableCell className="font-semibold">{ret.name}</TableCell>
                          <TableCell>{ret.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(ret.email)}
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setApprovingUser(ret.email)}
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
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer to Retailer</DialogTitle>
            <DialogDescription>
              Transfer medicine inventory to a retailer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Medicine:</strong> {selectedMedicine?.name}</p>
              <p className="text-sm"><strong>Brand:</strong> {selectedMedicine?.brand}</p>
              <p className="text-sm"><strong>Serial:</strong> {selectedMedicine?.serialNumber}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retailerAddress">Retailer Wallet Address</Label>
              <Input
                id="retailerAddress"
                placeholder="0x..."
                value={retailerAddress}
                onChange={(e) => setRetailerAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter the retailer's blockchain wallet address
              </p>
            </div>
            <Button onClick={handleTransfer} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={(open) => !open && setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Retailer</DialogTitle>
            <DialogDescription>
              Assign a wallet address to the new retailer.
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
