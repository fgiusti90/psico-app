// src/components/Modal.tsx
'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-stone-400 hover:text-stone-600 leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
