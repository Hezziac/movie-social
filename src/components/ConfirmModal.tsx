/** [ConfirmModal.tsx]
 * * A reusable, high-priority warning modal for destructive actions.
 * * Note on AI Usage: 
 * - **UX Design**: AI helped style the "Danger Zone" aesthetic with red 
 * borders and a higher z-index to ensure it captures user attention on mobile.
 */
import { WarningAmber, Close } from "@mui/icons-material";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-gray-900 border-2 border-red-500/20 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
      <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <Close fontSize="small" />
        </button>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <WarningAmber className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Confirm Delete
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-800 text-gray-300 font-bold py-3 rounded-xl hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};