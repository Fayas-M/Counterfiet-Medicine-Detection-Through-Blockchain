import { Outlet, Link, useNavigate } from 'react-router';
import { mockAuth } from '../../services/mockAuth';
import { Button } from '../ui/button';
import { LogOut, Shield, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function RootLayout() {
  const user = mockAuth.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await mockAuth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 max-w-[1400px]">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-xl text-gray-900">MediChain</h1>
                <p className="text-xs text-gray-500">Medicine Supply Chain Verification</p>
              </div>
            </Link>

            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="text-right mr-4">
                    <p className="font-medium text-sm text-gray-900">{user.name}</p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      <span className="text-xs text-gray-300">•</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(user.address);
                          toast.success('Address copied to clipboard!');
                        }}
                        className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        title="Copy Wallet Address"
                      >
                        {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-6 py-8 max-w-[1400px]">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 MediChain - Medicine Supply Chain Anti-Counterfeiting System</p>
            <p className="mt-2">Powered by Blockchain Technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
