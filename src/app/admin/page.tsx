'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserCog, ShieldAlert, Users, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// This is placeholder data. In a real application, you would fetch this from your database.
const otherSampleUsers = [
  { id: 'user_2', name: 'John Doe', email: 'john.d@example.com', role: 'User', status: 'Active', joined: '2024-05-15' },
  { id: 'user_3', name: 'Jane Smith', email: 'jane.s@example.com', role: 'User', status: 'Inactive', joined: '2024-05-20' },
  { id: 'user_4', name: 'Test User', email: 'test@example.com', role: 'User', status: 'Active', joined: '2024-06-10' },
];

export default function AdminPage() {
  const { user } = useAuth();

  const sampleUsers = useMemo(() => {
    const adminUser = {
      id: user?.uid || 'user_1',
      name: user?.displayName || 'Admin User',
      email: user?.email || 'admin@example.com',
      role: 'Admin',
      status: 'Active',
      joined: user?.metadata.creationTime 
        ? new Date(user.metadata.creationTime).toISOString().split('T')[0] 
        : '2024-05-01',
    };
    return [adminUser, ...otherSampleUsers];
  }, [user]);

  // Calculate analytics from the user data
  const activeUsers = useMemo(() => sampleUsers.filter(u => u.status === 'Active').length, [sampleUsers]);
  const inactiveUsers = useMemo(() => sampleUsers.filter(u => u.status === 'Inactive').length, [sampleUsers]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog />Admin Dashboard</CardTitle>
          <CardDescription>
            This is the central hub for managing your CyberGuardian Pro application, including user oversight, content moderation, and system analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              This page is currently accessible to all logged-in users. For production use, it is critical to implement Role-Based Access Control (RBAC) to ensure only authorized administrators can access this dashboard.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{sampleUsers.length}</div>
                    <p className="text-xs text-muted-foreground">Currently registered in the system</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeUsers}</div>
                    <p className="text-xs text-muted-foreground">Users with active status</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                    <UserX className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{inactiveUsers}</div>
                    <p className="text-xs text-muted-foreground">Users with inactive status</p>
                </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                     <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'} className={user.status === 'Active' ? 'text-green-500 border-green-500' : ''}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
