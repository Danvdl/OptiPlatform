import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { TeamManagement } from './TeamManagement';

const GET_BUSINESS_SETTINGS = gql`
  query GetBusinessSettings {
    businessSettings {
      tenant {
        id
        name
        businessName
        legalName
        taxId
        industry
        companySize
        website
        logo
        phoneNumber
        supportEmail
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
        currency
        timezone
        language
        plan
        status
        trialEndsAt
        maxUsers
        maxProducts
        onboardingCompleted
        features
      }
      totalUsers
      totalProducts
      storageUsed
      daysUntilTrialEnds
    }
    myBusiness {
      id
      name
      slug
    }
  }
`;

const UPDATE_BUSINESS = gql`
  mutation UpdateBusiness($input: UpdateTenantInput!) {
    updateBusiness(input: $input) {
      id
      businessName
      legalName
      taxId
      industry
      companySize
      website
      phoneNumber
      addressLine1
      city
      state
      postalCode
      country
      currency
      timezone
    }
  }
`;

export const BusinessSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'subscription'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  const { data, loading, refetch } = useQuery(GET_BUSINESS_SETTINGS);
  const [updateBusiness, { loading: updating }] = useMutation(UPDATE_BUSINESS);

  const [formData, setFormData] = useState({
    businessName: '',
    legalName: '',
    taxId: '',
    industry: '',
    companySize: '',
    website: '',
    phoneNumber: '',
    supportEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    currency: '',
    timezone: '',
    language: ''
  });

  React.useEffect(() => {
    if (data?.businessSettings?.tenant) {
      const tenant = data.businessSettings.tenant;
      setFormData({
        businessName: tenant.businessName || '',
        legalName: tenant.legalName || '',
        taxId: tenant.taxId || '',
        industry: tenant.industry || '',
        companySize: tenant.companySize || '',
        website: tenant.website || '',
        phoneNumber: tenant.phoneNumber || '',
        supportEmail: tenant.supportEmail || '',
        addressLine1: tenant.addressLine1 || '',
        addressLine2: tenant.addressLine2 || '',
        city: tenant.city || '',
        state: tenant.state || '',
        postalCode: tenant.postalCode || '',
        country: tenant.country || '',
        currency: tenant.currency || '',
        timezone: tenant.timezone || '',
        language: tenant.language || ''
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateBusiness({ variables: { input: formData } });
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  const settings = data?.businessSettings;
  const tenant = settings?.tenant;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600">Manage your business profile and team</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Business Profile
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Members ({settings?.totalUsers || 0})
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscription'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subscription & Billing
          </button>
        </nav>
      </div>

      {/* Business Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{tenant?.plan.toUpperCase()} Plan</h3>
                <p className="text-blue-100 mt-1">
                  {tenant?.status === 'trial' && settings?.daysUntilTrialEnds > 0
                    ? `${settings.daysUntilTrialEnds} days left in trial`
                    : `Status: ${tenant?.status}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{settings?.totalUsers || 0} / {tenant?.maxUsers || 0}</div>
                <p className="text-blue-100 text-sm">Team members</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-blue-100 text-sm">Products</div>
                <div className="text-xl font-semibold">{settings?.totalProducts || 0} / {tenant?.maxProducts || 0}</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Storage</div>
                <div className="text-xl font-semibold">{settings?.storageUsed || 0} MB</div>
              </div>
              <div>
                <div className="text-blue-100 text-sm">Business Slug</div>
                <div className="text-xl font-semibold">{data?.myBusiness?.slug}</div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Legal Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax ID / VAT</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  disabled={!isEditing}
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
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
                  disabled={!isEditing}
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                >
                  <option value="">Select Size</option>
                  <option value="1">Just me</option>
                  <option value="2-10">2-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Support Email</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Business Address</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  disabled={!isEditing}
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="NL">Netherlands</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Preferences</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  disabled={!isEditing}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
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
                  disabled={!isEditing}
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
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
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && <TeamManagement />}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Plan:</span>
              <span className="font-semibold">{tenant?.plan.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                tenant?.status === 'active' ? 'bg-green-100 text-green-800' :
                tenant?.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {tenant?.status}
              </span>
            </div>
            {tenant?.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Trial Ends:</span>
                <span className="font-semibold">
                  {new Date(tenant.trialEndsAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">User Limit:</span>
              <span className="font-semibold">{tenant?.maxUsers || 'Unlimited'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Product Limit:</span>
              <span className="font-semibold">{tenant?.maxProducts || 'Unlimited'}</span>
            </div>

            <div className="pt-4 border-t">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
