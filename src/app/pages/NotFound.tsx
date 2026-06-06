import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <AlertCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h1 className="text-6xl mb-4 text-gray-900">404</h1>
        <h2 className="text-2xl mb-4 text-gray-700">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
