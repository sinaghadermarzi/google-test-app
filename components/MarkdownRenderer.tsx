
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    let html = content;

    // Headers (e.g., #, ##, ###)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b pb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 border-b-2 pb-2">$1</h1>');
    
    // Bold text (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800 dark:text-slate-100">$1</strong>');
    
    // Unordered lists (- item or * item)
    html = html.replace(/^\s*[-*] (.*$)/gim, '<li class="ml-6 mb-1">$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-5 my-4">$1</ul>');
    // Consolidate adjacent ULs created by the previous replace
    html = html.replace(/<\/ul>\s*<ul class="list-disc pl-5 my-4">/gs, '');

    // Replace newlines with <br />
    html = html.replace(/\n/g, '<br />');
    // Remove <br> inside list items
    html = html.replace(/<li(.*?)><br \/>/g, '<li$1>');
    html = html.replace(/<br \/><\/li>/g, '</li>');
    // Remove <br> before lists
    html = html.replace(/<br \/><ul/g, '<ul');
    // Remove <br> before headings
    html = html.replace(/<br \/><h[1-3]/g, '<h');

    return { __html: html };
  };

  return <div className="prose dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={renderContent()} />;
};

export default MarkdownRenderer;
