
import React from 'react';
import { Enquiry } from '../types';

interface EnquirySummaryProps {
  enquiry: Enquiry;
}

const EnquirySummary: React.FC<EnquirySummaryProps> = ({ enquiry }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
            {enquiry.customer_name}
          </h4>
          <span className="text-[10px] text-slate-400">{enquiry.timestamp}</span>
        </div>
        <div className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-xs">
          <i className="fas fa-file-signature"></i>
        </div>
      </div>
      
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <i className="fas fa-phone-alt w-3 text-slate-400"></i>
          <span>{enquiry.phone_number}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <i className="fas fa-envelope w-3 text-slate-400"></i>
          <span className="truncate">{enquiry.email_address}</span>
        </div>
        {enquiry.product_interest && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <i className="fas fa-tag w-3 text-slate-400"></i>
            <span className="font-semibold text-blue-700">{enquiry.product_interest}</span>
          </div>
        )}
      </div>

      {enquiry.notes && (
        <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-500 italic">
          "{enquiry.notes}"
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1">
          <i className="fas fa-check-circle"></i> Sent to the Posso team
        </span>
        <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider">
          Details
        </button>
      </div>
    </div>
  );
};

export default EnquirySummary;
