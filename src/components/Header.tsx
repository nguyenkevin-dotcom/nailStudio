
'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString());
    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, []);

  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary-foreground text-center sm:text-left mb-2 sm:mb-0">
          Nehtové studio Lenka Šumperk
        </h1>
        <div className="text-sm text-primary-foreground text-center sm:text-right">
          <p>Opening Hours: Mon - Fri, 8:00 - 19:00</p>
          {currentTime && <p>Current Time: <span className="font-semibold">{currentTime}</span></p>}
        </div>
      </div>
    </header>
  );
}

