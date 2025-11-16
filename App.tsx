
import React, { useState, useCallback } from 'react';
import { analyzeResumeAndFindJobs } from './services/geminiService';
import type { GroundingChunk, Source } from './types';
import SparkleIcon from './components/icons/SparkleIcon';
import DocumentTextIcon from './components/icons/DocumentTextIcon';
import LoadingSpinner from './components/LoadingSpinner';
import MarkdownRenderer from './components/MarkdownRenderer';

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [jobSummary, setJobSummary] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume before searching.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setJobSummary('');
    setSources([]);

    try {
      const result = await analyzeResumeAndFindJobs(resumeText, setLoadingMessage);
      setJobSummary(result.summary);
      const webSources = result.sources
        .map((chunk: GroundingChunk) => chunk.web)
        .filter((source): source is Source => source !== undefined);
      setSources(webSources);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [resumeText]);
  
  const hasResults = jobSummary || sources.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 font-sans">
      <header className="bg-white dark:bg-stone-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparkleIcon className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">AI Job Hunter</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
          {/* Input Panel */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 mb-8 lg:mb-0 h-fit sticky top-24">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold">Your Resume</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Paste the text of your resume below. Our AI will analyze it to find the most relevant job opportunities for you.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here..."
              className="w-full h-80 p-3 border border-stone-300 dark:border-stone-600 rounded-md bg-stone-50 dark:bg-stone-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <button
              onClick={handleSearch}
              disabled={isLoading || !resumeText.trim()}
              className="mt-4 w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-700 disabled:bg-stone-400 dark:disabled:bg-stone-600 disabled:cursor-not-allowed transition duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <SparkleIcon className="w-5 h-5 mr-2" />
                  Analyze & Find Jobs
                </>
              )}
            </button>
          </div>
          
          {/* Output Panel */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 min-h-[500px]">
             <div className="flex items-center mb-4">
                <SparkleIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-semibold">Job Analysis Report</h2>
              </div>
            {isLoading && <LoadingSpinner message={loadingMessage} />}
            
            {!isLoading && !hasResults && (
                <div className="text-center text-stone-600 dark:text-stone-400 mt-20">
                  <DocumentTextIcon className="mx-auto w-16 h-16 text-stone-300 dark:text-stone-600" />
                  <p className="mt-4 text-lg">Your personalized job report will appear here.</p>
              </div>
            )}
            
            {!isLoading && hasResults && (
              <div>
                {jobSummary && <MarkdownRenderer content={jobSummary} />}
                {sources.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold border-t pt-4">Sources</h3>
                    <ul className="mt-2 list-none p-0">
                      {sources.map((source, index) => (
                        <li key={index} className="mt-2">
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline break-all"
                          >
                            {source.title || source.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
