import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, RotateCcw } from 'lucide-react';

interface MatchTheFollowingProps {
  question: string;
  matchColumns: { left: string[]; right: string[] };
  answer: string;
}

interface Point {
  x: number;
  y: number;
}

interface Connection {
  leftIndex: number;
  rightIndex: number;
  isCorrect: boolean;
}

export const MatchTheFollowing: React.FC<MatchTheFollowingProps> = ({
  question,
  matchColumns,
  answer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawing, setDrawing] = useState<{ startIndex: number; currentPos: Point } | null>(null);
  const [nodePositions, setNodePositions] = useState<{ left: Point[]; right: Point[] }>({ left: [], right: [] });

  // Parse correct answers
  const correctMapping = new Map<string, string>();
  answer.split(',').forEach(part => {
    const [left, right] = part.split('-');
    if (left && right) {
      correctMapping.set(left.trim().toLowerCase(), right.trim().toLowerCase());
    }
  });

  const getLeftPrefix = (item: string) => {
    const match = item.match(/^\s*(\([ivx]+\))/i);
    return match ? match[1].toLowerCase() : '';
  };

  const getRightPrefix = (item: string) => {
    const match = item.match(/^\s*\(([a-z])\)/i);
    return match ? match[1].toLowerCase() : '';
  };

  const updatePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const leftPos = leftRefs.current.map(ref => {
      if (!ref) return { x: 0, y: 0 };
      const rect = ref.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    });

    const rightPos = rightRefs.current.map(ref => {
      if (!ref) return { x: 0, y: 0 };
      const rect = ref.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    });

    setNodePositions({ left: leftPos, right: rightPos });
  };

  useEffect(() => {
    // Small delay to ensure DOM is fully rendered before calculating positions
    const timeout = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePositions);
    };
  }, [matchColumns]);

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setDrawing({
      startIndex: index,
      currentPos: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      }
    });
    
    // Remove existing connection for this left node if any
    setConnections(prev => prev.filter(c => c.leftIndex !== index));
    
    // Capture pointer events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setDrawing({
      ...drawing,
      currentPos: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drawing) return;
    
    // Find if we dropped on a right node
    let droppedOnIndex = -1;
    rightRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      // Add padding to the drop target (24px radius)
      if (
        e.clientX >= rect.left - 24 &&
        e.clientX <= rect.right + 24 &&
        e.clientY >= rect.top - 24 &&
        e.clientY <= rect.bottom + 24
      ) {
        droppedOnIndex = index;
      }
    });

    if (droppedOnIndex !== -1) {
      // Check if correct
      const leftItem = matchColumns.left[drawing.startIndex];
      const rightItem = matchColumns.right[droppedOnIndex];
      const leftPrefix = getLeftPrefix(leftItem);
      const rightPrefix = getRightPrefix(rightItem);
      
      const isCorrect = correctMapping.get(leftPrefix) === rightPrefix;
      
      // Remove any existing connection to this right node, then add the new one
      setConnections(prev => {
        const filtered = prev.filter(c => c.rightIndex !== droppedOnIndex && c.leftIndex !== drawing.startIndex);
        return [...filtered, { leftIndex: drawing.startIndex, rightIndex: droppedOnIndex, isCorrect }];
      });
    }

    setDrawing(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if element lost capture
    }
  };

  const createBezierPath = (start: Point, end: Point) => {
    const offset = Math.max(Math.abs(end.x - start.x) / 2, 50);
    return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${end.x - offset} ${end.y}, ${end.x} ${end.y}`;
  };

  const handleReset = () => {
    setConnections([]);
  };

  return (
    <div className="space-y-6" ref={containerRef} style={{ position: 'relative' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="whitespace-pre-wrap text-on-surface">{question}</div>
        {connections.length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
            title="Reset connections"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
      
      {/* SVG Overlay for lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10, overflow: 'visible' }}>
        {/* Existing connections */}
        {connections.map((conn, i) => {
          const start = nodePositions.left[conn.leftIndex];
          const end = nodePositions.right[conn.rightIndex];
          if (!start || !end) return null;
          
          const path = createBezierPath(start, end);
          const color = conn.isCorrect ? "#10b981" : "#ef4444";
          
          return (
            <motion.path
              key={`conn-${conn.leftIndex}-${conn.rightIndex}`}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          );
        })}
        
        {/* Drawing line */}
        {drawing && nodePositions.left[drawing.startIndex] && (
          <path
            d={createBezierPath(nodePositions.left[drawing.startIndex], drawing.currentPos)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="6,6"
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="grid grid-cols-2 gap-x-12 md:gap-x-24 gap-y-4 md:gap-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-secondary text-xs md:text-sm uppercase tracking-wider pl-2">Column A</h4>
          {matchColumns.left.map((item, i) => {
            const isConnected = connections.some(c => c.leftIndex === i);
            return (
              <motion.div 
                key={i} 
                className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 min-h-[72px] shadow-sm ${
                  isConnected ? 'bg-surface border-outline-variant/50' : 'bg-surface-container-low border-outline-variant hover:border-primary/50 hover:shadow-md'
                }`}
                whileHover={!isConnected ? { scale: 1.01 } : {}}
              >
                <span className="flex-1 text-sm md:text-base pr-6 text-on-surface font-medium">{item}</span>
                <div
                  ref={el => { leftRefs.current[i] = el; }}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 md:w-7 md:h-7 rounded-full border-4 cursor-grab active:cursor-grabbing z-20 touch-none transition-colors ${
                    isConnected ? 'bg-surface border-outline-variant' : 'bg-primary border-surface hover:scale-110'
                  }`}
                  onPointerDown={(e) => handlePointerDown(i, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-secondary text-xs md:text-sm uppercase tracking-wider pl-2">Column B</h4>
          {matchColumns.right.map((item, i) => {
            const connection = connections.find(c => c.rightIndex === i);
            const isConnected = !!connection;
            const isCorrect = connection?.isCorrect;
            
            let cardClass = "bg-surface-container-low border-outline-variant hover:border-primary/50";
            let nodeClass = "bg-surface border-outline-variant";
            
            if (isConnected) {
              if (isCorrect) {
                cardClass = "bg-emerald-50/50 border-emerald-200";
                nodeClass = "bg-emerald-500 border-surface";
              } else {
                cardClass = "bg-red-50/50 border-red-200";
                nodeClass = "bg-red-500 border-surface";
              }
            }

            return (
              <motion.div 
                key={i} 
                className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 min-h-[72px] shadow-sm ${cardClass}`}
                animate={isConnected && !isCorrect ? { x: [-2, 2, -2, 2, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <span className="pl-6 block text-sm md:text-base text-on-surface font-medium">{item}</span>
                <div
                  ref={el => { rightRefs.current[i] = el; }}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 md:w-7 md:h-7 rounded-full border-4 z-20 transition-colors duration-300 flex items-center justify-center ${nodeClass}`}
                >
                  {isConnected && isCorrect && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  {isConnected && !isCorrect && <X className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
