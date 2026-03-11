import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckSquare, AlignLeft, FileText, LayoutList, Search, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { mcqs } from './data/mcqs';
import { objectives } from './data/objectives';
import { vsas } from './data/vsas';
import { sas } from './data/sas';
import { las } from './data/las';
import { hotTopics } from './data/hotTopics';
import { QuestionCard } from './components/QuestionCard';

type Tab = 'mcqs' | 'objectives' | 'vsas' | 'sas' | 'las';

const tabs: { id: Tab; label: string; icon: React.ReactNode; data: any[] }[] = [
  { id: 'mcqs', label: 'MCQs', icon: <CheckSquare className="w-5 h-5" />, data: mcqs },
  { id: 'objectives', label: 'Objectives', icon: <LayoutList className="w-5 h-5" />, data: objectives },
  { id: 'vsas', label: 'Very Short Answers', icon: <AlignLeft className="w-5 h-5" />, data: vsas },
  { id: 'sas', label: 'Short Answers', icon: <FileText className="w-5 h-5" />, data: sas },
  { id: 'las', label: 'Long Answers', icon: <BookOpen className="w-5 h-5" />, data: las },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mcqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "Module 1: Introduction to Mass Communication": true,
  });

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const handleHotTopicClick = (term: string) => {
    setSearchQuery(term);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const currentData = tabs.find(t => t.id === activeTab)?.data || [];
  
  const getSearchResultsCount = () => {
    if (!searchQuery) return currentData.length;
    return tabs.reduce((acc, tab) => {
      return acc + tab.data.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ).length;
    }, 0);
  };

  const renderContent = () => {
    if (!searchQuery) {
      if (currentData.length === 0) return renderEmptyState();
      return currentData.map((q, index) => (
        <QuestionCard
          key={`${activeTab}-${index}`}
          index={index}
          question={q.question}
          options={q.options}
          answer={q.answer}
          matchColumns={q.matchColumns}
          type={activeTab === 'mcqs' ? 'mcq' : activeTab === 'objectives' ? 'objective' : 'text'}
        />
      ));
    }

    const results = tabs.map(tab => ({
      ...tab,
      filtered: tab.data.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(tab => tab.filtered.length > 0);

    if (results.length === 0) return renderEmptyState();

    return results.map(tab => (
      <motion.div 
        key={tab.id} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-10"
      >
        <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
          {tab.icon}
          {tab.label} ({tab.filtered.length})
        </h3>
        <div className="space-y-6">
          {tab.filtered.map((q, index) => (
            <QuestionCard
              key={`${tab.id}-${index}`}
              index={index}
              question={q.question}
              options={q.options}
              answer={q.answer}
              matchColumns={q.matchColumns}
              type={tab.id === 'mcqs' ? 'mcq' : tab.id === 'objectives' ? 'objective' : 'text'}
            />
          ))}
        </div>
      </motion.div>
    ));
  };

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-20"
    >
      <div className="w-20 h-20 bg-surface-container-low shadow-sm border border-outline-variant/30 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
        <Search className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-medium text-on-surface mb-2">No questions found</h3>
      <p className="text-on-surface-variant">Try adjusting your search query.</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans flex overflow-hidden">
      {/* Sidebar / Navigation Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface-container-low border-r border-outline-variant/30 flex flex-col shadow-xl lg:shadow-none`}
          >
            <div className="p-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-primary tracking-tight flex items-center gap-3">
                <BookOpen className="w-7 h-7" />
                Mass Comm
              </h1>
              <button 
                className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 pb-4">
              <p className="text-sm font-medium text-on-surface-variant px-2 mb-2 uppercase tracking-wider">Modules 1 to 4</p>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all duration-200 ${
                      isActive && !searchQuery
                        ? 'bg-primary-container text-on-primary-container font-semibold' 
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                    }`}
                  >
                    {tab.icon}
                    <span className="flex-1 text-left">{tab.label}</span>
                    <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
                      isActive && !searchQuery 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {tab.data.length}
                    </span>
                  </button>
                );
              })}

              <div className="mt-8 mb-4 px-2">
                <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Hot Topics</p>
              </div>
              
              <div className="space-y-2 pb-6">
                {hotTopics.map((module) => (
                  <div key={module.module} className="px-2">
                    <button
                      onClick={() => toggleModule(module.module)}
                      className="w-full flex items-center justify-between py-2 text-sm font-medium text-on-surface hover:text-primary transition-colors"
                    >
                      <span className="text-left truncate pr-2">{module.module}</span>
                      {expandedModules[module.module] ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedModules[module.module] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 pt-2 pb-3">
                            {module.terms.map((term) => (
                              <button
                                key={term}
                                onClick={() => handleHotTopicClick(term)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  searchQuery === term
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                                }`}
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top App Bar */}
        <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/30 px-4 py-3 flex items-center gap-4">
          <button 
            className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search topic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant rounded-full pl-12 pr-4 py-3 border border-outline-variant/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </header>

        {/* Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-on-surface mb-2">
                {searchQuery ? 'Search Results' : tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-on-surface-variant">
                Showing {getSearchResultsCount()} questions
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {renderContent()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

