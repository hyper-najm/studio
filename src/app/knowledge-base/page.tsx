
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Loader2, HelpCircle, AlertTriangle, BookOpen, Mic, Upload, FileText, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const INPUT_ACCEPT_EXTENSIONS = ".txt,.md,.doc,.docx,.pdf";

const formSchema = z.object({
  query: z.string().max(2000, "Query is too long (max 2000 characters).").optional(),
  uploadedFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid file.",
  })
  .refine(file => file ? file.size <= MAX_FILE_SIZE_BYTES : true, `File size should be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(file => {
    if (!file) return true;
    // Allow common text-based MIME types and specific document MIME types
    return ACCEPTED_FILE_TYPES.includes(file.type) || file.type.startsWith('text/');
  }, "Unsupported file type. Please upload a supported document (.txt, .md, .doc, .docx, .pdf).")
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
  const [fileProcessingMessage, setFileProcessingMessage] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      uploadedFile: undefined,
    },
  });

  // Setup worker on mount without blocking initial render
  useEffect(() => {
    const setupPdfWorker = async () => {
        try {
            // Dynamically import the library
            const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
            // @ts-ignore - The dynamic import might not have perfect type inference for version
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        } catch (e) {
            console.error("Error setting up PDF.js worker:", e);
        }
    };
    setupPdfWorker();
  }, []);


  const { setValue, watch, setError: setFormError, clearErrors: clearFormErrors } = form;
  const selectedFile = watch('uploadedFile');

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore - Dynamic import makes strict typing difficult here
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      // @ts-ignore
      textContent += text.items.map(item => item.str || '').join(' ') + '\n';
    }
    return textContent;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileProcessingMessage(null); // Clear previous messages
    if (file) {
      // Zod handles the primary validation on submit, but we can do a quick check here.
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("uploadedFile", { type: "size", message: `File size should be less than ${MAX_FILE_SIZE_MB}MB.` });
        setFileNamePreview(null); setValue('uploadedFile', undefined); return;
      }
      
      setValue('uploadedFile', file, { shouldValidate: true });
      setFileNamePreview(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      clearFormErrors("uploadedFile");

      if (form.getValues("query")) {
        toast({ title: "File Selected", description: "Content from the uploaded file will be combined with your typed query."});
      }
      if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
        setFileProcessingMessage("Note: For older .doc files, text extraction might be limited. Converting to .docx or pasting content is recommended for best results.");
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
    setFileProcessingMessage(null);

    let queryContent = data.query || "";
    
    if (data.uploadedFile) {
      const fileName = data.uploadedFile.name;
      setFileProcessingMessage(`Processing ${fileName}...`);
      try {
        let fileText = '';
        if (data.uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || data.uploadedFile.name.endsWith('.docx')) {
          fileText = await extractTextFromDocx(data.uploadedFile);
        } else if (data.uploadedFile.type === 'application/pdf') {
          fileText = await extractTextFromPdf(data.uploadedFile);
        } else if (data.uploadedFile.type === 'application/msword' || data.uploadedFile.name.endsWith('.doc')) {
           toast({variant: "default", title: "Notice for .doc file", description: "Attempting text extraction for .doc. For best results, convert to .docx or paste content.", duration: 7000});
           try {
             fileText = await extractTextFromDocx(data.uploadedFile);
           } catch (e) {
             console.warn("Mammoth failed on .doc file, falling back to simple text extraction.", e);
             fileText = await data.uploadedFile.text();
           }
        } else if (ACCEPTED_FILE_TYPES.includes(data.uploadedFile.type) || data.uploadedFile.type.startsWith('text/')) { // other text-based
          fileText = await data.uploadedFile.text();
        } else {
          throw new Error(`Could not read text from ${fileName}. It might not be a plain text compatible format.`);
        }

        if (queryContent.trim() && fileText.trim()) {
          queryContent += `\n\n--- Content from uploaded file: ${fileName} ---\n${fileText}`;
        } else if (fileText.trim()) {
          queryContent = fileText;
        }
        setFileProcessingMessage(`${fileName} processed successfully.`);

      } catch (e: any) {
        setError(`Failed to read content from ${fileName}: ${e.message || "Please ensure it's a supported file format."}`);
        toast({ variant: "destructive", title: "File Read Error", description: `Could not process ${fileName}. ${e.message}` });
        setIsLoading(false);
        setFileProcessingMessage(null);
        return;
      }
    }

    if (!queryContent.trim() || queryContent.trim().length < 5) {
      setFormError("query", { type: "manual", message: "Query content (from text input or file) must be at least 5 characters." });
      toast({ variant: "destructive", title: "Input Required", description: "Query content (from text input or file) must be at least 5 characters."});
      setIsLoading(false);
      setFileProcessingMessage(null);
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
      if (!error) setFileProcessingMessage(null); // Clear processing message on success
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle />Cybersecurity Knowledge Base</CardTitle>
          <CardDescription>
            Ask questions to our intelligent cybersecurity advisor. You can type a query, or upload a document (.txt, .md, .doc, .docx, .pdf) to have its content analyzed as context for your question.
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
                    <FormLabel htmlFor="uploadedFile-kb">Or Upload a Context File (.txt, .md, .doc, .docx, .pdf)</FormLabel>
                     <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          id="uploadedFile-kb"
                          type="file"
                          accept={INPUT_ACCEPT_EXTENSIONS}
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
                    {fileProcessingMessage && (
                      <Alert variant={error ? "destructive" : "default"} className="mt-2 text-sm">
                         <FileWarning className="h-4 w-4"/>
                        <AlertDescription>{fileProcessingMessage}</AlertDescription>
                      </Alert>
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

      {error && !isLoading && (
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
