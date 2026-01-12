'use client';

/**
 * AI-Assisted Blog Post Creation with Human Verification
 *
 * This is a demo of the full workflow:
 * 1. User describes what they want to write about
 * 2. AI generates content
 * 3. Human reviews and verifies with VerificationPanel
 * 4. Approved content is saved to database
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2, ChevronRight } from 'lucide-react';
import { VerificationPanel } from '@/components/ai/VerificationPanel';

export default function AIAssistedBlogPage() {
  const router = useRouter();
  const [step, setStep] = useState<'prompt' | 'generating' | 'verifying' | 'done'>('prompt');
  const [promptData, setPromptData] = useState({
    topic: '',
    angle: '',
    targetAudience: '',
    tone: 'hopeful' as 'hopeful' | 'urgent' | 'informative' | 'celebratory',
    length: 'medium' as 'short' | 'medium' | 'long',
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationError, setGenerationError] = useState('');

  // Generate content with AI
  const handleGenerate = async () => {
    setStep('generating');
    setGenerationError('');

    try {
      // Build comprehensive prompt
      const prompt = buildPrompt(promptData);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'blog_article',
          project: 'justicehub',
          maxTokens: promptData.length === 'short' ? 300 : promptData.length === 'medium' ? 500 : 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('AI generation failed');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setStep('verifying');

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError('Failed to generate content. Please try again.');
      setStep('prompt');
    }
  };

  // Handle successful verification
  const handleVerified = async (feedback: any) => {
    // At this point, verification is saved to database
    // User can now copy the content to the full blog editor
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog Posts
            </Link>
            <h1 className="text-4xl font-black text-black mb-2">
              AI-Assisted Story Writing
            </h1>
            <p className="text-lg text-gray-600">
              Describe what you want to write about and let AI help you draft it
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center gap-4">
            <Step number={1} label="Describe" active={step === 'prompt'} completed={step !== 'prompt'} />
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <Step number={2} label="Generate" active={step === 'generating'} completed={step === 'verifying' || step === 'done'} />
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <Step number={3} label="Verify" active={step === 'verifying'} completed={step === 'done'} />
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <Step number={4} label="Publish" active={step === 'done'} completed={false} />
          </div>

          {/* Step 1: Prompt */}
          {step === 'prompt' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-bold mb-6">What do you want to write about?</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Topic or Story *
                  </label>
                  <input
                    type="text"
                    value={promptData.topic}
                    onChange={(e) => setPromptData({ ...promptData, topic: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Youth mentorship program success story"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Specific Angle or Focus
                  </label>
                  <textarea
                    value={promptData.angle}
                    onChange={(e) => setPromptData({ ...promptData, angle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="e.g., Focus on how peer support changed outcomes for young people..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={promptData.targetAudience}
                    onChange={(e) => setPromptData({ ...promptData, targetAudience: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Service providers, families, policymakers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Tone
                    </label>
                    <select
                      value={promptData.tone}
                      onChange={(e) => setPromptData({ ...promptData, tone: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hopeful">Hopeful & Inspiring</option>
                      <option value="urgent">Urgent & Call-to-Action</option>
                      <option value="informative">Informative & Educational</option>
                      <option value="celebratory">Celebratory & Appreciative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Length
                    </label>
                    <select
                      value={promptData.length}
                      onChange={(e) => setPromptData({ ...promptData, length: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="short">Short (~300 words)</option>
                      <option value="medium">Medium (~500 words)</option>
                      <option value="long">Long (~800 words)</option>
                    </select>
                  </div>
                </div>

                {generationError && (
                  <div className="p-4 bg-red-50 border-2 border-red-300 text-red-800">
                    {generationError}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!promptData.topic}
                  className="w-full px-6 py-4 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Article with AI
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Generating your article...</h2>
              <p className="text-gray-600">This usually takes 5-10 seconds</p>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 'verifying' && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2">✨ AI Draft Generated!</h3>
                <p className="text-sm text-blue-800">
                  Please review the content below and score it on brand voice, cultural safety,
                  factual accuracy, community voice, and overall quality. You can edit the text
                  directly before approving.
                </p>
              </div>

              <VerificationPanel
                generatedContent={generatedContent}
                contentType="blog_article"
                projectSlug="justicehub"
                onVerified={handleVerified}
                requireElderReview={false}
              />
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-4">Verification Complete!</h2>
              <p className="text-gray-600 mb-8">
                Your feedback has been saved and will help improve the AI over time.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setStep('prompt');
                    setPromptData({
                      topic: '',
                      angle: '',
                      targetAudience: '',
                      tone: 'hopeful',
                      length: 'medium',
                    });
                    setGeneratedContent('');
                  }}
                  className="px-6 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100"
                >
                  Write Another Article
                </button>
                <Link
                  href="/admin/blog/new"
                  className="px-6 py-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800"
                >
                  Go to Full Editor
                </Link>
              </div>

              <div className="mt-8 p-4 bg-gray-50 border-2 border-gray-300 text-left">
                <h4 className="font-bold mb-2">Next Steps:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Your verification was saved to the database</li>
                  <li>• High-quality verified content will be used to fine-tune the AI</li>
                  <li>• You can view all verifications in the admin dashboard</li>
                  <li>• To publish, copy the content to the full blog editor</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Progress step component
function Step({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
        ${completed ? 'bg-green-600 text-white' : active ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}
      `}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm font-bold ${active ? 'text-black' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// Build comprehensive prompt from user input
function buildPrompt(data: typeof promptData) {
  let prompt = `Write a blog article for JusticeHub about: ${data.topic}\n\n`;

  if (data.angle) {
    prompt += `Focus on: ${data.angle}\n\n`;
  }

  if (data.targetAudience) {
    prompt += `Target audience: ${data.targetAudience}\n\n`;
  }

  const toneGuidance = {
    hopeful: 'Use a hopeful, inspiring tone that emphasizes possibility and community strength.',
    urgent: 'Use an urgent tone that calls readers to action while remaining respectful.',
    informative: 'Use a clear, informative tone that educates without being preachy.',
    celebratory: 'Use a warm, celebratory tone that honors achievements and contributions.',
  };

  prompt += `Tone: ${toneGuidance[data.tone]}\n\n`;

  prompt += `Write in ACT's brand voice: grounded yet visionary, humble yet confident, warm yet challenging. `;
  prompt += `Start with a specific community story or example, then explore broader themes. `;
  prompt += `Center community voices, not institutional perspectives. `;
  prompt += `Use thoughtful farm metaphors where natural. `;
  prompt += `Keep it conversational but thoughtful.`;

  return prompt;
}
