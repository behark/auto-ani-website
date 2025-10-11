'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlayCircle,
  StopCircle,
  RotateCcw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface JobStatus {
  id: string;
  name: string;
  data: {
    type?: string;
    [key: string]: unknown;
  };
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  returnvalue?: unknown;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface SchedulerStatus {
  initialized: boolean;
  timestamp: string;
}

interface JobsData {
  scheduler: SchedulerStatus;
  queue: QueueStats;
  recentJobs: JobStatus[];
}

const JobsDashboard: React.FC = () => {
  const [jobsData, setJobsData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchJobsData = async () => {
    try {
      const response = await fetch('/api/admin/jobs', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'default-key'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs data');
      }

      const data = await response.json();
      setJobsData(data);
    } catch (error) {
      logger.error('Error fetching jobs data:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to fetch jobs data');
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (jobType: string) => {
    setTriggering(jobType);
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'default-key'}`,
        },
        body: JSON.stringify({ jobType }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger job');
      }

      const result = await response.json();
      toast.success(`Job ${jobType} has been queued`);

      // Refresh data after a short delay
      setTimeout(fetchJobsData, 1000);
    } catch (error) {
      logger.error('Error triggering job:', { error: error instanceof Error ? error.message : String(error) });
      toast.error(`Failed to trigger job: ${jobType}`);
    } finally {
      setTriggering(null);
    }
  };

  const initializeScheduler = async () => {
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'default-key'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize scheduler');
      }

      toast.success('Job scheduler initialized');
      fetchJobsData();
    } catch (error) {
      logger.error('Error initializing scheduler:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to initialize scheduler');
    }
  };

  const clearJobs = async (action: string) => {
    try {
      const response = await fetch(`/api/admin/jobs?action=${action}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'default-key'}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action}`);
      }

      toast.success(`Successfully ${action.replace('_', ' ')}`);
      fetchJobsData();
    } catch (error) {
      logger.error(`Error ${action}:`, { error: error instanceof Error ? error.message : String(error) });
      toast.error(`Failed to ${action.replace('_', ' ')}`);
    }
  };

  useEffect(() => {
    fetchJobsData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchJobsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Waiting</Badge>;
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!jobsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Failed to load jobs data</p>
        <Button onClick={fetchJobsData}>Retry</Button>
      </div>
    );
  }

  const availableJobs = [
    { type: 'daily_aggregation', name: 'Daily Aggregation', description: 'Aggregate daily sales and analytics data' },
    { type: 'inventory_aging', name: 'Inventory Aging', description: 'Analyze inventory aging and generate alerts' },
    { type: 'lead_scoring', name: 'Lead Scoring', description: 'Calculate lead scores for recent inquiries' },
    { type: 'ga4_sync', name: 'GA4 Sync', description: 'Sync data from Google Analytics 4' },
    { type: 'alert_check', name: 'Alert Check', description: 'Check analytics thresholds and send alerts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage automated analytics jobs</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchJobsData}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!jobsData.scheduler.initialized && (
            <Button
              onClick={initializeScheduler}
              variant="default"
              size="sm"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Initialize Scheduler
            </Button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobsData.scheduler.initialized ? (
                <span className="text-green-600">Running</span>
              ) : (
                <span className="text-red-600">Stopped</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(jobsData.scheduler.timestamp).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData.queue.waiting}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData.queue.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData.queue.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData.queue.failed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Jobs</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Jobs Manually</CardTitle>
              <CardDescription>
                Manually trigger analytics jobs for testing or immediate execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableJobs.map((job) => (
                  <Card key={job.type} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{job.name}</h3>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                      </div>
                      <Button
                        onClick={() => triggerJob(job.type)}
                        disabled={triggering === job.type}
                        size="sm"
                      >
                        {triggering === job.type ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Job History</CardTitle>
              <CardDescription>
                Latest job executions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsData.recentJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent jobs found
                </div>
              ) : (
                <div className="space-y-4">
                  {jobsData.recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.name}</h3>
                          {getStatusBadge(job.failedReason ? 'failed' : 'completed')}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {job.data.type && <span>Type: {job.data.type}</span>}
                        </div>
                        {job.failedReason && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {job.failedReason}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Started: {formatDate(job.processedOn)}</div>
                        <div>Finished: {formatDate(job.finishedOn)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Maintenance</CardTitle>
              <CardDescription>
                Clean up job queues and manage scheduler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => clearJobs('clear_completed')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Completed Jobs
                </Button>

                <Button
                  onClick={() => clearJobs('clear_failed')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Clear Failed Jobs
                </Button>

                <Button
                  onClick={() => clearJobs('shutdown')}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Shutdown Scheduler
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobsDashboard;