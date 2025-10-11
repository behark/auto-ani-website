'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Trash2,
  Shield,
  Eye,
  Settings,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  User,
  Database,
  Activity,
  Lock
} from 'lucide-react';
import { useGDPR } from './GDPRProvider';
import { useCookieConsent } from './CookieConsent';
import { useLanguage } from '@/contexts/LanguageContext';

interface PrivacyDashboardProps {
  className?: string;
}

export default function PrivacyDashboard({ className = '' }: PrivacyDashboardProps) {
  const { t } = useLanguage();
  const {
    userData,
    dataProcessingActivities,
    requestDataExport,
    requestDataDeletion,
    privacyNotices,
    userRights
  } = useGDPR();
  const { consent, updateConsent } = useCookieConsent();

  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'rights' | 'activities' | 'settings'>('overview');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const dataBlob = await requestDataExport();
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autoani-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const success = await requestDataDeletion();
      if (success) {
        setShowConfirmDelete(false);
        // Redirect to homepage after deletion
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to delete data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDataCollectionStatus = () => {
    const activities = dataProcessingActivities.length;
    const consented = Object.values(consent.categories || {}).filter(Boolean).length;

    return {
      total: activities,
      active: consented,
      status: consented === 0 ? 'minimal' : consented < activities ? 'partial' : 'full'
    };
  };

  const status = getDataCollectionStatus();

  const TabButton = ({ tab, children, icon: Icon }: { tab: typeof activeTab; children: React.ReactNode; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Privacy Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your privacy settings, view your data, and exercise your rights under GDPR.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        <TabButton tab="overview" icon={Eye}>Overview</TabButton>
        <TabButton tab="data" icon={Database}>My Data</TabButton>
        <TabButton tab="rights" icon={User}>My Rights</TabButton>
        <TabButton tab="activities" icon={Activity}>Activities</TabButton>
        <TabButton tab="settings" icon={Settings}>Settings</TabButton>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Privacy Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{status.active}</div>
                  <div className="text-sm text-gray-600">Active Data Processing</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(consent.categories || {}).filter(Boolean).length}
                  </div>
                  <div className="text-sm text-gray-600">Consents Given</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {userData?.activities.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Recent Activities</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Collection Level</span>
                  <Badge
                    variant={status.status === 'minimal' ? 'secondary' : status.status === 'partial' ? 'default' : 'destructive'}
                  >
                    {status.status === 'minimal' ? 'Minimal' : status.status === 'partial' ? 'Partial' : 'Full'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      status.status === 'minimal' ? 'bg-green-500' : status.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(status.active / status.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Export My Data</div>
                      <div className="text-sm text-gray-600">Download all your data</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => setShowConfirmDelete(true)}
                  className="justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <div className="font-medium">Delete My Data</div>
                      <div className="text-sm text-gray-600">Remove all personal data</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Processing Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataProcessingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-sm text-gray-600">{activity.purpose}</div>
                    </div>
                    <Badge variant={activity.legalBasis === 'consent' ? 'default' : 'secondary'}>
                      {activity.legalBasis.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data We Collect</CardTitle>
            </CardHeader>
            <CardContent>
              {dataProcessingActivities.map((activity) => (
                <div key={activity.id} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{activity.name}</h3>
                    <Badge variant="outline">{activity.retentionPeriod}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{activity.purpose}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activity.dataTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  {activity.thirdParties && (
                    <div className="text-sm">
                      <span className="font-medium">Shared with: </span>
                      {activity.thirdParties.join(', ')}
                    </div>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <div className="text-gray-900">{userData?.id || 'Not available'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data Created</label>
                    <div className="text-gray-900">
                      {userData?.activities.find(a => a.type === 'user_created')?.timestamp || 'Unknown'}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Stored Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Language:</span>
                      <span>{userData?.preferences.language || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Newsletter:</span>
                      <Badge variant={userData?.preferences.newsletter ? 'default' : 'secondary'}>
                        {userData?.preferences.newsletter ? 'Subscribed' : 'Not subscribed'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Rights Tab */}
      {activeTab === 'rights' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Rights Under GDPR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(userRights).map(([right, available]) => (
                  <div
                    key={right}
                    className={`p-4 border rounded-lg ${available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium capitalize">
                          Right to {right.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {right === 'access' && 'Request a copy of your personal data'}
                          {right === 'rectification' && 'Correct inaccurate personal data'}
                          {right === 'erasure' && 'Request deletion of your personal data'}
                          {right === 'restriction' && 'Limit how we use your personal data'}
                          {right === 'portability' && 'Receive your data in a portable format'}
                          {right === 'objection' && 'Object to processing of your personal data'}
                        </p>
                      </div>
                      {available ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Exercise Your Rights</h4>
                <p className="text-blue-800 text-sm mb-4">
                  To exercise any of these rights, you can use the tools on this page or contact our Data Protection Officer.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleExportData} disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="mailto:privacy@autosalonani.com">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact DPO
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {userData?.activities.length ? (
                <div className="space-y-3">
                  {userData.activities.slice(-20).reverse().map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {activity.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No activities recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(consent.categories || {}).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{category} Cookies</div>
                      <div className="text-sm text-gray-600">
                        {category === 'necessary' && 'Required for basic functionality'}
                        {category === 'functional' && 'Enhance your experience'}
                        {category === 'analytics' && 'Help us improve our website'}
                        {category === 'marketing' && 'Show you relevant advertisements'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={category === 'necessary'}
                      onChange={(e) => updateConsent(category, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Notices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {privacyNotices.map((notice) => (
                  <div key={notice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{notice.title}</div>
                      <div className="text-sm text-gray-600">
                        Version {notice.version} • Effective {notice.effective}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/privacy/${notice.id}`} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete All Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. All your personal data, preferences, and history will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteData}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </Button>
                <Button
                  onClick={() => setShowConfirmDelete(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}