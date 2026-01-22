import React from 'react';
import './Toast.css';

function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert" onClick={onClose}>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
