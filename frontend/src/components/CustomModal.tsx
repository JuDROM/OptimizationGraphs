// frontend/src/components/CustomModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Modalstyles.css';

interface CustomModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  showInput?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function CustomModal({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  showInput = false,
  onConfirm,
  onCancel,
}: CustomModalProps): React.JSX.Element | null {
  
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      if (showInput) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, defaultValue, showInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInput || value.trim()) {
      onConfirm(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter' && !showInput) {
      onConfirm(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={onCancel}
    >
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {showInput && (
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="modal-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                inputMode="numeric"
              />
            </form>
          )}
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onConfirm(value)}
            disabled={showInput && !value.trim()}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}