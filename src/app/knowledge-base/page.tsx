'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { queryCybersecurityKnowledgeBase } from '@/lib/actions';
import type { QueryCybersecurityKnowledgeBaseOutput } from '@/ai/flows/query-cybersecurity-knowledge-base';
import { Loader2, HelpCircle, AlertTriangle, BookOpen } from 'lucide-react';

const formSchema = z.object({
  query: z.string().min(5, { message: 'Query must be at least 5 characters long.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function KnowledgeBasePage() {
  const [queryResult, setQueryResult] = useState<QueryCybersecurityKnowledgeBaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setQueryResult(null);
    try {
      const result = await queryCybersecurityKnowledgeBase({ query: data.query });
      setQueryResult(result);
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
          <CardTitle className="flex items-center gap-2"><HelpCircle />Cybersecurity Knowledge Base</CardTitle>
          <CardDescription>
            Ask questions to our intelligent cybersecurity advisor. Get accurate and up-to-date information and best practices.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="query-input">Your Cybersecurity Question</FormLabel>
                    <FormControl>
                      <Input
                        id="query-input"
                        placeholder="e.g., What are common ransomware attack vectors?"
                        {...field}
                      />
                    </FormControl>
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
                    Searching...
                  </>
                ) : (
                  'Ask Advisor'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Query Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {queryResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen />Advisor's Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Answer:</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm">
                <p className="whitespace-pre-wrap">{queryResult.answer}</p>
              </div>
            </div>
            {queryResult.sources && queryResult.sources.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1">Sources:</h3>
                <ul className="list-disc list-inside space-y-1 rounded-md border p-3 bg-muted/30">
                  {queryResult.sources.map((source, index) => (
                    <li key={index} className="text-sm">{source}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
