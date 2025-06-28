
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
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { checkOriginalityReport } from '@/lib/actions';
import type { CheckOriginalityReportOutput, CheckOriginalityReportInput } from '@/ai/flows/check-originality-report';
import { Loader2, ClipboardCheck, AlertTriangle, Info, FileText, Mic, Upload, SearchCheck, ListChecks, Activity, Percent, FileQuestion, ScrollText, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'text/csv',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/rtf',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const INPUT_ACCEPT_EXTENSIONS = ".txt,.md,.html,.htm,.css,.csv,.js,.jsx,.ts,.tsx,.json,.xml,.rtf,.py,.java,.c,.cpp,.h,.cs,.rb,.php,.sh,.log,.doc,.docx,.pdf";


const formSchema = z.object({
  textContent: z.string().max(30000, { message: 'Pasted text is too long (max 30000 characters).' }).optional(),
  uploadedFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid file.",
  })
  .refine(file => file ? file.size <= MAX_FILE_SIZE_BYTES : true, `File size should be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(file => {
    if (!file) return true;
    return ACCEPTED_MIME_TYPES.includes(file.type) || file.type.startsWith('text/') || file.name.endsWith('.py') || file.name.endsWith('.java') ; // Allow common script extensions if MIME is generic
  }, "Unsupported file type. Please upload a text-based document (.txt, .md, .docx, .pdf, etc.) or common script/code file.")
  .optional(),
}).refine(data => (data.textContent && data.textContent.trim().length >= 50) || data.uploadedFile, {
  message: 'Either paste text (min 50 characters) or upload a supported file for analysis.',
  path: ["textContent"],
});

type FormData = z.infer<typeof formSchema>;

export default function OriginalityCheckerPage() {
  const [analysisResult, setAnalysisResult] = useState<CheckOriginalityReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNamePreview, setFileNamePreview] = useState<string | null>(null);
  const [fileProcessingMessage, setFileProcessingMessage] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { textContent: '', uploadedFile: undefined },
  });
  
  // Setup worker on mount without blocking initial render
  useEffect(() => {
    const setupPdfWorker = async () => {
        try {
            // Dynamically import the library
            const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
            // @ts-ignore
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        } catch (e) {
            console.error("Error setting up PDF.js worker:", e);
        }
    };
    setupPdfWorker();
  }, []);

  const { setValue, watch, setError: setFormError, clearErrors: clearFormErrors } = form;
  const selectedFile = watch('uploadedFile');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileProcessingMessage(null); // Clear previous messages
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("uploadedFile", { type: "size", message: `File size should be less than ${MAX_FILE_SIZE_MB}MB.` });
        setFileNamePreview(null); setValue('uploadedFile', undefined); return;
      }
      // MIME type check is primarily handled by Zod on submit, but can add a quick check here too
      if (!ACCEPTED_MIME_TYPES.includes(file.type) && !file.type.startsWith('text/') && !(file.name.endsWith('.py') || file.name.endsWith('.java'))) {
         // A more lenient check for common script files if browser gives generic MIME like application/octet-stream
         if (!INPUT_ACCEPT_EXTENSIONS.split(',').some(ext => file.name.endsWith(ext.trim()))) {
            setFormError("uploadedFile", { type: "type", message: "Unsupported file type. Check accepted formats." });
            setFileNamePreview(null); setValue('uploadedFile', undefined); return;
         }
      }
      
      setValue('uploadedFile', file, { shouldValidate: true });
      setFileNamePreview(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      clearFormErrors("uploadedFile");
      if (form.getValues("textContent")) {
        toast({ title: "File Selected", description: "Content from the uploaded file will be combined with your pasted text."});
      }
      if (file.type === 'application/msword') {
        setFileProcessingMessage("Note: For .doc files, text extraction might be limited. Converting to .docx or pasting content is recommended for best results.");
      }
    } else {
      setValue('uploadedFile', undefined, { shouldValidate: true });
      setFileNamePreview(null);
    }
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
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


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true); setErrorState(null); setAnalysisResult(null); clearFormErrors(); setFileProcessingMessage(null);
    let submissionText = data.textContent || "";
    let submissionFileName: string | undefined = selectedFile?.name;

    if (data.uploadedFile) {
      submissionFileName = data.uploadedFile.name;
      setFileProcessingMessage(`Processing ${submissionFileName}...`);
      try {
        let fileText = '';
        if (data.uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || data.uploadedFile.name.endsWith('.docx')) {
          fileText = await extractTextFromDocx(data.uploadedFile);
        } else if (data.uploadedFile.type === 'application/pdf') {
          fileText = await extractTextFromPdf(data.uploadedFile);
        } else if (data.uploadedFile.type === 'application/msword' || data.uploadedFile.name.endsWith('.doc')) {
           toast({variant: "default", title: "Notice for .doc file", description: "Attempting text extraction for .doc. For best results, convert to .docx or paste content.", duration: 6000});
           try {
             fileText = await extractTextFromDocx(data.uploadedFile);
           } catch (e) {
             console.warn("Mammoth failed on .doc file, falling back to simple text extraction.", e);
             fileText = await data.uploadedFile.text();
           }
        } else if (ACCEPTED_MIME_TYPES.includes(data.uploadedFile.type) || data.uploadedFile.type.startsWith('text/')) { // other text-based
          fileText = await data.uploadedFile.text();
        } else {
           // Fallback for other accepted types (like scripts if browser gives generic MIME)
           try { fileText = await data.uploadedFile.text(); } catch (e) {
             throw new Error(`Could not read text from ${data.uploadedFile.name}. It might not be a plain text compatible format.`);
           }
        }

        if (submissionText.trim() && fileText.trim()) {
          submissionText += `\n\n--- Content from uploaded file: ${submissionFileName} ---\n${fileText}`;
        } else if (fileText.trim()) {
          submissionText = fileText;
        }
        setFileProcessingMessage(`${submissionFileName} processed.`);
      } catch (e: any) {
        setErrorState(`Failed to read content from ${submissionFileName}: ${e.message || "Please ensure it's a supported file format."}`);
        toast({ variant: "destructive", title: "File Read Error", description: `Could not process ${submissionFileName}. ${e.message}` });
        setIsLoading(false); setFileProcessingMessage(null); return;
      }
    }

    if (submissionText.trim().length < 50) {
      setFormError("textContent", { type: "manual", message: "Combined text content (from input or file) must be at least 50 characters." });
      toast({ variant: "destructive", title: "Input Too Short", description: "Combined text content must be at least 50 characters."});
      setIsLoading(false); setFileProcessingMessage(null); return;
    }
    if (submissionText.trim().length > 30000) {
      setFormError("textContent", { type: "manual", message: "Combined text content is too long (max 30000 characters for AI analysis)." });
      toast({ variant: "destructive", title: "Input Too Long", description: "Combined text content exceeds 30000 characters limit for analysis."});
      setIsLoading(false); setFileProcessingMessage(null); return;
    }

    try {
      const aiInput: CheckOriginalityReportInput = { textContent: submissionText, fileName: submissionFileName };
      const result = await checkOriginalityReport(aiInput);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
    } finally {
      setIsLoading(false);
      setFileProcessingMessage(null);
    }
  };

  const getAssessmentBadgeVariant = (assessment: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (assessment?.toLowerCase()) {
      case "very high": return "destructive";
      case "high": return "destructive";
      case "medium": return "default"; 
      default: return "secondary"; 
    }
  };
  
  const getConfidenceBadgeVariant = (confidence: string | undefined): "default" | "secondary" | "outline" => {
    switch (confidence?.toLowerCase()) {
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline"; 
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck />AI Originality & Content Report</CardTitle>
          <CardDescription>
            Paste text or upload a document (.txt, .md, .docx, .pdf) or common code/script file to analyze its originality, identify potential similarities, and generate a comprehensive report. Max file size: {MAX_FILE_SIZE_MB}MB. 
            For older .doc files, conversion to .docx or pasting text is recommended for best results.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="textContent-input">Paste Text Content</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea id="textContent-input" placeholder="Paste the text you want to analyze here..." className="min-h-[150px] resize-y pr-10" {...field} />
                      </FormControl>
                      <Button type="button" variant="ghost" size="icon" onClick={() => toast({ title: "Voice Input", description: "Voice input for text content coming soon!" })} aria-label="Use voice input" className="absolute right-1 top-1.5 text-muted-foreground hover:text-foreground">
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
                    <FormLabel htmlFor="uploadedFile-originality">Or Upload a Supported File</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input 
                          id="uploadedFile-originality" 
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
                      <Alert variant="default" className="mt-2 text-sm">
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
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>) : 'Generate Originality Report'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {errorState && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info />Originality Report Details</CardTitle>
            <CardDescription>File Analyzed: {form.getValues('uploadedFile')?.name || (form.getValues('textContent') ? 'Pasted Content' : 'N/A')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2"><Percent className="h-5 w-5 text-primary"/>Originality Score</CardTitle>
                    <div className="text-4xl font-bold text-primary">{analysisResult.originalityScore}%</div>
                    <Progress value={analysisResult.originalityScore} className="mt-2 h-3" />
                </Card>
                 <Card className="p-4">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2"><FileQuestion className="h-5 w-5 text-primary"/>Plagiarism Assessment</CardTitle>
                    <Badge variant={getAssessmentBadgeVariant(analysisResult.plagiarismAssessment)} className="text-xl px-3 py-1">{analysisResult.plagiarismAssessment} Risk</Badge>
                </Card>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/>Assessment Summary</h3>
              <Alert variant="default" className="bg-muted/30 border-muted-foreground/20">
                <AlertDescription className="whitespace-pre-wrap">{analysisResult.assessmentSummary}</AlertDescription>
              </Alert>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><SearchCheck className="h-5 w-5 text-primary"/>Potential Similar Segments</h3>
              {analysisResult.similarSegments && analysisResult.similarSegments.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {analysisResult.similarSegments.map((item, index) => (
                    <AccordionItem value={`segment-${index}`} key={`segment-${index}`}>
                      <AccordionTrigger className="hover:no-underline text-left">
                        <span className="truncate pr-2 flex-1">{item.segment}</span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 bg-muted/20 p-4 rounded-md">
                        <p className="text-sm"><strong className="font-medium">Explanation:</strong> {item.explanation}</p>
                        {item.potentialSourceType && (
                           <p className="text-xs text-muted-foreground"><strong className="font-medium">Potential Source Type:</strong> {item.potentialSourceType}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No significant similar segments identified based on general knowledge analysis.</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary"/>Overall Summary of Input</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-60 overflow-y-auto">
                <p className="whitespace-pre-wrap">{analysisResult.overallSummary}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Key Themes Identified</h3>
              {analysisResult.keyThemes && analysisResult.keyThemes.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/30">
                  {analysisResult.keyThemes.map((theme, index) => (
                    <Badge key={index} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No specific key themes were distinctly identified.</p>
              )}
            </div>
             <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">AI Confidence in Assessment</h3>
                <Badge variant={getConfidenceBadgeVariant(analysisResult.confidence)} className="text-md px-3 py-1">{analysisResult.confidence}</Badge>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
