
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Palette, Save, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserSettings, saveUserSettings, type UserSettings } from "@/services/settingsService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';

const defaultSettingsValues: Omit<UserSettings, 'lastUpdated'> = {
  profileName: "", // Will be populated from user profile or left blank
  profileEmail: "", // Will be populated from user profile
  is2FAEnabled: false,
  emailCriticalAlerts: true,
  inAppSystemUpdates: true,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile State
  const [profileName, setProfileName] = useState(defaultSettingsValues.profileName);
  const [profileEmail, setProfileEmail] = useState(defaultSettingsValues.profileEmail);

  // Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(defaultSettingsValues.is2FAEnabled);

  // Notifications State
  const [emailCriticalAlerts, setEmailCriticalAlerts] = useState(defaultSettingsValues.emailCriticalAlerts);
  const [inAppSystemUpdates, setInAppSystemUpdates] = useState(defaultSettingsValues.inAppSystemUpdates);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be determined

    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to access settings." });
      router.push('/login');
      return;
    }

    async function loadSettings() {
      if (!user) return;
      setIsLoadingSettings(true);
      try {
        const settings = await getUserSettings(user.uid);
        if (settings) {
          setProfileName(settings.profileName || user.displayName || user.email?.split('@')[0] || '');
          setProfileEmail(settings.profileEmail || user.email || '');
          setIs2FAEnabled(settings.is2FAEnabled);
          setEmailCriticalAlerts(settings.emailCriticalAlerts);
          setInAppSystemUpdates(settings.inAppSystemUpdates);
        } else {
          // Set to defaults if no settings found in DB (first time user for settings)
          setProfileName(user.displayName || user.email?.split('@')[0] || defaultSettingsValues.profileName);
          setProfileEmail(user.email || defaultSettingsValues.profileEmail);
          setIs2FAEnabled(defaultSettingsValues.is2FAEnabled);
          setEmailCriticalAlerts(defaultSettingsValues.emailCriticalAlerts);
          setInAppSystemUpdates(defaultSettingsValues.inAppSystemUpdates);
          toast({ title: "Default Settings Loaded", description: "Set up your preferences." });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error Loading Settings",
          description: error instanceof Error ? error.message : "Could not load settings.",
        });
        // Fallback to defaults on error
        setProfileName(user.displayName || user.email?.split('@')[0] || defaultSettingsValues.profileName);
        setProfileEmail(user.email || defaultSettingsValues.profileEmail);
        setIs2FAEnabled(defaultSettingsValues.is2FAEnabled);
        setEmailCriticalAlerts(defaultSettingsValues.emailCriticalAlerts);
        setInAppSystemUpdates(defaultSettingsValues.inAppSystemUpdates);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, [user, authLoading, toast, router]);

  const handleSaveChanges = async (section: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Cannot save settings." });
      return;
    }
    setIsSaving(true);
    let settingsToSave: Partial<Omit<UserSettings, 'lastUpdated'>> = {};
    let successMessage = "Settings saved successfully!";

    switch (section) {
      case "Profile":
        settingsToSave = { profileName, profileEmail };
        successMessage = `Profile updated successfully.`;
        break;
      case "Security":
        settingsToSave = { is2FAEnabled };
        successMessage = `Security settings updated: 2FA is ${is2FAEnabled ? 'enabled' : 'disabled'}.`;
        break;
      case "Notification":
        settingsToSave = { emailCriticalAlerts, inAppSystemUpdates };
        successMessage = `Notification settings updated.`;
        break;
      case "Appearance":
         toast({ title: "Appearance Settings", description: "Appearance settings are currently default. More options coming soon." });
         setIsSaving(false);
        return; 
      default:
        setIsSaving(false);
        return;
    }

    try {
      await saveUserSettings(user.uid, settingsToSave);
      toast({
        title: `${section} Settings Saved`,
        description: successMessage,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Error Saving ${section} Settings`,
        description: error instanceof Error ? error.message : "Could not save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">{authLoading ? "Authenticating..." : "Loading settings..."}</p>
      </div>
    );
  }

  if (!user && !authLoading) {
     // This case should be handled by redirection, but as a fallback UI
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle/> Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You must be logged in to view and manage settings.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </CardContent>
      </Card>
    );
  }


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
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} disabled={isSaving} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} disabled={isSaving || (user?.emailVerified && user?.email === profileEmail)} title={user?.emailVerified && user?.email === profileEmail ? "Email verified with provider, cannot be changed here." : ""} />
                    {user?.emailVerified && user?.email === profileEmail && <p className="text-xs text-muted-foreground">This email is verified and primarily managed by your auth provider.</p>}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleSaveChanges("Profile")} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Profile Changes
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
                  <Button variant="outline" onClick={() => toast({title: "Change Password", description: "Password change/reset functionality usually handled via Firebase directly or custom email flows."})} disabled={isSaving}>Change Password</Button>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label htmlFor="2fa" className="font-semibold">Two-Factor Authentication (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhance your account security by enabling 2FA. (Feature coming soon)
                      </p>
                    </div>
                    <Switch 
                      id="2fa" 
                      checked={is2FAEnabled}
                      onCheckedChange={setIs2FAEnabled}
                      disabled={isSaving || true} // 2FA not implemented yet
                    />
                  </div>
                </CardContent>
                 <CardFooter>
                  <Button onClick={() => handleSaveChanges("Security")} disabled={isSaving || true}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Security Settings
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
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="inapp-notifications" className="flex-grow">In-App Notifications for System Updates</Label>
                    <Switch 
                      id="inapp-notifications" 
                      checked={inAppSystemUpdates}
                      onCheckedChange={setInAppSystemUpdates}
                      disabled={isSaving}
                    />
                  </div>
                </CardContent>
                 <CardFooter>
                  <Button onClick={() => handleSaveChanges("Notification")} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Notification Settings
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
                      checked={true} 
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
                  <Button onClick={() => handleSaveChanges("Appearance")} disabled={isSaving || true}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Appearance Settings
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
