
'use client';

import { useState } from "react";
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

  // Profile State
  const [profileName, setProfileName] = useState("Cyber Guardian User");
  const [profileEmail, setProfileEmail] = useState("user@cyberguardian.pro");

  // Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Notifications State
  const [emailCriticalAlerts, setEmailCriticalAlerts] = useState(true);
  const [inAppSystemUpdates, setInAppSystemUpdates] = useState(true);

  const handleSaveChanges = (section: string) => {
    let description = "Settings saved (placeholder).";
    switch (section) {
      case "Profile":
        description = `Profile updated: Name - ${profileName}, Email - ${profileEmail}. (Placeholder)`;
        break;
      case "Security":
        description = `Security settings updated: 2FA is ${is2FAEnabled ? 'enabled' : 'disabled'}. (Placeholder)`;
        break;
      case "Notification":
        description = `Notification settings updated: Critical Email Alerts ${emailCriticalAlerts ? 'On' : 'Off'}, In-App System Updates ${inAppSystemUpdates ? 'On' : 'Off'}. (Placeholder)`;
        break;
      case "Appearance":
        description = "Appearance settings are currently default. More options coming soon. (Placeholder)";
        break;
    }
    toast({
      title: `${section} Settings`,
      description: description,
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
                    <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
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
                    <Switch 
                      id="2fa" 
                      checked={is2FAEnabled}
                      onCheckedChange={setIs2FAEnabled} 
                    />
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
                    <Switch 
                      id="email-notifications" 
                      checked={emailCriticalAlerts}
                      onCheckedChange={setEmailCriticalAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="inapp-notifications" className="flex-grow">In-App Notifications for System Updates</Label>
                    <Switch 
                      id="inapp-notifications" 
                      checked={inAppSystemUpdates}
                      onCheckedChange={setInAppSystemUpdates}
                    />
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
                    <Switch 
                      id="dark-mode" 
                      checked={true} // Assuming dark mode is default and controlled elsewhere or fixed
                      disabled 
                      aria-readonly 
                      onCheckedChange={() => toast({title: "Dark Mode", description: "Dark Mode is currently enabled by default."})}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Currently, CyberGuardian Pro defaults to a dark theme. More appearance options are coming soon.
                  </p>
                </CardContent>
                 <CardFooter>
                  <Button onClick={() => handleSaveChanges("Appearance")}>
                    <Save className="mr-2 h-4 w-4" />Save Appearance Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
