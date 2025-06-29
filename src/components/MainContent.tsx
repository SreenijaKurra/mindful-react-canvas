
import React from 'react';

const MainContent = () => {
  return (
    <main className="flex-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-gray-800 leading-tight">
              Find Your Inner Peace
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Welcome to your personal meditation space. Take a moment to breathe and center yourself.
            </p>
          </div>

          {/* Placeholder for meditation content */}
          <div className="mt-16 space-y-6">
            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-gradient-to-br from-blue-200 to-purple-200 rounded-full shadow-lg opacity-80 animate-pulse"></div>
            
            <div className="space-y-4">
              <p className="text-gray-500 font-light">
                Ready to begin your journey?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="px-8 py-3 bg-white rounded-full shadow-md text-gray-700 font-light border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  Start Session
                </div>
                <div className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-md font-light hover:shadow-lg transition-shadow duration-300">
                  Explore Meditations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;
