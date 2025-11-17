import React, { useState, useCallback } from 'react';
import { analyzeResumeAndFindJobs } from './services/geminiService';
import type { GroundingChunk, Source } from './types';
import SparkleIcon from './components/icons/SparkleIcon';
import DocumentTextIcon from './components/icons/DocumentTextIcon';
import LoadingSpinner from './components/LoadingSpinner';
import MarkdownRenderer from './components/MarkdownRenderer';
import { useTheme } from './hooks/useTheme';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';

type ActiveTab = 'summary' | 'raw' | 'sources';

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [jobSummary, setJobSummary] = useState('');
  const [rawJobDescriptions, setRawJobDescriptions] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [theme, toggleTheme] = useTheme();

  const handleSearch = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume before searching.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setJobSummary('');
    setRawJobDescriptions('');
    setSources([]);
    setActiveTab('summary');

    try {
      const result = await analyzeResumeAndFindJobs(resumeText, setLoadingMessage);
      setJobSummary(result.summary);
      setRawJobDescriptions(result.rawJobDescriptions);
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

  const TabButton: React.FC<{
    tabName: ActiveTab;
    currentTab: ActiveTab;
    onClick: (tab: ActiveTab) => void;
    children: React.ReactNode;
  }> = ({ tabName, currentTab, onClick, children }) => {
    const isActive = tabName === currentTab;
    return (
      <button
        onClick={() => onClick(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-slate-800
          ${isActive 
            ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' 
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparkleIcon className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Job Hunter</h1>
          </div>
           <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-slate-800 transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-6 h-6" />
              ) : (
                <SunIcon className="w-6 h-6" />
              )}
            </button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
          {/* Input Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 lg:mb-0 h-fit sticky top-24">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold">Your Resume</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Paste the text of your resume below. Our AI will analyze it to find the most relevant job opportunities for you.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here..."
              className="w-full h-80 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200"
              disabled={isLoading}
              aria-label="Resume text input"
            />
            {error && <p className="text-red-500 mt-2" role="alert">{error}</p>}
            <button
              onClick={handleSearch}
              disabled={isLoading || !resumeText.trim()}
              className="mt-4 w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 px-4 rounded-md hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <SparkleIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  Analyze & Find Jobs
                </>
              )}
            </button>
          </div>
          
          {/* Output Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[500px]">
             <div className="flex items-center mb-4">
                <SparkleIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-semibold">Job Analysis Report</h2>
              </div>
            {isLoading && <LoadingSpinner message={loadingMessage} />}
            
            {!isLoading && !hasResults && (
              <div className="text-center text-slate-500 dark:text-slate-400 mt-20">
                  <DocumentTextIcon className="mx-auto w-16 h-16 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                  <p className="mt-4 text-lg">Your personalized job report will appear here.</p>
              </div>
            )}
            
            {!isLoading && hasResults && (
              <div>
                <div className="border-b border-slate-200 dark:border-slate-700">
                  <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tabName="summary" currentTab={activeTab} onClick={setActiveTab}>Personalized Summary</TabButton>
                    <TabButton tabName="raw" currentTab={activeTab} onClick={setActiveTab}>Raw Job Postings</TabButton>
                    <TabButton tabName="sources" currentTab={activeTab} onClick={setActiveTab}>Search Sources</TabButton>
                  </nav>
                </div>

                <div className="mt-6">
                  {activeTab === 'summary' && (
                     <MarkdownRenderer content={jobSummary} />
                  )}
                  {activeTab === 'raw' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">Raw Job Descriptions Found by AI</h3>
                        <pre className="whitespace-pre-wrap bg-slate-100 dark:bg-slate-900/50 p-4 rounded-md text-sm leading-6 font-mono text-slate-700 dark:text-slate-300 max-h-[600px] overflow-y-auto">
                            {rawJobDescriptions}
                        </pre>
                    </div>
                  )}
                  {activeTab === 'sources' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-slate-600 dark:text-slate-300">Sources Used by AI</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        These are the web pages the AI grounded its search on to find job descriptions.
                      </p>
                      {sources.length > 0 ? (
                        <ul className="list-none p-0 space-y-2">
                          {sources.map((source, index) => (
                            <li key={index} className="border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3"
                              >
                                <p className="font-semibold text-primary-700 dark:text-primary-400 truncate">{source.title || 'Untitled Page'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 break-all mt-1">{source.uri}</p>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">No sources were provided for this search.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
