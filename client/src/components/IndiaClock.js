import React, { useState, useEffect } from 'react';

const IndiaClock = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    // Function to get the current time in India
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      // Format it beautifully
      setTime(now.toLocaleTimeString('en-IN', options));
    };

    updateTime(); // Set time immediately on load
    
    // Update the time every 1000 milliseconds (1 second)
    const timerId = setInterval(updateTime, 1000);

    // Cleanup function to stop the timer if the component is closed
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="india-clock">
      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>📍 IST:</span>
      <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{time}</span>
    </div>
  );
};

export default IndiaClock;