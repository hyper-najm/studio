
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldHalf, LogIn, UserPlus, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Placeholder for social icons - you'd typically use an icon library or SVGs
const GoogleIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C14.03,4.73 15.69,5.36 16.95,6.57L19.03,4.5C17.22,2.78 14.91,1.73 12.19,1.73C6.91,1.73 2.73,6.35 2.73,12C2.73,17.64 6.91,22.27 12.19,22.27C17.73,22.27 21.5,18.33 21.5,12.91C21.5,12.24 21.45,11.67 21.35,11.1V11.1Z" /></svg>;
const GithubIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.83,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" /></svg>;


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type LoginFormData = z.infer<typeof loginSchema>;

const signUpSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name too long."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function LoginPage() {
  const { logIn, signUp, signInWithGoogle, signInWithGitHub, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const handleLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
    await logIn(data.email, data.password);
  };

  const handleSignUpSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    await signUp({ 
      email: data.email, 
      password: data.password, 
      displayName: data.displayName 
    });
  };

  const isSubmitting = loginForm.formState.isSubmitting || signUpForm.formState.isSubmitting || authLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-slate-900/60 p-4 selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="flex justify-center mb-6">
            <ShieldHalf className="h-16 w-16 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground/90">
            {activeTab === "login"
              ? "Securely access CyberGuardian Pro"
              : "Join CyberGuardian Pro today"}
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 mx-auto max-w-[calc(100%-2rem)]">
            <TabsTrigger value="login" className="text-base py-2.5">Log In</TabsTrigger>
            <TabsTrigger value="signup" className="text-base py-2.5">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
                <CardContent className="space-y-6 px-6 pb-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">Password</FormLabel>
                          <Link
                            href="#"
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              toast({ title: "Forgot Password", description: "Password recovery feature coming soon." });
                            }}
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex-col gap-4 px-6 pb-8 pt-0">
                  <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting} size="lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                    Log In
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup">
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)}>
                <CardContent className="space-y-6 px-6 pb-6">
                  <FormField
                    control={signUpForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="py-3 text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex-col gap-4 px-6 pb-8 pt-0">
                  <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting} size="lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                    Sign Up
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="px-6 pb-6">
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/90 px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" className="w-full py-3 text-base" onClick={signInWithGoogle} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : <GoogleIcon />}
              <span className="ml-2">Google</span>
            </Button>
            <Button variant="outline" className="w-full py-3 text-base" onClick={signInWithGitHub} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : <GithubIcon />}
              <span className="ml-2">GitHub</span>
            </Button>
          </div>
          <p className="mt-6 px-4 text-center text-xs text-muted-foreground/80">
            By continuing, you agree to CyberGuardian Pro's <br />
            <Link href="#" onClick={(e) => {e.preventDefault(); toast({title: "Legal Info", description: "Terms of Service page coming soon."})}} className="underline underline-offset-2 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" onClick={(e) => {e.preventDefault(); toast({title: "Legal Info", description: "Privacy Policy page coming soon."})}} className="underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
