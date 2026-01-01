import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import SessionManager from '../../utils/sessionManager';

interface SessionStatusProps {
  className?: string;
}

const SessionStatus: React.FC<SessionStatusProps> = ({ className = '' }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [sessionManager] = useState(() => SessionManager.getInstance());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRemainingTime(0);
      return;
    }

    const updateRemainingTime = () => {
      const time = sessionManager.getRemainingTime();
      setRemainingTime(time);
    };

    // Update immediately
    updateRemainingTime();

    // Update every 30 seconds
    const interval = setInterval(updateRemainingTime, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, sessionManager]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (): string => {
    const minutes = Math.floor(remainingTime / 60000);
    if (minutes <= 5) return 'text-red-600';
    if (minutes <= 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${remainingTime > 300000 ? 'bg-green-500' : remainingTime > 60000 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-600">Session:</span>
        <span className={`font-medium ${getStatusColor()}`}>
          {formatTime(remainingTime)}
        </span>
      </div>
    </div>
  );
};

export default SessionStatus;
