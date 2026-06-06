import { useState, useEffect } from 'react';
import { mockAuth, User } from '../services/mockAuth';
import { mockBlockchain, Medicine, Report } from '../services/mockBlockchain';
import { qrCodeService } from '../services/qrCodeService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Package, Plus, QrCode, Download, Loader2, CheckCircle, Send, Check, X, Users, UserPlus, Edit, Trash2, Flag } from 'lucide-react';
import { toast } from 'sonner';

export function ManufacturerDashboard() {
  const user = mockAuth.getCurrentUser();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingDistributors, setPendingDistributors] = useState<User[]>([]);
  const [showAddDistributor, setShowAddDistributor] = useState(false);
  const [newDistributor, setNewDistributor] = useState({ name: '', email: '', password: '', address: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [distributorAddress, setDistributorAddress] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    serialNumber: '',
    price: ''
  });
  
  // Edit and Delete states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [medicineToEdit, setMedicineToEdit] = useState<Medicine | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    brand: '',
    price: ''
  });
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadMedicines();
    loadReports();
    loadPendingUsers();
  }, [user]);

  const loadReports = () => {
    if (user) {
      setReports(mockBlockchain.getReportsByManufacturer(user.address));
    }
  };

  const loadPendingUsers = () => {
    setPendingDistributors(mockAuth.getPendingUsers('distributor'));
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (approvingUser && walletAddress.trim()) {
      mockAuth.updateUserStatus(approvingUser, 'approved', walletAddress.trim());
      toast.success('Distributor approved!');
      loadPendingUsers();
      setApprovingUser(null);
      setWalletAddress('');
    }
  };

  const handleReject = (email: string) => {
    mockAuth.updateUserStatus(email, 'rejected');
    toast.success('Distributor rejected!');
    loadPendingUsers();
  };

  const handleCreateDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const result = await mockAuth.adminCreateUser(
      newDistributor.email,
      newDistributor.password,
      newDistributor.name,
      'distributor',
      newDistributor.address || undefined
    );
    
    setIsAdding(false);
    if (result.success) {
      toast.success('Distributor added successfully!');
      setShowAddDistributor(false);
      setNewDistributor({ name: '', email: '', password: '', address: '' });
    } else {
      toast.error(result.error || 'Failed to add distributor');
    }
  };

  const loadMedicines = () => {
    if (user) {
      const userMedicines = mockBlockchain.getMedicinesByManufacturer(user.address);
      setMedicines(userMedicines);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const result = await mockBlockchain.registerMedicine(
        formData.name,
        formData.brand,
        formData.serialNumber,
        parseFloat(formData.price),
        user.address
      );

      if (result.success && result.medicine) {
        toast.success('Medicine registered successfully on blockchain');
        
        // Generate QR code
        const qrData = {
          serialNumber: result.medicine.serialNumber,
          transactionHash: result.txHash,
          timestamp: result.medicine.timestamp
        };
        const qrUrl = await qrCodeService.generateQRCode(qrData);
        
        setSelectedMedicine(result.medicine);
        setQrCodeUrl(qrUrl);
        setShowRegisterDialog(false);
        setShowQRDialog(true);
        
        // Reset form
        setFormData({ name: '', brand: '', serialNumber: '', price: '' });
        
        // Reload medicines
        loadMedicines();
      } else {
        toast.error(result.error || 'Failed to register medicine');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }

    setLoading(false);
  };

  const handleViewQR = async (medicine: Medicine) => {
    const qrData = {
      serialNumber: medicine.serialNumber,
      transactionHash: medicine.transactionHash,
      timestamp: medicine.timestamp
    };
    const qrUrl = await qrCodeService.generateQRCode(qrData);
    setSelectedMedicine(medicine);
    setQrCodeUrl(qrUrl);
    setShowQRDialog(true);
  };

  const handleDownloadQR = () => {
    if (selectedMedicine && qrCodeUrl) {
      qrCodeService.downloadQRCode(
        qrCodeUrl,
        `medicine-qr-${selectedMedicine.serialNumber}.png`
      );
      toast.success('QR code downloaded');
    }
  };

  const handleTransfer = async () => {
    if (!selectedMedicine || !user || !distributorAddress.trim()) return;

    setLoading(true);

    try {
      const result = await mockBlockchain.transferToDistributor(
        selectedMedicine.serialNumber,
        distributorAddress.trim(),
        user.address
      );

      if (result.success) {
        toast.success('Medicine transferred to distributor');
        setShowTransferDialog(false);
        setDistributorAddress('');
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

  const handleEditClick = (medicine: Medicine) => {
    setMedicineToEdit(medicine);
    setEditFormData({
      name: medicine.name,
      brand: medicine.brand,
      price: medicine.price.toString()
    });
    setShowEditDialog(true);
  };

  const handleUpdateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineToEdit || !user) return;

    setLoading(true);
    try {
      const result = await mockBlockchain.updateMedicine(
        medicineToEdit.serialNumber,
        editFormData.name,
        editFormData.brand,
        parseFloat(editFormData.price),
        user.address
      );

      if (result.success) {
        toast.success('Medicine updated successfully');
        setShowEditDialog(false);
        setMedicineToEdit(null);
        loadMedicines();
      } else {
        toast.error(result.error || 'Failed to update medicine');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
    setLoading(false);
  };

  const handleDeleteClick = (medicine: Medicine) => {
    setMedicineToDelete(medicine);
    setShowDeleteDialog(true);
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete || !user) return;

    setLoading(true);
    try {
      const result = await mockBlockchain.deleteMedicine(
        medicineToDelete.serialNumber,
        user.address
      );

      if (result.success) {
        toast.success('Medicine deleted successfully');
        setShowDeleteDialog(false);
        setMedicineToDelete(null);
        loadMedicines();
      } else {
        toast.error(result.error || 'Failed to delete medicine');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-gray-900">Manufacturer Dashboard</h1>
        <p className="text-gray-600">Register and manage your medicines</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Medicines</CardDescription>
            <CardTitle className="text-3xl">{medicines.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Distribution</CardDescription>
            <CardTitle className="text-3xl">
              {medicines.filter(m => !m.sold && m.currentOwner !== user?.address).length}
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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Stock</CardDescription>
            <CardTitle className="text-3xl">
              {medicines.filter(m => m.currentOwner === user?.address && !m.sold).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <Button onClick={() => setShowRegisterDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Register New Medicine
        </Button>

        <Dialog open={showAddDistributor} onOpenChange={setShowAddDistributor}>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-white">
              <UserPlus className="w-4 h-4 mr-2" /> Add Distributor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Distributor</DialogTitle>
              <DialogDescription>
                Manually add a pre-approved distributor to your network.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDistributor} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="distName">Organization Name</Label>
                <Input 
                  id="distName" 
                  value={newDistributor.name}
                  onChange={e => setNewDistributor({...newDistributor, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distEmail">Email Address</Label>
                <Input 
                  id="distEmail" 
                  type="email" 
                  value={newDistributor.email}
                  onChange={e => setNewDistributor({...newDistributor, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distPassword">Password</Label>
                <Input 
                  id="distPassword" 
                  type="password" 
                  value={newDistributor.password}
                  onChange={e => setNewDistributor({...newDistributor, password: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distAddress">Wallet Address (Optional)</Label>
                <Input 
                  id="distAddress" 
                  value={newDistributor.address}
                  onChange={e => setNewDistributor({...newDistributor, address: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Distributor...
                  </>
                ) : (
                  'Add Distributor'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Distributor Approvals */}
      {pendingDistributors.length > 0 && (
        <Card className="mb-8 border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-orange-900">Distributor Approvals Needed</CardTitle>
                <CardDescription className="text-orange-700">Review and approve new distributor registrations</CardDescription>
              </div>
              <Badge variant="destructive">{pendingDistributors.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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
                  {pendingDistributors.map((dist) => (
                    <TableRow key={dist.uid}>
                      <TableCell className="font-semibold text-orange-900">{dist.name}</TableCell>
                      <TableCell>{dist.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleReject(dist.email)}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setApprovingUser(dist.email)}
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
          </CardContent>
        </Card>
      )}

      {/* Suspicious Reports */}
      {reports.length > 0 && (
        <Card className="mb-8 border-red-200">
          <CardHeader className="bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-900 flex items-center">
                  <Flag className="w-5 h-5 mr-2" />
                  Suspicious Activity Reports
                </CardTitle>
                <CardDescription className="text-red-700">Consumer reports regarding potential counterfeits of your medicines</CardDescription>
              </div>
              <Badge variant="destructive">{reports.length} Reports</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(report.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-red-600">{report.serialNumber}</TableCell>
                      <TableCell className="font-semibold">{report.medicineName}</TableCell>
                      <TableCell className="max-w-md truncate">{report.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Medicines</CardTitle>
          <CardDescription>All medicines registered by your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {medicines.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No medicines registered yet</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setShowRegisterDialog(true)}
              >
                Register Your First Medicine
              </Button>
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
                      <TableCell>
                        {medicine.sold ? (
                          <Badge variant="secondary">Sold</Badge>
                        ) : medicine.currentOwner === user?.address ? (
                          <Badge>In Stock</Badge>
                        ) : (
                          <Badge variant="outline">In Distribution</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewQR(medicine)}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            QR
                          </Button>
                          {!medicine.sold && medicine.currentOwner === user?.address && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => openTransferDialog(medicine)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Transfer
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(medicine)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(medicine)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
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

      {/* Register Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Medicine</DialogTitle>
            <DialogDescription>
              Add a new medicine to the blockchain
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                placeholder="e.g., Paracetamol"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="e.g., Tylenol"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                placeholder="e.g., MED-2026-001"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering on Blockchain...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Register Medicine
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medicine QR Code</DialogTitle>
            <DialogDescription>
              {selectedMedicine?.name} - {selectedMedicine?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Serial Number:</strong> {selectedMedicine?.serialNumber}</p>
              <p><strong>Transaction Hash:</strong> {selectedMedicine?.transactionHash.substring(0, 20)}...</p>
            </div>
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer to Distributor</DialogTitle>
            <DialogDescription>
              Transfer medicine to a distributor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Medicine:</strong> {selectedMedicine?.name}</p>
              <p className="text-sm"><strong>Brand:</strong> {selectedMedicine?.brand}</p>
              <p className="text-sm"><strong>Serial:</strong> {selectedMedicine?.serialNumber}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="distributorAddress">Distributor Wallet Address</Label>
              <Input
                id="distributorAddress"
                placeholder="0x..."
                value={distributorAddress}
                onChange={(e) => setDistributorAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter the distributor's blockchain wallet address
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medicine Details</DialogTitle>
            <DialogDescription>
              Update information for {medicineToEdit?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMedicine} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Medicine Name</Label>
              <Input
                id="editName"
                placeholder="e.g., Paracetamol"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBrand">Brand</Label>
              <Input
                id="editBrand"
                placeholder="e.g., Tylenol"
                value={editFormData.brand}
                onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPrice">Price (INR)</Label>
              <Input
                id="editPrice"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Medicine...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Medicine
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
            <DialogDescription className="text-red-600 font-medium">
              Warning: This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the medicine <strong>{medicineToDelete?.name}</strong> (Serial: {medicineToDelete?.serialNumber})?
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleDeleteMedicine}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Confirm Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={(open) => !open && setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Distributor</DialogTitle>
            <DialogDescription>
              Assign a wallet address to the new distributor.
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
