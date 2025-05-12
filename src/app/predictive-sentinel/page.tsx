'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity />Predictive Sentinel</CardTitle>
          <CardDescription>
            This feature uses machine learning to anticipate potential cyberattacks based on historical data and emerging threat patterns. It offers proactive security recommendations.
            <br />
            <strong className="text-primary mt-2 block">Currently under development.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            While the full predictive engine is being built, you can generate AI-powered security awareness tips below. These tips provide educational insights into various security topics.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb />Proactive Security Tip Generator</CardTitle>
          <CardDescription>Enter a topic to get an educational security awareness tip.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateTip)}>
            <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="tip-topic">Tip Topic</FormLabel>
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
                          onClick={() => toast({ title: "Voice Input", description: "Voice input feature coming soon!" })}
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
        
        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Generating Tip</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {tipResult && (
          <CardContent>
            <Alert variant="default" className="border-primary bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Security Awareness Tip</AlertTitle>
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

```