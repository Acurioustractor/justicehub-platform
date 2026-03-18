'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (url: string) => void;
  disabled?: boolean;
}

type RecorderState = 'idle' | 'recording' | 'recorded' | 'uploading';

const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('recorded');
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(1000); // Collect data every second
      setState('recording');
      setElapsed(0);

      // Timer
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const ms = Date.now() - start;
        setElapsed(ms);
        if (ms >= MAX_DURATION_MS) {
          recorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 200);
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reRecord = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setState('idle');
    setElapsed(0);
  }, [audioUrl]);

  const uploadAndSubmit = useCallback(async () => {
    if (!chunksRef.current.length) return;
    setState('uploading');
    setError(null);

    try {
      const mimeType = chunksRef.current[0].type || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', blob, `voice-note.${mimeType === 'audio/mp4' ? 'm4a' : 'webm'}`);

      const res = await fetch('/api/contained/stories/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await res.json();
      onRecordingComplete(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setState('recorded');
    }
  }, [onRecordingComplete]);

  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-600 italic">
        Voice recording is not supported on this device.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-500 uppercase tracking-widest font-mono">
        Voice note (optional, max 3 min)
      </label>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 text-sm hover:border-[#DC2626] hover:text-white transition-colors disabled:opacity-30"
        >
          <MicIcon />
          Record voice note
        </button>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#DC2626] text-white text-sm font-bold"
          >
            <span className="w-3 h-3 bg-white rounded-sm" />
            Stop
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            <span className="text-sm font-mono text-gray-300">
              {formatTime(elapsed)} / 3:00
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-[#DC2626] transition-all duration-200"
              style={{ width: `${Math.min((elapsed / MAX_DURATION_MS) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div className="space-y-2">
          <audio src={audioUrl} controls className="w-full h-10" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reRecord}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={uploadAndSubmit}
              className="text-xs text-[#059669] hover:text-[#059669]/80 font-bold transition-colors"
            >
              Attach to story
            </button>
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading voice note...
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
    </svg>
  );
}
