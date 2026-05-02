import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="w-[36px] h-[36px] rounded-lg bg-accent/20 flex items-center justify-center">
        <span className="text-accent text-lg font-bold font-mono">H</span>
      </div>
      <div className="font-mono text-4xl font-bold text-primary">404</div>
      <p className="text-sm text-secondary">Page not found</p>
      <p className="text-xs text-tertiary max-w-[320px]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/campaigns')}
        className="btn-primary text-xs mt-2"
      >
        <ArrowLeft size={13} />
        Back to Campaign Engine
      </button>
    </div>
  );
}
