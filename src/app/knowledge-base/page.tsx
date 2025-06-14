
'use client';

import { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { queryCybersecurityKnowledgeBase } from '@/lib/actions';
import type { QueryCybersecurityKnowledgeBaseOutput } from '@/ai/flows/query-cybersecurity-knowledge-base';
import { Loader2, HelpCircle, AlertTriangle, BookOpen, Mic, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['text/plain', 'text/markdown'];

const formSchema = z.object({
  query: z.string().max(2000, "Query is too long (max 2000 characters).").optional(),
  uploadedFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid file.",
  })
  .refine(file => file ? file.size <= MAX_FILE_SIZE_BYTES : true, `File size should be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(file => file ? ACCEPTED_FILE_TYPES.includes(file.type) : true, "Unsupported file type. Please upload a .txt or .md file.")
  .optional(),
}).refine(data => (data.query && data.query.trim().length >= 5) || data.uploadedFile, {
  message: "Please enter a query (min 5 characters) or upload a file.",
  path: ["query"], 
});

type FormData = z.infer<typeof formSchema>;

export default function KnowledgeBasePage() {
  const [queryResult, setQueryResult] = useState<QueryCybersecurityKnowledgeBaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNamePreview, setFileNamePreview] = useState<string | null>(null);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      uploadedFile: undefined,
    },
  });

  const { setValue, watch, setError: setFormError, clearErrors: clearFormErrors } = form;
  const selectedFile = watch('uploadedFile');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setFormError("uploadedFile", { type: "type", message: "Unsupported file type. Please upload a .txt or .md file." });
        setFileNamePreview(null);
        setValue('uploadedFile', undefined);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("uploadedFile", { type: "size", message: `File size should be less than ${MAX_FILE_SIZE_MB}MB.` });
        setFileNamePreview(null);
        setValue('uploadedFile', undefined);
        return;
      }
      setValue('uploadedFile', file, { shouldValidate: true });
      setFileNamePreview(`${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      clearFormErrors("uploadedFile");
      if (form.getValues("query")) {
        toast({ title: "File Selected", description: "Content from the uploaded file will be combined with your typed query."});
      }
    } else {
      setValue('uploadedFile', undefined, { shouldValidate: true });
      setFileNamePreview(null);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setQueryResult(null);
    clearFormErrors();

    let queryContent = data.query || "";
    
    if (data.uploadedFile) {
      const fileName = data.uploadedFile.name;
      try {
        const fileText = await data.uploadedFile.text();
        if (queryContent.trim()) {
          queryContent += `\n\n--- Content from uploaded file: ${fileName} ---\n${fileText}`;
        } else {
          queryContent = `--- Content from uploaded file: ${fileName} ---\n${fileText}`;
        }
      } catch (e) {
        setError("Failed to read file content. Please ensure it's a valid text file.");
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the uploaded file." });
        setIsLoading(false);
        return;
      }
    }

    if (!queryContent.trim() || queryContent.trim().length < 5) {
      setFormError("query", { type: "manual", message: "Query content (from text input or file) must be at least 5 characters." });
      toast({ variant: "destructive", title: "Input Required", description: "Query content (from text input or file) must be at least 5 characters."});
      setIsLoading(false);
      return;
    }

    try {
      const result = await queryCybersecurityKnowledgeBase({ query: queryContent });
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Query Error", description: err instanceof Error ? err.message : 'An unknown error occurred processing your query.'});
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
            Ask questions to our intelligent cybersecurity advisor. You can type your query, upload a text file (.txt, .md), or use voice input.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="query-input">Your Cybersecurity Question</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          id="query-input"
                          placeholder="e.g., What are common ransomware attack vectors? Or describe a scenario..."
                          {...field}
                          className="flex-grow min-h-[100px] resize-y pr-10"
                        />
                      </FormControl>
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toast({ title: "Voice Input", description: "Voice input feature for queries coming soon!"})}
                        aria-label="Use voice input for query"
                        className="absolute right-1 top-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="uploadedFile"
                render={() => ( 
                  <FormItem>
                    <FormLabel htmlFor="uploadedFile-kb">Or Upload a Context File (.txt, .md)</FormLabel>
                     <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          id="uploadedFile-kb"
                          type="file"
                          accept={ACCEPTED_FILE_TYPES.join(',')}
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                        />
                      </FormControl>
                    </div>
                    {fileNamePreview && (
                      <div className="mt-2 p-2 border rounded-md bg-muted/50 text-sm flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" /> 
                        <span>{fileNamePreview}</span>
                      </div>
                    )}
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
                    Searching Advisor...
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
        <Alert variant="destructive" className="mt-6">
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
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">Answer:</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap">{queryResult.answer}</p>
              </div>
            </div>
            {queryResult.sources && queryResult.sources.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1">Sources:</h3>
                <ul className="list-disc list-inside space-y-1 rounded-md border p-3 bg-muted/30 text-sm">
                  {queryResult.sources.map((source, index) => (
                    <li key={index} className="text-sm">{source}</li>
                  ))}
                </ul>
              </div>
            )}
            {queryResult.furtherLearning && queryResult.furtherLearning.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1">Further Learning Concepts:</h3>
                <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/30">
                  {queryResult.furtherLearning.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">{concept}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    