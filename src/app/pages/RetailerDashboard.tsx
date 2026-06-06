import { useState, useEffect } from 'react';
import { mockAuth } from '../services/mockAuth';
import { mockBlockchain, Medicine } from '../services/mockBlockchain';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Store, Search, Send, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function RetailerDashboard() {
  const user = mockAuth.getCurrentUser();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [verifySerial, setVerifySerial] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState<Medicine | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

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
    if (!selectedMedicine || !user || !customerAddress.trim()) return;

    setLoading(true);

    try {
      const result = await mockBlockchain.sellToCustomer(
        selectedMedicine.serialNumber,
        customerAddress.trim(),
        user.address
      );

      if (result.success) {
        toast.success('Medicine transferred to customer');
        setShowTransferDialog(false);
        setCustomerAddress('');
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
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-gray-900">Retailer Dashboard</h1>
        <p className="text-gray-600">Manage inventory and verify medicines</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Inventory</CardDescription>
            <CardTitle className="text-3xl">{medicines.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available for Sale</CardDescription>
            <CardTitle className="text-3xl">
              {medicines.filter(m => !m.sold).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sold to Customers</CardDescription>
            <CardTitle className="text-3xl">
              {medicines.filter(m => m.sold).length}
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
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Inventory</CardTitle>
              <CardDescription>Medicines in your possession</CardDescription>
            </CardHeader>
            <CardContent>
              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                        <TableHead>Price</TableHead>
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
                          <TableCell>₹{medicine.price}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {medicine.manufacturer.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {medicine.sold ? (
                              <Badge variant="secondary">Sold</Badge>
                            ) : (
                              <Badge>Available</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!medicine.sold && (
                              <Button 
                                size="sm"
                                onClick={() => openTransferDialog(medicine)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Sell
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
                      <p><strong>Price:</strong> ₹{verifiedMedicine.price}</p>
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
                      <p className="mt-2">Please do not sell this product and report it to authorities.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell to Customer</DialogTitle>
            <DialogDescription>
              Transfer medicine to customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Medicine:</strong> {selectedMedicine?.name}</p>
              <p className="text-sm"><strong>Brand:</strong> {selectedMedicine?.brand}</p>
              <p className="text-sm"><strong>Serial:</strong> {selectedMedicine?.serialNumber}</p>
              <p className="text-sm"><strong>Price:</strong> ₹{selectedMedicine?.price}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Customer Wallet Address</Label>
              <Input
                id="customerAddress"
                placeholder="0x..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter the customer's blockchain wallet address
              </p>
            </div>
            <Button onClick={handleTransfer} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                'Confirm Sale'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
