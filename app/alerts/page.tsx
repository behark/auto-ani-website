'use client';

import { useState, useEffect } from 'react';

import { Bell, Mail, AlertCircle } from 'lucide-react';

import AlertsManagementDashboard from '@/components/alerts/AlertsManagementDashboard';
import CreateAlertModal from '@/components/alerts/CreateAlertModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AlertsPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user has a session ID
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      setIsAuthenticated(true);
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsAuthenticated(true);
    }
  };

  const handleCreateSession = () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', newSessionId);
    setSessionId(newSessionId);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Bell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Access Your Alerts</CardTitle>
              <p className="text-gray-600">
                Enter your email to view and manage your inventory alerts
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  View My Alerts
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleCreateSession}
                className="w-full"
              >
                Continue as Guest
              </Button>

              <div className="text-xs text-gray-500 text-center">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Guest sessions are temporary and will be lost when you clear your browser data
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Alerts</h1>
          <p className="text-gray-600 mt-2">
            Stay notified when vehicles matching your criteria become available
          </p>
        </div>
        <CreateAlertModal searchParams={{}}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Bell className="h-4 w-4 mr-2" />
            Create New Alert
          </Button>
        </CreateAlertModal>
      </div>

      <AlertsManagementDashboard
        sessionId={sessionId}
        email={email || undefined}
      />
    </div>
  );
}