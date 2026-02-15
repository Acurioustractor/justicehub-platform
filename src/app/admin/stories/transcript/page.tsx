'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, Sparkles, FileText, User, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ExtractedData {
  quotes: Array<{
    text: string;
    theme: string;
    context: string;
    strength: string;
  }>;
  themes: Array<{
    name: string;
    description: string;
    quote_examples: string[];
  }>;
  case_studies: Array<{
    title: string;
    description: string;
    key_points: string[];
    quotes: string[];
  }>;
}

export default function TranscriptToStoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    storytellerName: '',
    storytellerContact: '',
    interviewDate: '',
    transcript: '',
  });
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string>('');

  const wordCount = formData.transcript.split(/\s+/).filter(Boolean).length;
  const charCount = formData.transcript.length;

  const handleExtract = async () => {
    if (wordCount < 50) {
      setError('Transcript must be at least 50 words. Currently: ' + wordCount + ' words.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/stories/extract-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: formData.transcript,
          storytellerName: formData.storytellerName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      if (data.success) {
        setExtractedData(data.data);
        console.log('✅ Extracted data:', data.stats);
      } else {
        throw new Error('Extraction failed');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to extract quotes. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateStory = () => {
    // Store extracted data in localStorage for the editor
    const storyData = {
      storytellerName: formData.storytellerName,
      storytellerContact: formData.storytellerContact,
      interviewDate: formData.interviewDate,
      quotes: extractedData?.quotes || [],
      themes: extractedData?.themes || [],
      case_studies: extractedData?.case_studies || []
    };

    localStorage.setItem('extracted_story_data', JSON.stringify(storyData));

    // Navigate to story editor with flag
    router.push('/admin/stories/new?from=transcript');
  };

  const handleReset = () => {
    setExtractedData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <Link
            href="/admin/stories"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-black text-black mb-2">
              Create Story from Transcript
            </h1>
            <p className="text-lg text-gray-600">
              AI will extract quotes, themes, and case studies from your interview transcript
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 text-red-900">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!extractedData ? (
            /* STEP 1: Input Form */
            <div className="space-y-6">
              {/* Storyteller Information */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Storyteller Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Storyteller Name *
                    </label>
                    <input
                      type="text"
                      value={formData.storytellerName}
                      onChange={(e) => setFormData({ ...formData, storytellerName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact (Email or Phone) *
                    </label>
                    <input
                      type="text"
                      value={formData.storytellerContact}
                      onChange={(e) => setFormData({ ...formData, storytellerContact: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="email@example.com or +1234567890"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      We'll use this to send the story for their review and approval
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Interview Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.interviewDate}
                      onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Transcript Input */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Interview Transcript
                </h2>

                <p className="text-sm text-gray-600 mb-4">
                  Paste the interview transcript below. AI will analyze it and extract:
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-1 list-disc list-inside">
                  <li>15-20 powerful quotes organized by theme</li>
                  <li>5-7 key themes from the conversation</li>
                  <li>3-5 case studies or specific examples</li>
                </ul>

                <textarea
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  rows={20}
                  placeholder="Paste transcript here...

Example:
Interviewer: Tell me about your work with young people.

Storyteller: I've been doing this for 20 years now. Twenty years. And you know what? I've had 25 young fellas come through my house..."
                />

                <div className="flex justify-between items-center mt-3 text-sm">
                  <span className="text-gray-600">
                    {wordCount} words • {charCount} characters
                  </span>
                  <span className={`font-bold ${wordCount >= 200 ? 'text-green-600' : 'text-gray-400'}`}>
                    {wordCount >= 200 ? '✓ Good length' : 'At least 200 words recommended'}
                  </span>
                </div>
              </div>

              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={!formData.storytellerName || !formData.storytellerContact || !formData.transcript || processing}
                className="w-full px-8 py-4 bg-black text-white font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {processing ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    Extracting with AI... (30-60 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Extract Quotes & Themes with AI
                  </>
                )}
              </button>

              {processing && (
                <div className="p-4 bg-blue-50 border-2 border-blue-300 text-sm text-blue-900">
                  <p className="font-bold mb-1">⏳ AI is analyzing the transcript...</p>
                  <p>This usually takes 30-60 seconds. Please wait.</p>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Display Extracted Data */
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-6 bg-green-50 border-2 border-green-500 text-green-900">
                <h3 className="text-xl font-bold mb-2">✨ Extraction Complete!</h3>
                <p>
                  Found <strong>{extractedData.quotes?.length || 0} quotes</strong>,{' '}
                  <strong>{extractedData.themes?.length || 0} themes</strong>, and{' '}
                  <strong>{extractedData.case_studies?.length || 0} case studies</strong>
                </p>
              </div>

              {/* Extracted Quotes */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  💬 Extracted Quotes ({extractedData.quotes?.length || 0})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {extractedData.quotes?.map((quote, i) => (
                    <div key={i} className="p-4 bg-gray-50 border-l-4 border-black hover:bg-gray-100 transition-colors">
                      <p className="font-medium text-lg mb-2">"{quote.text}"</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold">
                          {quote.theme}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 italic">{quote.strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Themes */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  🎯 Key Themes ({extractedData.themes?.length || 0})
                </h2>
                <div className="space-y-4">
                  {extractedData.themes?.map((theme, i) => (
                    <div key={i} className="p-4 bg-blue-50 border-2 border-blue-300">
                      <h3 className="font-bold text-lg mb-2">{theme.name}</h3>
                      <p className="text-sm text-gray-700 mb-3">{theme.description}</p>
                      {theme.quote_examples && theme.quote_examples.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-blue-400">
                          <p className="text-xs font-bold text-blue-800 mb-1">Example quotes:</p>
                          {theme.quote_examples.slice(0, 2).map((ex, j) => (
                            <p key={j} className="text-xs text-gray-600 italic">
                              "{ex.substring(0, 100)}{ex.length > 100 ? '...' : ''}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Studies */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                <h2 className="text-2xl font-bold text-black mb-4">
                  📖 Case Studies ({extractedData.case_studies?.length || 0})
                </h2>
                <div className="space-y-4">
                  {extractedData.case_studies?.map((cs, i) => (
                    <div key={i} className="p-4 bg-green-50 border-2 border-green-300">
                      <h3 className="font-bold text-lg mb-2">{cs.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{cs.description}</p>
                      {cs.key_points && cs.key_points.length > 0 && (
                        <ul className="text-sm space-y-1 ml-4">
                          {cs.key_points.map((point, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-green-600">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  ← Back to Edit Transcript
                </button>
                <button
                  onClick={handleCreateStory}
                  className="flex-1 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Story with These Quotes →
                </button>
              </div>

              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 text-sm text-yellow-900">
                <p className="font-bold mb-1">📝 Next Step:</p>
                <p>
                  Click "Create Story" to open the rich text editor pre-filled with these quotes.
                  You'll be able to add narrative, images, and refine the structure before publishing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
