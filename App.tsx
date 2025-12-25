
import React, { useState, useCallback } from 'react';
import VoiceAssistant from './components/VoiceAssistant.tsx';
import { Enquiry } from './types.ts';

const App: React.FC = () => {
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  const handleEnquirySubmitted = useCallback((newEnquiry: Enquiry) => {
    const whatsappNumber = '447867597844';
    setCustomerName(newEnquiry.customer_name);
    
    const messageBody = 
      `*New Sales Enquiry from Posso AI*\n\n` +
      `*Name:* ${newEnquiry.customer_name}\n` +
      `*Phone:* ${newEnquiry.phone_number}\n` +
      `*Email:* ${newEnquiry.email_address}\n` +
      `*Interested In:* ${newEnquiry.product_interest || 'General Info'}\n` +
      `*Notes:* ${newEnquiry.notes || 'No additional notes'}\n\n` +
      `_Sent via Posso AI Assistant_`;

    const encodedMessage = encodeURIComponent(messageBody);
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    setWaUrl(url);
    window.open(url, '_blank');
    
    console.log('Enquiry ready for WhatsApp:', newEnquiry);
  }, []);

  const handleCloseOverlay = () => {
    setWaUrl(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8">
      <div className="w-full max-w-2xl h-[700px] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative">
        
        {/* Branding Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <i className="fas fa-bolt text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">POSSO AI</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200 mt-1">Voice Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Live System</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <VoiceAssistant onEnquiryComplete={handleEnquirySubmitted} />
          
          {/* WhatsApp Success Overlay */}
          {waUrl && (
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Enquiry Ready!</h3>
                  <p className="text-sm text-slate-500 mt-2 font-medium">
                    Please tap the button below to send {customerName}'s enquiry to the Posso team on WhatsApp.
                  </p>
                </div>
                <a 
                  href={waUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handleCloseOverlay}
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-200 transition-all transform active:scale-95 text-lg uppercase tracking-wider ring-4 ring-green-50"
                >
                  Send to WhatsApp
                </a>
                <button 
                  onClick={handleCloseOverlay}
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 py-3 px-8 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leicester, UK</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posso Ltd © 2025</span>
        </div>
      </div>
    </div>
  );
};

export default App;
