
import React from 'react';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-light text-gray-800 text-center">
          Mindful
        </h1>
        <p className="text-sm text-gray-600 text-center mt-1 font-light">
          Your meditation companion
        </p>
      </div>
    </header>
  );
};

export default Header;
