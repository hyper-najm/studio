
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzePhishingAttempt } from '@/lib/actions';
import type { AnalyzePhishingAttemptOutput, AnalyzePhishingAttemptInput } from '@/ai/flows/analyze-phishing-attempt';
import { Loader2, ShieldAlert, ShieldCheck, AlertTriangle, Upload, Mic, FileText } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_TEXT_FILE_TYPES = ['text/plain', 'text/html', 'message/rfc822']; // .eml for message/rfc822
const ALL_ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_TEXT_FILE_TYPES];


const formSchema = z.object({
  content: z.string().max(5000, {message: "Text content is too long (max 5000 characters)."}).optional(),
  uploadedFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid file.",
  })
  .refine(file => file ? file.size <= MAX_FILE_SIZE_BYTES : true, `File size should be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(file => file ? ALL_ACCEPTED_FILE_TYPES.includes(file.type) : true, "Unsupported file type. Please upload an image (JPEG, PNG, GIF, WEBP) or a text-based file (TXT, HTML, EML).")
  .optional(),
}).refine(data => (data.content && data.content.trim().length >= 10) || data.uploadedFile, {
  message: "Please provide text content (min 10 characters in textarea), or upload a file to analyze.",
  path: ["content"], 
});

type FormData = z.infer<typeof formSchema>;

export default function PhishingAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhishingAttemptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null); // Renamed from uploadedImagePreview
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      uploadedFile: undefined, // Renamed from imageFile
    },
  });

  const { setValue, watch, clearErrors: clearFormErrors, setError: setFormError } = form;
  const selectedFile = watch('uploadedFile'); // Renamed from selectedImageFile

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ALL_ACCEPTED_FILE_TYPES.includes(file.type)) {
        setFormError("uploadedFile", { type: "type", message: "Unsupported file type. Please upload an image or a text-based file (TXT, HTML, EML)." });
        setFilePreview(null);
        setValue('uploadedFile', undefined);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError("uploadedFile", { type: "size", message: `File size should be less than ${MAX_FILE_SIZE_MB}MB.` });
        setFilePreview(null);
        setValue('uploadedFile', undefined);
        return;
      }
      setValue('uploadedFile', file, { shouldValidate: true });
      
      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (ACCEPTED_TEXT_FILE_TYPES.includes(file.type)) {
        setFilePreview(file.name); // Show filename as preview for text files
      } else {
        setFilePreview(null); // Should not happen due to earlier validation
      }
      clearFormErrors("uploadedFile");
    } else {
      setValue('uploadedFile', undefined, { shouldValidate: true });
      setFilePreview(null);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorState(null);
    setAnalysisResult(null);
    clearFormErrors();

    try {
      const { content: textContentFromForm, uploadedFile } = data;
      let submissionContent = textContentFromForm || "";
      let submissionImageDataUri: string | undefined = undefined;

      if (uploadedFile) {
        if (ACCEPTED_IMAGE_TYPES.includes(uploadedFile.type)) {
          submissionImageDataUri = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(uploadedFile);
          });
        } else if (ACCEPTED_TEXT_FILE_TYPES.includes(uploadedFile.type)) {
          const textFromFile = await uploadedFile.text();
          if (submissionContent && textFromFile) {
            submissionContent += `\n\n--- Uploaded File Content (${uploadedFile.name}) ---\n${textFromFile}`;
          } else if (textFromFile) {
            submissionContent = textFromFile;
          }
        }
      }
      
      // Final validation before sending to AI
      if (!submissionImageDataUri && (!submissionContent || submissionContent.trim().length < 10)) {
        setFormError("content", { type: "manual", message: "Text content (from textarea or file) must be at least 10 characters if no image is provided." });
        toast({ variant: "destructive", title: "Input Required", description: "Text content (from textarea or file) must be at least 10 characters if no image is provided."});
        setIsLoading(false);
        return;
      }
       if (!submissionContent && !submissionImageDataUri) {
         // This case should ideally be caught by formSchema.refine, but as a safeguard:
        toast({ variant: "destructive", title: "Input Required", description: "Please provide text content or upload a file."});
        setIsLoading(false);
        return;
      }


      const aiInput: AnalyzePhishingAttemptInput = {
        content: submissionContent.trim() ? submissionContent.trim() : undefined,
        imageDataUri: submissionImageDataUri,
      };

      const result = await analyzePhishingAttempt(aiInput);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert />Advanced Input Analyzer</CardTitle>
          <CardDescription>
            Submit URLs, text snippets, email content, or upload an image/text file (e.g., screenshot, .txt, .eml) for in-depth phishing analysis and educational feedback.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="content-input">Text Content (URL, Email Snippet, etc.)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          id="content-input"
                          placeholder="Paste URL, email body, or text snippet here... If uploading a text file, its content will be appended."
                          className="min-h-[120px] resize-y pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toast({ title: "Voice Input", description: "Voice input feature coming soon!" })}
                        aria-label="Use voice input for text content"
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
                name="uploadedFile" // Renamed from imageFile
                render={() => ( 
                  <FormItem>
                    <FormLabel htmlFor="uploadedFile-input">Upload File (Image or Text)</FormLabel>
                     <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          id="uploadedFile-input"
                          type="file"
                          accept={ALL_ACCEPTED_FILE_TYPES.join(',')}
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {filePreview && selectedFile && ( // Check selectedFile to ensure preview corresponds to current file
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">File Preview:</p>
                  {ACCEPTED_IMAGE_TYPES.includes(selectedFile.type) ? (
                    <Image src={filePreview} alt="Uploaded image preview" width={200} height={100} className="rounded-md border object-contain max-h-48" />
                  ) : ACCEPTED_TEXT_FILE_TYPES.includes(selectedFile.type) ? (
                    <div className="p-3 border rounded-md bg-muted text-sm flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" /> 
                      <span>{filePreview} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Content'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {errorState && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{errorState}</AlertDescription> 
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {analysisResult.riskScore > 70 ? <ShieldAlert className="text-destructive" /> : analysisResult.riskScore > 40 ? <ShieldAlert className="text-yellow-500" /> : <ShieldCheck className="text-green-500" />}
              Comprehensive Analysis Report
            </CardTitle>
            <CardDescription>Detailed results and educational insights from the phishing analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Risk Score: {analysisResult.riskScore}/100</h3>
              <Progress value={analysisResult.riskScore} className={
                analysisResult.riskScore > 70 ? "h-3 [&>div]:bg-destructive" :
                analysisResult.riskScore > 40 ? "h-3 [&>div]:bg-yellow-500" :
                "h-3 [&>div]:bg-green-500"
              } />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Threats Identified:</h3>
              {analysisResult.threatsIdentified.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 rounded-md border p-3 bg-muted/30 text-sm">
                  {analysisResult.threatsIdentified.map((threat, index) => (
                    <li key={index} className="text-sm">{threat}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground p-3 rounded-md border bg-muted/30">No specific threats identified.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Explanation & Recommendations:</h3>
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap">{analysisResult.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
