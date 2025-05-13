
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Palette, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSaveChanges = (section: string) => {
    toast({
      title: `${section} Settings`,
      description: "Save functionality is a placeholder. Settings are not persisted yet.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
              <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
              <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" />Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="Cyber Guardian User" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="user@cyberguardian.pro" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleSaveChanges("Profile")}>
                    <Save className="mr-2 h-4 w-4" />Save Profile Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Authentication</CardTitle>
                  <CardDescription>Manage your account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" onClick={() => toast({title: "Change Password", description: "Feature coming soon."})}>Change Password</Button>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label htmlFor="2fa" className="font-semibold">Two-Factor Authentication (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhance your account security by enabling 2FA.
                      </p>
                    </div>
                    <Switch id="2fa" onCheckedChange={(checked) => toast({title: "2FA Setting", description: `2FA ${checked ? 'enabled' : 'disabled'} (placeholder).`})} />
                  </div>
                </CardContent>
                 <CardFooter>
                  <Button onClick={() => handleSaveChanges("Security")}>
                     <Save className="mr-2 h-4 w-4" />Save Security Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you receive alerts and updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="email-notifications" className="flex-grow">Email Notifications for Critical Alerts</Label>
                    <Switch id="email-notifications" defaultChecked onCheckedChange={(checked) => toast({title: "Email Notifications", description: `Critical alerts by email ${checked ? 'enabled' : 'disabled'} (placeholder).`})} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="inapp-notifications" className="flex-grow">In-App Notifications for System Updates</Label>
                    <Switch id="inapp-notifications" defaultChecked onCheckedChange={(checked) => toast({title: "In-App Notifications", description: `System updates by in-app notification ${checked ? 'enabled' : 'disabled'} (placeholder).`})} />
                  </div>
                </CardContent>
                 <CardFooter>
                  <Button onClick={() => handleSaveChanges("Notification")}>
                    <Save className="mr-2 h-4 w-4" />Save Notification Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interface Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of CyberGuardian Pro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="dark-mode" className="flex-grow">Dark Mode</Label>
                    <Switch id="dark-mode" defaultChecked disabled aria-readonly // Assuming dark mode is default and not changeable here
                      onCheckedChange={() => toast({title: "Dark Mode", description: "Dark Mode is currently enabled by default."})}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Currently, CyberGuardian Pro defaults to a dark theme. More appearance options are coming soon.
                  </p>
                </CardContent>
                 <CardFooter>
                   {/* No save button for appearance if it's not yet configurable */}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    
