'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from "framer-motion";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [comicPanels, setComicPanels] = useState<Array<{
    prompt: string;
    caption: string;
    imageUrl?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async () => {
    try {
      setIsLoading(true);
      setComicPanels([]);
      setError(null);  // Reset error state
      
      const storyResponse = await fetch('/api/generate_plot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const storyData = await storyResponse.json();
      if (!storyData.result?.comics || storyData.result.comics.length === 0) {
        setError("Sorry, I couldn't generate a story for this prompt. Please try a different prompt that's more appropriate for a family-friendly dog adventure!");
        setIsLoading(false);
        return;
      }
      
      setComicPanels(storyData.result.comics);
      // Start generating images for each panel
      generateNextImage(storyData.result.comics, 0);
    } catch (error) {
      console.error('Error:', error);
      setError("An error occurred while generating the story. Please try again.");
      setIsLoading(false);
    }
  };
  const generateNextImage = async (panels: typeof comicPanels, index: number) => {
    if (index >= panels.length) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generate_imgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: panels[index].prompt }),
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        setComicPanels(prev => prev.map((panel, i) => 
          i === index ? { ...panel, imageUrl: data.imageUrl } : panel
        ));
        // Generate next panel's image
        generateNextImage(panels, index + 1);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 p-4 sm:p-8">
      {/* Comic Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12 pt-8"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-white 
          tracking-wider transform 
          [text-shadow:2px_2px_0_#3B82F6,4px_4px_0_#1D4ED8] 
          hover:scale-105 transition-transform duration-300">
          Sebi Comic Creator
        </h1>
        <p className="text-xl mt-4 text-blue-300 font-medium tracking-wide">Give sebi an adventure!</p>
      </motion.header>

      <main className="max-w-7xl mx-auto">
        {/* Input Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-black/80 backdrop-blur-sm rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] 
            p-8 mb-12 max-w-2xl mx-auto border border-blue-500/30"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a short prompt (e.g. 'adventure in Alaska')"
            maxLength={50}
            className="w-full px-4 py-3 border-2 border-blue-500/50 rounded-lg 
              bg-black/50 text-white placeholder-blue-300/70
              focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
              transition-all min-h-[100px]"
          />
          <motion.button 
            onClick={generateStory}
            disabled={isLoading}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 
              text-white rounded-lg font-bold hover:from-blue-500 hover:to-blue-300 
              transition-all disabled:from-gray-600 disabled:to-gray-400 
              disabled:text-gray-300 shadow-lg border border-blue-400/50"
          >
            {isLoading ? 'Creating Your Comic...' : '✨ Generate Comic ✨'}
          </motion.button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 
              rounded-lg text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}
        </motion.div>

        {/* Comics Grid */}
        {comicPanels.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-black/80 backdrop-blur-sm rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] 
              p-8 border border-blue-500/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {comicPanels.map((panel, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.2
                  }}
                  className="comic-panel group"
                >
                  <div className="relative aspect-square bg-blue-900/30 
                    rounded-lg overflow-hidden border-4 border-white/10 
                    shadow-[0_0_15px_rgba(0,0,0,0.3)] 
                    group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] 
                    transition-all duration-300">
                    {!panel.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 
                          border-4 border-blue-400 border-t-transparent">
                        </div>
                      </div>
                    )}
                    {panel.imageUrl && (
                      <Image
                        src={panel.imageUrl}
                        alt={`Panel ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  {panel.imageUrl && (
                    <div className="mt-4 p-3 bg-blue-900/30 backdrop-blur-sm rounded-lg 
                      border border-blue-400/50 font-medium text-white
                      transform -rotate-1 group-hover:rotate-0 transition-all duration-300">
                      {panel.caption}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
