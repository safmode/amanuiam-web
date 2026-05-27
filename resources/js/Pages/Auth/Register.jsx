import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Phone, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    rank: '',
    department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── handleRegister ────────────────────────────────────────
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.rank || !formData.department) {
      setError('Please select your rank and department');
      return;
    }

    setIsLoading(true);

    router.post('/register', {
      name:                  formData.name,
      email:                 formData.email,
      phone:                 formData.phone,
      password:              formData.password,
      password_confirmation: formData.confirmPassword,
      rank:                  formData.rank,
      department:            formData.department,
    }, {
      onSuccess: () => {
        setSuccess('Registration submitted! Please wait for admin approval.');
      },
      onError: (errors) => {
        setError(
          errors.email      ||
          errors.password   ||
          errors.name       ||
          errors.rank       ||
          errors.department ||
          'Registration failed. Please try again.'
        );
      },
      onFinish: () => setIsLoading(false),
    });
  };
  // ── end handleRegister ────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-7">

        {/* Logo and Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-16 h-16">
            <img src="/images/OSeM.png" alt="IIUM Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Aman@UIAM Dashboard</h1>
          <p className="text-sm text-muted-foreground">Security Management System</p>
        </div>

        {/* Registration Card */}
        <Card className="border border-border shadow-lg bg-white rounded-3xl">
          <CardContent className="pt-6 pb-6 px-10">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Request System Access</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in your details to register. An admin will review your request.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-2 text-xs text-red-600 bg-red-50 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-2 text-xs text-green-600 bg-green-50 rounded-xl">
                  ✅ {success}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter officer name.."
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="pl-10 h-10 bg-white border-border rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Rank & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Rank</Label>
                  <Select value={formData.rank} onValueChange={(v) => handleChange('rank', v)}>
                    <SelectTrigger className="h-10 bg-white border-border rounded-xl text-sm">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Senior Security Officer">Senior Officer</SelectItem>
                      <SelectItem value="Security Officer">Security Officer</SelectItem>
                      <SelectItem value="Junior Officer">Junior Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Department</Label>
                  <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
                    <SelectTrigger className="h-10 bg-white border-border rounded-xl text-sm">
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="URB Unit">URB Unit</SelectItem>
                      <SelectItem value="Patrol Unit">Patrol Unit</SelectItem>
                      <SelectItem value="Operations Room">Ops Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+60..."
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required
                      className="pl-10 h-10 bg-white border-border rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email.."
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      className="pl-10 h-10 bg-white border-border rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    className="pl-10 pr-10 h-10 bg-white border-border rounded-xl text-sm"
                  />
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                      : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    className="pl-10 pr-10 h-10 bg-white border-border rounded-xl text-sm"
                  />
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword
                      ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                      : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 bg-[#D4A853] hover:bg-[#C49A48] text-white font-medium rounded-xl text-sm mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <a href="/" className="text-[#D4A853] hover:underline font-medium">
              Login here
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
