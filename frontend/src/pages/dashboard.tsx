/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */

import React from "react";
import { BarChart3 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Recent activities data
 */
const recentActivities = [
  {
    id: 1,
    user: "John Doe",
    action: "Created a new project",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "Updated user profile",
    time: "5 minutes ago",
  },
  {
    id: 3,
    user: "Mike Johnson",
    action: "Completed task #123",
    time: "10 minutes ago",
  },
  {
    id: 4,
    user: "Sarah Wilson",
    action: "Added new team member",
    time: "15 minutes ago",
  },
];

/**
 * Dashboard Page Component
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart placeholder */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Your revenue overview for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart component would go here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest activities from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might want to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>Create Project</Button>
            <Button variant="outline">Add Team Member</Button>
            <Button variant="outline">Generate Report</Button>
            <Button variant="outline">View Analytics</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
