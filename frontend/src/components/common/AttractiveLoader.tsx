import React from 'react';

interface AttractiveLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'fullscreen';
}

const AttractiveLoader: React.FC<AttractiveLoaderProps> = ({ 
  message = "Loading...", 
  size = 'md',
  variant = 'default'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-60 h-60';
      case 'lg':
        return 'w-80 h-80';
      default:
        return 'w-40 h-40';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-2xl';
    }
  };

  const AnimatedLoader = () => (
    <>
      <style>{`
        @keyframes dashArray {
          0% {
            stroke-dasharray: 0 1 359 0;
          }
          50% {
            stroke-dasharray: 0 359 1 0;
          }
          100% {
            stroke-dasharray: 359 1 0 0;
          }
        }
        
        @keyframes spinDashArray {
          0% {
            stroke-dasharray: 270 90;
          }
          50% {
            stroke-dasharray: 0 360;
          }
          100% {
            stroke-dasharray: 270 90;
          }
        }
        
        @keyframes dashOffset {
          0% {
            stroke-dashoffset: 365;
          }
          100% {
            stroke-dashoffset: 5;
          }
        }
        
        @keyframes spin {
          0% {
            rotate: 0deg;
          }
          12.5%, 25% {
            rotate: 270deg;
          }
          37.5%, 50% {
            rotate: 540deg;
          }
          62.5%, 75% {
            rotate: 810deg;
          }
          87.5%, 100% {
            rotate: 1080deg;
          }
        }
        
        .dash {
          animation: dashArray 2s ease-in-out infinite,
            dashOffset 2s linear infinite;
        }
        
        .spin-loader {
          animation: spinDashArray 2s ease-in-out infinite,
            spin 8s ease-in-out infinite,
            dashOffset 2s linear infinite;
          transform-origin: center;
        }
      `}</style>
      
      <div className={`flex items-center ${getSizeClasses()}`}>
        {/* Hidden SVG with gradients */}
        <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
          <defs xmlns="http://www.w3.org/2000/svg">
            {/* I gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-i">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
            
            {/* H gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="gradient-h">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
              <animateTransform 
                repeatCount="indefinite" 
                keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" 
                keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" 
                dur="8s" 
                values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" 
                type="rotate" 
                attributeName="gradientTransform"
              />
            </linearGradient>
            
            {/* U gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-u">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
            
            {/* B gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-b">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
            
            {/* I2 gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-i2">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
            
            {/* M gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-m">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
            
            {/* S gradient */}
            <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="gradient-s">
              <stop stopColor="#0d559e"></stop>
              <stop stopColor="#1a6bb8" offset="1"></stop>
            </linearGradient>
          </defs>
        </svg>

        {/* I */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-i)" 
            d="M 20,4 H 44 V 12 H 36 V 52 H 44 V 60 H 20 V 52 H 28 V 12 H 20 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>

        {/* H */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="10" 
            stroke="url(#gradient-h)" 
            d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" 
            className="spin-loader" 
            pathLength="360"
          />
        </svg>

        <div className="w-2"></div>

        {/* U */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-u)" 
            d="M 4,4 h 4.6230469 v 25.919922 c -0.00276,11.916203 9.8364941,21.550422 21.7500001,21.296875 11.616666,-0.240651 21.014356,-9.63894 21.253906,-21.25586 a 2.0002,2.0002 0 0 0 0,-0.04102 V 4 H 56.25 v 25.919922 c 0,14.33873 -11.581192,25.919922 -25.919922,25.919922 a 2.0002,2.0002 0 0 0 -0.0293,0 C 15.812309,56.052941 3.998433,44.409961 4,29.919922 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>

        <div className="w-3"></div>

        {/* B */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-b)" 
            d="M 8,4 H 32 C 40.284,4 47,10.716 47,19 C 47,23.418 45.314,27.426 42.485,30.515 C 45.314,33.574 47,37.582 47,42 C 47,50.284 40.284,57 32,57 H 8 V 4 Z M 16,12 V 26 H 32 C 35.866,26 39,22.866 39,19 C 39,15.134 35.866,12 32,12 H 16 Z M 16,34 V 49 H 32 C 35.866,49 39,45.866 39,42 C 39,38.134 35.866,34 32,34 H 16 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>

        <div className="w-1"></div>

        {/* I */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-i2)" 
            d="M 20,4 H 44 V 12 H 36 V 52 H 44 V 60 H 20 V 52 H 28 V 12 H 20 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>

        <div className="w-3"></div>

        {/* M */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-m)" 
            d="M 4,4 H 12 L 24,28 L 36,4 H 44 L 48,4 H 56 V 60 H 48 V 20 L 36,44 H 28 L 16,20 V 60 H 8 V 4 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>

        {/* S */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" className={`${getSizeClasses()} inline-block`}>
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="8" 
            stroke="url(#gradient-s)" 
            d="M 50,19 C 50,10.716 43.284,4 35,4 H 29 C 20.716,4 14,10.716 14,19 C 14,27.284 20.716,34 29,34 H 35 C 39.418,34 43,37.582 43,42 C 43,46.418 39.418,50 35,50 H 29 C 24.582,50 21,46.418 21,42 H 14 C 14,50.284 20.716,57 29,57 H 35 C 43.284,57 50,50.284 50,42 C 50,33.716 43.284,27 35,27 H 29 C 24.582,27 21,23.418 21,19 C 21,14.582 24.582,11 29,11 H 35 C 39.418,11 43,14.582 43,19 H 50 Z" 
            className="dash" 
            pathLength="360"
          />
        </svg>
      </div>
    </>
  );

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <AnimatedLoader />
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        <div className="text-center">
          <AnimatedLoader />
          {/* <h3 className={`mt-4 font-semibold text-gray-800 ${getTextSize()}`}>{message}</h3> */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <AnimatedLoader />
        {/* <h3 className={`mt-4 font-semibold text-gray-800 ${getTextSize()}`}>{message}</h3> */}
      </div>
    </div>
  );
};

export default AttractiveLoader;