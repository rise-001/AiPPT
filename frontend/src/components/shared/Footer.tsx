import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full py-6 px-4 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-foreground-tertiary">
          {/* Copyright */}
          <div className="flex items-center gap-1.5">
            <span>© {currentYear}</span>
            <a
              href="https://yunai.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium bg-gradient-to-r from-banana-600 to-orange-500 bg-clip-text text-transparent"
            >
              凌云 API
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
