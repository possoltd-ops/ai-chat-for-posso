
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionStatus, TranscriptionItem, Enquiry } from '../types.ts';
import { decode, decodeAudioData, createAudioBlob } from '../utils/audioUtils.ts';
import { SYSTEM_INSTRUCTION, ENQUIRY_TOOL } from '../constants.ts';

interface VoiceAssistantProps {
  onEnquiryComplete: (enquiry: Enquiry) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onEnquiryComplete }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptListRef = useRef<HTMLDivElement>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Scroll transcription list to bottom
  useEffect(() => {
    if (transcriptListRef.current) {
      transcriptListRef.current.scrollTo({
        top: transcriptListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcriptions]);

  const addTranscription = (type: 'user' | 'assistant', text: string) => {
    setTranscriptions(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setTranscriptions(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], feedback: type };
      }
      return next;
    });
    console.log(`Feedback ${type} for message index ${index}`);
  };

  const stopAudioOutput = () => {
    sourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const cleanup = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    stopAudioOutput();
    setIsRecording(false);
    setStatus(ConnectionStatus.DISCONNECTED);
  };

  const startConnection = async () => {
    try {
      cleanup();
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            setIsRecording(true);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscriptionRef.current) {
                addTranscription('user', currentInputTranscriptionRef.current);
                currentInputTranscriptionRef.current = '';
              }
              if (currentOutputTranscriptionRef.current) {
                addTranscription('assistant', currentOutputTranscriptionRef.current);
                currentOutputTranscriptionRef.current = '';
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              stopAudioOutput();
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'open_enquiry_form') {
                  const enquiry: Enquiry = {
                    ...fc.args as any,
                    timestamp: new Date().toLocaleTimeString()
                  };
                  onEnquiryComplete(enquiry);
                  
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "ok, enquiry opened successfully" }
                      }
                    });
                  });
                }
              }
            }
          },
          onerror: (e) => {
            console.error('Gemini Error:', e);
            setError('Connection error occurred.');
            cleanup();
          },
          onclose: () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            setIsRecording(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [ENQUIRY_TOOL] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Could not access microphone or connect to AI.');
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const handleToggle = () => {
    if (status === ConnectionStatus.CONNECTED) {
      cleanup();
    } else {
      startConnection();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Transcript Area */}
      <div 
        ref={transcriptListRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
      >
        {transcriptions.length === 0 && status === ConnectionStatus.DISCONNECTED && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
              <i className="fas fa-microphone text-4xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-700">How can I help you today?</h3>
              <p className="text-sm max-w-[280px] mx-auto leading-relaxed">
                Tap the button below to start talking about our tech solutions.
              </p>
            </div>
          </div>
        )}

        {status === ConnectionStatus.CONNECTING && (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waking up Posso AI...</span>
            </div>
          </div>
        )}

        {transcriptions.map((t, i) => (
          <div key={i} className={`flex flex-col ${t.type === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm relative ${
              t.type === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-[15px] leading-relaxed font-medium">{t.text}</p>
              <span className={`text-[10px] mt-2 block opacity-40 text-right font-bold uppercase tracking-tighter`}>
                {t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {t.type === 'assistant' && (
              <div className="flex items-center gap-1 mt-1.5 ml-1">
                <button 
                  onClick={() => handleFeedback(i, 'up')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    t.feedback === 'up' 
                      ? 'bg-blue-100 text-blue-600 scale-110 shadow-sm' 
                      : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'
                  }`}
                  title="Helpful"
                >
                  <i className={`${t.feedback === 'up' ? 'fas' : 'far'} fa-thumbs-up text-[11px]`}></i>
                </button>
                <button 
                  onClick={() => handleFeedback(i, 'down')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    t.feedback === 'down' 
                      ? 'bg-red-100 text-red-600 scale-110 shadow-sm' 
                      : 'text-slate-300 hover:text-red-500 hover:bg-slate-100'
                  }`}
                  title="Not helpful"
                >
                  <i className={`${t.feedback === 'down' ? 'fas' : 'far'} fa-thumbs-down text-[11px]`}></i>
                </button>
                {t.feedback && (
                  <span className="text-[10px] font-bold text-slate-400 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
                    Thanks for your feedback!
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        
        {status === ConnectionStatus.CONNECTED && (
          <div className="flex justify-start">
             <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-3xl rounded-tl-none px-6 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex items-end gap-1 h-5">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-blue-500 rounded-full animate-pulse" 
                      style={{ 
                        height: `${30 + Math.random() * 70}%`,
                        animationDelay: `${i * 0.15}s`
                      }}
                    ></div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listening</span>
             </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-8 mb-4 bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
          <i className="fas fa-exclamation-triangle"></i>
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-8 pt-4 flex items-center justify-center relative">
        <button
          onClick={handleToggle}
          className={`group relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
            status === ConnectionStatus.CONNECTED 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-200 ring-8 ring-red-50' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-2'
          }`}
        >
          {status === ConnectionStatus.CONNECTED ? (
            <i className="fas fa-square text-white text-3xl"></i>
          ) : (
            <i className="fas fa-microphone text-white text-4xl"></i>
          )}
          
          {status === ConnectionStatus.CONNECTED && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></div>
              <div className="absolute inset-[-15px] rounded-full border-2 border-red-200 opacity-20 animate-pulse-custom"></div>
            </>
          )}
        </button>

        <div className="absolute right-12 text-slate-300 flex flex-col items-end pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Status</span>
          <span className={`text-xs font-black uppercase tracking-widest ${status === ConnectionStatus.CONNECTED ? 'text-green-500' : 'text-slate-400'}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
