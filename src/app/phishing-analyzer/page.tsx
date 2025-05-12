
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
import { Loader2, ShieldAlert, ShieldCheck, AlertTriangle, Upload, Mic } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];


const formSchema = z.object({
  content: z.string().min(10, { message: 'Text content must be at least 10 characters long if provided.' }).max(5000, {message: "Text content is too long."}).optional(),
  imageFile: z.custom<File | undefined>((val) => typeof window === 'undefined' || val === undefined || val instanceof File, {
    message: "Invalid image file.",
  })
  .refine(file => file ? file.size <= MAX_IMAGE_SIZE_BYTES : true, `Image size should be less than ${MAX_IMAGE_SIZE_MB}MB.`)
  .refine(file => file ? ACCEPTED_IMAGE_TYPES.includes(file.type) : true, "Unsupported image type. Please upload JPEG, PNG, GIF, or WEBP.")
  .optional(),
}).refine(data => data.content || data.imageFile, {
  message: "Please provide text content (URL, email body) or upload an image to analyze.",
  path: ["content"], 
});

type FormData = z.infer<typeof formSchema>;

export default function PhishingAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhishingAttemptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      imageFile: undefined,
    },
  });

  const { setValue, watch } = form;
  const selectedImageFile = watch('imageFile');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("imageFile", { type: "type", message: "Unsupported image type. Please upload JPEG, PNG, GIF, or WEBP." });
        setUploadedImagePreview(null);
        setValue('imageFile', undefined);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        form.setError("imageFile", { type: "size", message: `Image size should be less than ${MAX_IMAGE_SIZE_MB}MB.` });
        setUploadedImagePreview(null);
        setValue('imageFile', undefined);
        return;
      }
      setValue('imageFile', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.clearErrors("imageFile");
    } else {
      setValue('imageFile', undefined, { shouldValidate: true });
      setUploadedImagePreview(null);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    form.clearErrors();

    try {
      const { content, imageFile } = data;
      let submissionImageDataUri: string | undefined = undefined;

      if (imageFile) {
        submissionImageDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(imageFile);
        });
      }
      
      if (!content && !submissionImageDataUri) {
        toast({ variant: "destructive", title: "Input Required", description: "Please provide text content or upload an image."});
        setIsLoading(false);
        return;
      }


      const aiInput: AnalyzePhishingAttemptInput = {
        content: content || undefined,
        imageDataUri: submissionImageDataUri,
      };

      const result = await analyzePhishingAttempt(aiInput);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
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
            Submit URLs, text snippets, email content, or upload an image (e.g., screenshot of a suspicious message) for in-depth phishing analysis and educational feedback.
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
                          placeholder="Paste URL, email body, or text snippet here..."
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
                name="imageFile"
                render={({ field }) => ( // field is not directly used for input type="file" by RHF in the same way, but important for context
                  <FormItem>
                    <FormLabel htmlFor="imageFile-input">Upload Image (Optional Screenshot)</FormLabel>
                     <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          id="imageFile-input"
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          ref={fileInputRef}
                          onChange={handleFileChange} // Use custom handler
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                        />
                      </FormControl>
                      {/* Placeholder for potential future voice command for file upload if needed */}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {uploadedImagePreview && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Image Preview:</p>
                  <Image src={uploadedImagePreview} alt="Uploaded preview" width={200} height={100} className="rounded-md border object-contain max-h-48" />
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

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
              <div className="p-3 rounded-md border bg-muted/30 text-sm max-h-96 overflow-y-auto"> {/* Increased max-h */}
                <p className="whitespace-pre-wrap">{analysisResult.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

```