import React from 'react';
import Toast from './Toast';
import './Toast.css';

function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} type={t.type} message={t.message} onClose={() => onClose(t.id)} />)
      )}
    </div>
  );
}

export default ToastContainer;
