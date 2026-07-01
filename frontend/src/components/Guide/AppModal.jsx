/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MODAL_META = {
  success: {
    icon: 'check_circle',
    iconClass: 'text-emerald-600',
    ringClass: 'bg-emerald-50 ring-emerald-100',
    borderClass: 'border-emerald-200',
    shadowClass: 'shadow-emerald-100',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200',
  },
  error: {
    icon: 'cancel',
    iconClass: 'text-rose-600',
    ringClass: 'bg-rose-50 ring-rose-100',
    borderClass: 'border-rose-200',
    shadowClass: 'shadow-rose-100',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-200',
  },
  warning: {
    icon: 'warning',
    iconClass: 'text-amber-600',
    ringClass: 'bg-amber-50 ring-amber-100',
    borderClass: 'border-amber-200',
    shadowClass: 'shadow-amber-100',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-200',
  },
};

const AppModalView = ({ modal, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const closeWithAnimation = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!modal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        closeWithAnimation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modal, closeWithAnimation]);

  if (!modal) return null;

  const type = modal.type || 'success';
  const meta = MODAL_META[type] || MODAL_META.success;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-on-background/35 px-4 backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={closeWithAnimation}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border ${meta.borderClass} bg-surface-container-lowest p-7 text-center text-on-surface shadow-2xl ${meta.shadowClass} transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0 translate-y-2' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ring-1 ${meta.ringClass}`}>
          <span className={`material-symbols-outlined text-[56px] ${meta.iconClass}`}>
            {meta.icon}
          </span>
        </div>

        <p className="whitespace-pre-line text-base font-semibold leading-7 text-on-surface">
          {modal.message}
        </p>

        <button
          type="button"
          onClick={closeWithAnimation}
          className={`mt-7 min-w-28 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 active:scale-95 ${meta.buttonClass}`}
          autoFocus
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

const AppModal = AppModalView;

export const useAppModal = () => {
  const [modal, setModal] = useState(null);

  const showModal = useCallback((message, type = 'success') => {
    setModal({ message, type });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const Modal = useCallback(() => (
    <AppModalView modal={modal} onClose={closeModal} />
  ), [modal, closeModal]);

  return { showModal, AppModal: Modal };
};

export default AppModal;
