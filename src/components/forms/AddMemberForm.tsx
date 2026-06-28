"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function AddMemberForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Sales",
    access: "View-Only"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Invitation sent to ${formData.name}`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-2">
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Rahul Sharma"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold outline-none focus:border-black transition-all"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
          <input 
            required
            type="email" 
            placeholder="rahul@zoieindia.com"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold outline-none focus:border-black transition-all"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Access Permissions</label>
          <div className="grid grid-cols-2 gap-3">
            {['Admin', 'View-Only'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({...formData, access: level})}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  formData.access === level 
                  ? 'bg-black text-white border-black shadow-lg' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-2 bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all"
        >
          Send Invite
        </button>
      </div>
    </form>
  );
}