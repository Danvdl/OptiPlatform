import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';

const REGISTER_BUSINESS = gql`
  mutation RegisterBusiness($input: RegisterTenantInput!) {
    registerBusiness(input: $input) {
      accessToken
      tenant {
        id
        name
        slug
        plan
        status
        trialEndsAt
      }
      user {
        id
        username
        email
        firstName
        lastName
      }
      message
    }
  }
`;

interface BusinessRegistrationFormProps {
  onSuccess?: () => void;
}

export const BusinessRegistrationForm: React.FC<BusinessRegistrationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Owner Information
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    
    // Business Information
    businessName: '',
    legalName: '',
    taxId: '',
    industry: '',
    companySize: '',
    website: '',
    phoneNumber: '',
    
    // Address
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    
    // Settings
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registerBusiness, { loading }] = useMutation(REGISTER_BUSINESS);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName || formData.businessName.length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const { data } = await registerBusiness({
        variables: {
          input: {
            ...submitData,
            industry: submitData.industry || null,
            companySize: submitData.companySize || null,
            website: submitData.website || null,
            phoneNumber: submitData.phoneNumber || null,
            taxId: submitData.taxId || null,
            legalName: submitData.legalName || null,
            addressLine1: submitData.addressLine1 || null,
            city: submitData.city || null,
            state: submitData.state || null,
            postalCode: submitData.postalCode || null,
          }
        }
      });

      // Store token
      localStorage.setItem('auth_token', data.registerBusiness.accessToken);

      // Show success message
      alert(data.registerBusiness.message);

      // Redirect to onboarding or dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Start Your Free Trial</h2>
        <p className="mt-2 text-gray-600">14 days free, no credit card required</p>
        
        {/* Progress Indicator */}
        <div className="mt-6 flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          {step === 1 && 'Step 1: Your Account'}
          {step === 2 && 'Step 2: Business Information'}
          {step === 3 && 'Step 3: Additional Details'}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Owner Account */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g., Acme Corporation"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                placeholder="e.g., Acme Corporation LLC"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="food_beverage">Food & Beverage</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="automotive">Automotive</option>
                  <option value="construction">Construction</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Size</option>
                  <option value="1">Just me</option>
                  <option value="2-10">2-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID / VAT Number</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="e.g., 12-3456789"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="123 Main Street"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="NL">Netherlands</option>
                  {/* Add more countries as needed */}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900">What's included in your free trial:</h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>✓ Up to 5 team members</li>
                <li>✓ 100 products</li>
                <li>✓ Inventory management</li>
                <li>✓ Supplier management</li>
                <li>✓ Basic analytics</li>
                <li>✓ 14 days, no credit card required</li>
              </ul>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </a>
      </div>
    </div>
  );
};
