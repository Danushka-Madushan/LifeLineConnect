import React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-xl border border-surface-container">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold hover:bg-surface-container">Cancel</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="px-4 py-2 bg-error text-white rounded-lg font-bold hover:bg-error/90">Confirm</button>
        </div>
      </div>
    </div>
  );
};
