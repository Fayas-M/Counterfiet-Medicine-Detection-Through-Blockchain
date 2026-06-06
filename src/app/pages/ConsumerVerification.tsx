import { useState, useRef, useEffect } from 'react';
import { mockBlockchain, Medicine } from '../services/mockBlockchain';
import { qrCodeService } from '../services/qrCodeService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { QrCode, Search, Loader2, AlertTriangle, CheckCircle, Camera, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

export function ConsumerVerification() {
  const [serialNumber, setSerialNumber] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [wasAlreadySold, setWasAlreadySold] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reporting, setReporting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Stop camera when navigating away from the verification page
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => scannerRef.current?.clear())
          .catch(err => console.error("Failed to stop scanner on unmount:", err));
      }
    };
  }, []);

  const handleVerify = async (serial?: string) => {
    const searchSerial = serial || serialNumber.trim();
    if (!searchSerial) {
      toast.error('Please enter a serial number');
      return;
    }

    setLoading(true);
    setHasError(false);

    let medicine = await mockBlockchain.verifyMedicine(searchSerial);

    if (medicine) {
      const alreadySold = medicine.sold;
      setWasAlreadySold(alreadySold);

      // If authentic but not sold yet, mark it as sold automatically upon consumer verification
      if (!medicine.sold) {
        await mockBlockchain.consumeMedicine(searchSerial);
        // Reload to get updated history
        medicine = await mockBlockchain.verifyMedicine(searchSerial);
      }

      setVerifiedMedicine(medicine);

      if (alreadySold) {
        toast.warning('Warning: This medicine was ALREADY marked as sold. If this is your first time scanning, it may be counterfeit.', { duration: 6000 });
      } else {
        toast.success('Medicine verified authentic and registered to you as the consumer!');
      }
    } else {
      setVerifiedMedicine(null);
      setHasError(true);
      toast.error('Medicine not found - Possible counterfeit!');
    }

    setLoading(false);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedMedicine) return;

    setReporting(true);
    const result = await mockBlockchain.reportMedicine(verifiedMedicine.serialNumber, reportMessage);
    
    if (result.success) {
      toast.success('Report submitted successfully! Admin and Manufacturer have been notified.');
      setShowReportDialog(false);
      setReportMessage('');
    } else {
      toast.error('Failed to submit report');
    }
    setReporting(false);
  };

  const startScanning = () => {
    setScanning(true);

    // Wait for the DOM to render the #qr-reader element
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 700, height: 700 }
          },
          (decodedText) => {
            // Parse QR code data
            const qrData = qrCodeService.parseQRData(decodedText);
            if (qrData) {
              setSerialNumber(qrData.serialNumber);
              handleVerify(qrData.serialNumber);
              stopScanning();
            } else {
              toast.error('Invalid QR code format');
            }
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        toast.error('Failed to start camera. Please ensure camera permissions are granted.');
        setScanning(false);
      }
    }, 100);
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-[1400px]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2 text-gray-900">Verify Medicine Authenticity</h1>
          <p className="text-gray-600">Scan QR code or enter serial number to verify</p>
        </div>

        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Search className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Scan QR Code
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Enter Serial Number</CardTitle>
                <CardDescription>
                  Type the serial number found on the medicine packaging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="serial">Serial Number</Label>
                      <Input
                        id="serial"
                        placeholder="Enter serial number (e.g., MED-2026-001)"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => handleVerify()} disabled={loading}>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scan QR Code Tab */}
          <TabsContent value="scan">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Use your device camera to scan the QR code on the medicine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!scanning ? (
                    <div className="text-center py-12">
                      <QrCode className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                      <Button onClick={startScanning} size="lg">
                        <Camera className="mr-2 h-5 w-5" />
                        Start Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div id="qr-reader" className="w-full"></div>
                      <Button onClick={stopScanning} variant="outline" className="w-full">
                        Stop Scanning
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Verification Results */}
        {verifiedMedicine && !hasError && (
          <Card className="border-green-200 bg-green-50 mt-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-green-900">Authentic Medicine ✓</CardTitle>
                  </div>
                  <CardDescription className="text-green-700">
                    This medicine has been verified on the blockchain
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-600">Verified</Badge>
                  {wasAlreadySold && (
                    <Button variant="destructive" size="sm" onClick={() => setShowReportDialog(true)}>
                      <Flag className="w-4 h-4 mr-1" />
                      Report Suspicious
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-green-900">
              {/* Medicine Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-green-700">Medicine Name</p>
                    <p className="font-semibold text-lg">{verifiedMedicine.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Brand</p>
                    <p className="font-semibold">{verifiedMedicine.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Serial Number</p>
                    <p className="font-mono text-sm">{verifiedMedicine.serialNumber}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-green-700">Price</p>
                    <p className="font-semibold text-lg">₹{verifiedMedicine.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Manufacturer</p>
                    <p className="font-mono text-xs break-all">{verifiedMedicine.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Status</p>
                    <Badge variant="outline" className="border-green-600 text-green-900">
                      {verifiedMedicine.sold ? 'Sold to Consumer' : 'In Distribution'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Supply Chain History */}
              <div className="pt-4 border-t border-green-200">
                <h4 className="font-semibold mb-3">Supply Chain Journey</h4>
                <div className="space-y-3">
                  {verifiedMedicine.history.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        {idx < verifiedMedicine.history.length - 1 && (
                          <div className="w-0.5 h-full bg-green-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="font-semibold text-sm">
                            {event.eventType === 'registered' && '📦 Manufactured & Registered'}
                            {event.eventType === 'transferred_to_distributor' && '🚚 Transferred to Distributor'}
                            {event.eventType === 'transferred_to_retailer' && '🏪 Transferred to Retailer'}
                            {event.eventType === 'sold' && '✅ Sold to Consumer'}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-green-700 font-mono mt-1">
                            Transaction: {event.transactionHash.substring(0, 20)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="pt-4 border-t border-green-200">
                <h4 className="font-semibold mb-2">Blockchain Verification</h4>
                <div className="text-xs space-y-1 bg-white rounded p-3 border border-green-200">
                  <p><strong>Transaction Hash:</strong></p>
                  <p className="font-mono break-all">{verifiedMedicine.transactionHash}</p>
                  <p className="mt-2"><strong>Registered:</strong> {new Date(verifiedMedicine.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Counterfeit Warning */}
        {hasError && !verifiedMedicine && (
          <Card className="border-red-200 bg-red-50 mt-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
                <div>
                  <CardTitle className="text-red-900 text-xl">⚠ Warning: Counterfeit Detected</CardTitle>
                  <CardDescription className="text-red-700 mt-2">
                    This medicine could not be verified on the blockchain
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-red-900 space-y-4">
              <div className="bg-white border border-red-200 rounded-lg p-4">
                <p className="font-semibold mb-2">Serial Number Not Found:</p>
                <p className="font-mono text-sm">{serialNumber}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold">This product may be counterfeit because:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>The serial number does not exist in our blockchain system</li>
                  <li>The medicine was never registered by an authorized manufacturer</li>
                  <li>The QR code may be fake or copied</li>
                </ul>
              </div>

              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <p className="font-semibold mb-2">⚠ Safety Warning:</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                  <li>Do NOT consume this medicine</li>
                  <li>Report this to the pharmacy or retailer immediately</li>
                  <li>Contact local health authorities</li>
                  <li>Keep the packaging as evidence</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        {!verifiedMedicine && !hasError && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Verify</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-900 space-y-2">
              <p>To verify your medicine:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Locate the QR code on the medicine packaging</li>
                <li>Use the "Scan QR Code" tab to scan it with your camera, or</li>
                <li>Manually enter the serial number shown on the packaging</li>
                <li>Click "Verify" to check authenticity on the blockchain</li>
              </ol>
              <p className="mt-3 font-semibold">
                ✓ Verified medicines will show their complete supply chain history
              </p>
            </CardContent>
          </Card>
        )}

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Suspicious Medicine</DialogTitle>
              <DialogDescription>
                If this medicine was already sold before you scanned it, it might be a counterfeit. Please provide details to notify the manufacturer and admin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReport} className="space-y-4">
              <div className="space-y-2">
                <Label>Medicine Serial Number</Label>
                <div className="font-mono text-sm p-2 bg-gray-100 rounded">{verifiedMedicine?.serialNumber}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportMessage">Additional Details</Label>
                <Textarea
                  id="reportMessage"
                  placeholder="Where did you purchase this? Please provide any other context..."
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" variant="destructive" className="w-full" disabled={reporting}>
                {reporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
