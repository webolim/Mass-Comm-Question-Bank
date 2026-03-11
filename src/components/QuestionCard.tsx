import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { MatchTheFollowing } from './MatchTheFollowing';

interface QuestionCardProps {
  question: string;
  options?: string[];
  answer: string;
  index: number;
  type: 'mcq' | 'text' | 'objective';
  matchColumns?: {
    left: string[];
    right: string[];
  };
}

const extractAnswers = (answerText: string, expectedBlanksCount: number): string[] => {
  const regex = /\([ivx]+\)\s*(.*?)(?=(?:;\s*\([ivx]+\))|$)/g;
  const matches = [...answerText.matchAll(regex)];
  let extracted: string[] = [];
  if (matches.length > 0) {
    extracted = matches.map(m => m[1].replace(/[.;]+$/, '').trim());
  } else {
    extracted = [answerText.replace(/[.;]+$/, '').trim()];
  }
  
  if (extracted.length < expectedBlanksCount) {
    let flatExtracted: string[] = [];
    for (const ext of extracted) {
      if (ext.includes(',')) {
        flatExtracted.push(...ext.split(',').map(s => s.trim()));
      } else if (ext.includes(' and ')) {
        flatExtracted.push(...ext.split(' and ').map(s => s.trim()));
      } else {
        flatExtracted.push(ext);
      }
    }
    return flatExtracted;
  }
  return extracted;
};

const Blank = ({ answer, forceReveal }: { answer: string, forceReveal: boolean }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (forceReveal) {
      setRevealed(true);
    }
  }, [forceReveal]);

  return (
    <button
      onClick={() => setRevealed(true)}
      disabled={revealed}
      className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1 mx-1 rounded-md border-b-2 transition-all duration-200 align-middle ${
        revealed 
          ? 'bg-green-100 border-green-500 text-green-900 font-bold' 
          : 'bg-surface-container-high border-outline-variant text-on-surface/50 hover:bg-surface-container-highest cursor-pointer hover:text-primary'
      }`}
      title={revealed ? "" : "Click to reveal"}
    >
      {revealed ? answer : <HelpCircle className="w-4 h-4" />}
    </button>
  );
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, answer, index, type, matchColumns }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (!showAnswer || type !== 'text') return;
      
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Check if the clicked element is a button or link, or inside one
        if (target && typeof target.closest === 'function') {
          if (target.closest('button') || target.closest('a')) {
            setShowAnswer(false);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [showAnswer, type]);

  const handleOptionClick = (option: string) => {
    if (showAnswer) return;
    setSelectedOption(option);
    setShowAnswer(true);
  };

  const renderQuestionText = () => {
    const parts = question.split(/_{3,}/);
    
    // Case 1: Fill in the blanks (contains ____)
    if (parts.length > 1) {
      const expectedBlanksCount = parts.length - 1;
      const answers = extractAnswers(answer, expectedBlanksCount);
      
      return (
        <div className="whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (i === parts.length - 1) return <span key={i}>{part}</span>;
            
            const blankAnswer = answers[i] || "???";
            
            return (
              <React.Fragment key={i}>
                <span>{part}</span>
                <Blank answer={blankAnswer} forceReveal={showAnswer} />
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // Case 2: Match the following
    if (matchColumns) {
      return (
        <MatchTheFollowing
          question={question}
          matchColumns={matchColumns}
          answer={answer}
        />
      );
    }

    // Case 3: True/False or other questions with parts but no blanks
    const regex = /\([ivx]+\)\s*(.*?)(?=(?:;\s*\([ivx]+\))|$)/g;
    const answerMatches = [...answer.matchAll(regex)];
    
    if (answerMatches.length > 0) {
      const lines = question.split('\n');
      let answerIndex = 0;
      
      return (
        <div className="space-y-2">
          {lines.map((line, i) => {
            const hasRomanNumeral = /^\s*\([ivx]+\)/i.test(line);
            
            if (hasRomanNumeral && answerIndex < answerMatches.length) {
              const blankAnswer = answerMatches[answerIndex][1].replace(/[.;]+$/, '').trim();
              answerIndex++;
              return (
                <div key={i} className="flex items-center flex-wrap gap-2">
                  <span className="whitespace-pre-wrap">{line}</span>
                  <Blank answer={blankAnswer} forceReveal={showAnswer} />
                </div>
              );
            }
            
            return <div key={i} className="whitespace-pre-wrap">{line}</div>;
          })}
        </div>
      );
    }

    // Case 4: Default rendering
    return <div className="whitespace-pre-wrap">{question}</div>;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-surface-container-low rounded-2xl p-5 md:p-6 shadow-sm border border-outline-variant/30 mb-4"
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
            {index + 1}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-on-surface font-medium text-lg leading-relaxed mb-4">
            {renderQuestionText()}
          </div>

          {type === 'mcq' && options && (
            <div className="flex flex-col gap-3 mb-4">
              {options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === answer;
                const showStatus = showAnswer;

                let optionClass = "border-outline-variant hover:bg-surface-container-high text-on-surface";
                
                if (showStatus) {
                  if (isCorrect) {
                    optionClass = "bg-green-100 border-green-500 text-green-900";
                  } else if (isSelected && !isCorrect) {
                    optionClass = "bg-red-100 border-red-500 text-red-900";
                  } else {
                    optionClass = "border-outline-variant opacity-50";
                  }
                } else if (isSelected) {
                  optionClass = "bg-primary/10 border-primary text-primary";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(option)}
                    disabled={showAnswer}
                    className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${optionClass}`}
                  >
                    <span>{option}</span>
                    {showStatus && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {showStatus && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </button>
                );
              })}
            </div>
          )}

          {type === 'text' && (
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-2 text-primary font-medium hover:bg-primary/10 px-4 py-2 rounded-full transition-colors"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
              {showAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <AnimatePresence>
            {showAnswer && type === 'text' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-5 bg-green-100 text-green-900 rounded-xl text-base md:text-lg leading-relaxed border border-green-500/30">
                  <span className="font-semibold block mb-3 text-lg">Answer:</span>
                  <div className="prose prose-base md:prose-lg max-w-none prose-p:my-2 prose-strong:font-bold prose-headings:font-semibold prose-li:my-1 text-green-900 prose-strong:text-green-900 prose-headings:text-green-900 marker:text-green-900">
                    <Markdown>{answer}</Markdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
