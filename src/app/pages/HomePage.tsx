import { Link, useNavigate } from 'react-router';
import { mockAuth } from '../services/mockAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Package, Store, Users, CheckCircle, QrCode, Lock, Truck } from 'lucide-react';
import { useEffect } from 'react';

export function HomePage() {
  const user = mockAuth.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to respective dashboard if already logged in
    if (user) {
      switch (user.role) {
        case 'manufacturer':
          navigate('/manufacturer');
          break;
        case 'retailer':
          navigate('/retailer');
          break;
        case 'distributor':
          navigate('/distributor');
          break;
        case 'admin':
          navigate('/admin');
          break;
      }
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl mb-4 text-gray-900">
          Medicine Supply Chain Verification
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Combat counterfeit medicines with blockchain-powered authentication.
          Track, verify, and ensure the authenticity of pharmaceutical products.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/verify">
            <Button size="lg">
              <QrCode className="mr-2 w-5 h-5" />
              Verify Medicine
            </Button>
          </Link>
          {!user && (
            <Link to="/register">
              <Button size="lg" variant="outline">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader>
            <Lock className="w-12 h-12 text-blue-600 mb-4" />
            <CardTitle>Blockchain Security</CardTitle>
            <CardDescription>
              Immutable records ensure medicine authenticity and prevent tampering
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <QrCode className="w-12 h-12 text-green-600 mb-4" />
            <CardTitle>QR Code Verification</CardTitle>
            <CardDescription>
              Instant verification through scanning unique QR codes on packaging
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CheckCircle className="w-12 h-12 text-purple-600 mb-4" />
            <CardTitle>Full Traceability</CardTitle>
            <CardDescription>
              Track the complete journey from manufacturer to consumer
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* User Roles Section */}
      <div className="mb-16">
        <h2 className="text-3xl text-center mb-8 text-gray-900">
          System Users
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Package className="w-10 h-10 text-blue-600 mb-3" />
              <CardTitle>Manufacturer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Register new medicines</li>
                <li>• Generate QR codes</li>
                <li>• Track product distribution</li>
                <li>• View production history</li>
              </ul>
              {!user && (
                <Link to="/register" state={{ role: 'manufacturer' }}>
                  <Button className="w-full mt-4" variant="outline">
                    Register as Manufacturer
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Truck className="w-10 h-10 text-orange-600 mb-3" />
              <CardTitle>Distributor</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Receive from manufacturers</li>
                <li>• Manage distribution inventory</li>
                <li>• Transfer to retailers</li>
                <li>• Track shipments</li>
              </ul>
              {!user && (
                <Link to="/register" state={{ role: 'distributor' }}>
                  <Button className="w-full mt-4" variant="outline">
                    Register as Distributor
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Store className="w-10 h-10 text-green-600 mb-3" />
              <CardTitle>Retailer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Receive medicines</li>
                <li>• Verify authenticity</li>
                <li>• Transfer to customers</li>
                <li>• View inventory</li>
              </ul>
              {!user && (
                <Link to="/register" state={{ role: 'retailer' }}>
                  <Button className="w-full mt-4" variant="outline">
                    Register as Retailer
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-3xl text-center mb-8 text-gray-900">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Register</h3>
            <p className="text-sm text-gray-600">
              Manufacturer registers medicine on blockchain
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">QR Generation</h3>
            <p className="text-sm text-gray-600">
              Unique QR code is generated for each product
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Distribution</h3>
            <p className="text-sm text-gray-600">
              Product moves through supply chain with tracking
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Verification</h3>
            <p className="text-sm text-gray-600">
              Consumer scans and verifies authenticity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
