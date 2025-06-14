
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSecurityAwarenessTip } from '@/lib/actions';
import type { GenerateSecurityAwarenessTipOutput } from '@/ai/flows/generate-security-awareness-tip';
import { Loader2, Lightbulb, AlertTriangle, Activity, Mic } from 'lucide-react'; 
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';


const tipFormSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters."}).max(50, {message: "Topic too long."}),
});
type TipFormData = z.infer<typeof tipFormSchema>;

export default function PredictiveSentinelPage() {
  const [tipResult, setTipResult] = useState<GenerateSecurityAwarenessTipOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<TipFormData>({
    resolver: zodResolver(tipFormSchema),
    defaultValues: {
      topic: "password security",
    },
  });

  const handleGenerateTip: SubmitHandler<TipFormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setTipResult(null);
    try {
      const result = await generateSecurityAwarenessTip({ topic: data.topic });
      setTipResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Error Generating Tip", description: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <Alert variant="default" className="border-primary bg-primary/5">
        <Activity className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Core Predictive Engine - Under Intensive Development</AlertTitle>
        <AlertDescription>
          We're actively building the advanced machine learning capabilities for the Predictive Sentinel to anticipate and forecast potential cyberattacks. 
          This core functionality is <strong className="font-semibold">coming soon!</strong>
          <br />
          In the meantime, explore our AI-driven Security Awareness Tip Generator below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400"/>AI Security Awareness Tip Generator</CardTitle>
          <CardDescription>Get instant, AI-powered educational security tips on various topics to enhance your awareness.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateTip)}>
            <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="tip-topic">Enter a Security Topic:</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input 
                            id="tip-topic" 
                            placeholder="e.g., phishing, strong passwords, Wi-Fi security" 
                            {...field} 
                            className="flex-grow"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toast({ title: "Voice Input", description: "Voice input feature for tip topic coming soon!" })}
                          aria-label="Use voice input for tip topic"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tip...
                  </>
                ) : (
                  'Get Security Tip'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
        
        {error && !isLoading && (
          <CardContent className="pt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Generating Tip</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {tipResult && (
          <CardContent className="pt-4">
            <Alert variant="default" className="border-primary bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Security Awareness Tip on "{form.getValues('topic')}"</AlertTitle>
              <AlertDescription className="text-foreground whitespace-pre-wrap">
                {tipResult.tip}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

    