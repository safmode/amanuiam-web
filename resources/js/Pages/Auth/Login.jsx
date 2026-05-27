//login page for officers, with form submission to Laravel backend and error handling

import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';  // ADD THIS FOR CSRF REFRESH
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';

// Helper function to get pending officers from sessionStorage
const getPendingOfficers = () => {
  const stored = sessionStorage.getItem('pending_officers');
  return stored ? JSON.parse(stored) : [];
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        // Alternative: Fetch a fresh page to get new CSRF token
        await axios.get('/');

        await router.post('/login', {
        email,
        password,
        }, {
        onError: (errors) => {
            setError(errors.email || 'Invalid email or password');
        },
        onFinish: () => {
            setIsLoading(false);
        }
        });
    } catch (err) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-20 h-20">
            <img
              src="/images/OSeM.png"
              alt="IIUM Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">Aman@UIAM Dashboard</h1>
          <p className="text-sm text-muted-foreground">Security Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border border-border shadow-lg bg-white rounded-3xl">
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="text-xl font-semibold text-center mb-6">Officer Login</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className={`flex items-center gap-2 p-3 text-sm rounded-xl ${
                  isPendingApproval
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-red-600 bg-red-50'
                }`}>
                  {isPendingApproval ? <Clock className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@osem.iium.edu.my"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-12 bg-white border-border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 pr-12 h-12 bg-white border-border rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#D4A853] hover:bg-[#C49A48] text-white font-medium rounded-md text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Register for system access (requires admin approval){' '}
            <a href="/register" className="text-[#D4A853] hover:underline font-medium whitespace-nowrap">
              Request Access
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Note: Only certain officers can have access to this system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
