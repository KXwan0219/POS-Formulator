/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Calculator,
  Compass,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  Receipt,
  Target,
  Layers,
  CircleDot,
  Circle,
  ShoppingCart,
  TrendingUp,
  Tag,
  BadgePercent,
  Landmark,
  ConciergeBell,
  Sigma,
  Sparkles,
  TicketPercent,
  Gift,
  ArrowUpRight,
  Percent,
  Package,
  ShoppingBag,
  PackageOpen,
  Truck,
  Ticket,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAlgebraicFormula } from './utils/formulaGenerator';

type TargetResult = 'subtotal' | 'surcharge' | 'promotionDiscount' | 'discount' | 'tax' | 'serviceCharge' | 'grandTotal';

export default function App() {
  const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [targetResult, setTargetResult] = useState<TargetResult>('grandTotal');
  const [activeModifiers, setActiveModifiers] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);
  const [showTopBtn, setShowTopBtn] = useState<boolean>(false);
  
  const [navHistory, setNavHistory] = useState<string[]>([]);

  useEffect(() => {
    document.title = "POS Formulator | Pure Logic Engine";
    
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleModifier = (id: string) => {
    const next = new Set(activeModifiers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setActiveModifiers(next);
  };

  const handleReset = () => {
    setTaxMode('exclusive');
    setTargetResult('grandTotal');
    setActiveModifiers(new Set());
  };

  const prevContext = useRef({ taxMode, targetResult });

  const compiledFormulas = useMemo(() => {
    return generateAlgebraicFormula(taxMode, activeModifiers);
  }, [taxMode, activeModifiers]);

  useEffect(() => {
    const getEntryId = (target: string, mode: string) => {
      if (target === 'subtotal') return mode === 'inclusive' ? 'Subtotal' : 'ItemNetTotal';
      if (target === 'surcharge') return 'Surcharge';
      if (target === 'promotionDiscount') return 'TotalPromotion';
      if (target === 'discount') return 'TotalDiscount';
      if (target === 'serviceCharge') return mode === 'inclusive' ? 'ServiceCharge' : 'TotalServiceCharge';
      if (target === 'tax') return mode === 'inclusive' ? 'TaxInclusivePortion' : 'TaxExclusive';
      return 'GrandTotal';
    };
    
    const rootId = getEntryId(targetResult, taxMode);

    if (prevContext.current.taxMode !== taxMode || prevContext.current.targetResult !== targetResult) {
      setNavHistory([rootId]);
      prevContext.current = { taxMode, targetResult };
    } else {
      setNavHistory(prev => {
        if (prev.length === 0) return [rootId];
        const currentId = prev[prev.length - 1];
        if (compiledFormulas[currentId]) {
          return prev;
        } else {
          return [rootId];
        }
      });
    }
  }, [targetResult, taxMode, activeModifiers, compiledFormulas]);

  const currentStepId = navHistory[navHistory.length - 1];
  const currentStep = compiledFormulas[currentStepId] ?? compiledFormulas['GrandTotal'];

  const goBackUrl = () => {
    if (navHistory.length > 1) {
      setNavHistory(prev => prev.slice(0, -1));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = () => {
    if (!currentStep) return;
    const formulaStr = `${currentStep.name} = ${currentStep.tokens.map(t => t.value).join('')}`;
    navigator.clipboard.writeText(formulaStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetList = [
    { id: 'subtotal', name: 'Subtotal', icon: ShoppingCart },
    { id: 'surcharge', name: 'Surcharge', icon: TrendingUp },
    { id: 'promotionDiscount', name: 'Promotion Discount', icon: Tag },
    { id: 'discount', name: 'Discount', icon: BadgePercent },
    { id: 'tax', name: taxMode === 'inclusive' ? 'Inclusive Tax' : 'Exclusive Tax', icon: Landmark },
    { id: 'serviceCharge', name: 'Service Charge', icon: ConciergeBell },
    { id: 'grandTotal', name: 'Grand Total', icon: Sigma }
  ];

  const modifiersList = [
    { id: 'productDiscount', label: 'Product Discount', icon: Tag },
    { id: 'productPromotion', label: 'Product Promotion', icon: Sparkles },
    { id: 'fullBillDiscount', label: 'Full Bill Discount', icon: BadgePercent },
    { id: 'fullBillPromotion', label: 'Full Bill Promotion', icon: Gift },
    { id: 'surcharge', label: 'Surcharge', icon: ArrowUpRight },
    { id: 'surchargeInclDiscount', label: 'Surcharge includes Discount', icon: Layers },
    { id: 'serviceCharge', label: 'Service Charge', icon: ConciergeBell },
    { id: 'serviceChargeTax', label: 'Service Charge Tax Rate', icon: Percent },
    { id: 'serviceChargeInclDiscount', label: 'Service Charge includes Discount', icon: Layers },
    { id: 'serviceChargeTakeAway', label: 'Service Charge on Take away Items', icon: Package },
    { id: 'takeAwayFull', label: 'Take Away Fees (Full Bill)', icon: ShoppingBag },
    { id: 'takeAwayItem', label: 'Take Away Fees (Per item)', icon: PackageOpen },
    { id: 'deliveryFee', label: 'Delivery Fees', icon: Truck },
    { id: 'voucher', label: 'Voucher', icon: Ticket },
    { id: 'point', label: 'Point Redemption', icon: Coins }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 flex flex-col antialiased selection:bg-brand-600 selection:text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 inset-x-0 h-[280px] bg-gradient-to-b from-brand-50/20 via-slate-50/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 py-8 flex-1 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 rounded-xl text-white shadow-sm flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                POS Formulator
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-xs text-slate-700 shadow-3xs inline-flex items-center gap-1.5 transition-all cursor-pointer font-semibold select-none"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Reset Groups
            </button>
          </div>
        </header>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 md:p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest font-mono">Group 1 : Single Choice</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">Tax Incorporation</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTaxMode('exclusive')}
                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                      taxMode === 'exclusive'
                        ? 'border-brand-600 bg-brand-50/40 text-brand-950 shadow-3xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <Percent className="w-4 h-4 text-brand-600/70" />
                       <span className="text-xs font-bold leading-tight font-sans">Tax Exclusive</span>
                    </div>
                    {taxMode === 'exclusive' && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                  </button>
                  <button
                    onClick={() => setTaxMode('inclusive')}
                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                      taxMode === 'inclusive'
                        ? 'border-brand-600 bg-brand-50/40 text-brand-950 shadow-3xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-brand-600/70" />
                       <span className="text-xs font-bold leading-tight font-sans">Tax Inclusive</span>
                    </div>
                    {taxMode === 'inclusive' && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest font-mono">Group 2 : Single Choice</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">Target Formula View</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {targetList.map((item) => {
                    const isSelected = targetResult === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTargetResult(item.id as any)}
                        className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/40 text-brand-950 shadow-3xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-brand-600/70" />
                          <span className="text-xs font-bold leading-tight font-sans">{item.name}</span>
                        </div>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
            </div>

            <div className="lg:col-span-6 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest font-mono">Group 3 : Multiple Selections</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">Applied Modifiers</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {modifiersList.map((item) => {
                  const isActive = activeModifiers.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleModifier(item.id)}
                      className={`py-3 px-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none ${
                        isActive
                          ? 'border-brand-600 bg-brand-50/40 text-brand-950 shadow-3xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-brand-600/70" />
                        <span className="text-xs font-bold leading-tight font-sans">{item.label}</span>
                      </div>
                      <div className={`w-4 h-4 shrink-0 rounded border transition-all flex items-center justify-center ${isActive ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                        {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[260px]">
          <div className="bg-slate-50 px-5 py-4 flex justify-between items-center border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Dynamic Algebra Display</span>
            </div>
            
            <button
              onClick={copyToClipboard}
              className="p-1.5 px-3 hover:bg-slate-150 text-[11px] text-slate-750 font-semibold rounded-lg border border-slate-250 bg-white transition-all flex items-center gap-1.5 font-sans cursor-pointer shadow-3xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Formula Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Copy Formula
                </>
              )}
            </button>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center gap-6">
            
            <div className="flex items-center justify-center min-h-[140px] w-full max-w-4xl relative">
              
              <AnimatePresence mode="popLayout">
                {currentStep && (
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.04, y: -10 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="w-full p-5 md:p-8 rounded-2xl bg-brand-50/30 border border-brand-100 shadow-xs flex-col flex select-none"
                  >
                    
                    {/* Navigation Path Breadcrumbs */}
                    <div className="flex items-center justify-center gap-1.5 mb-6 text-brand-600 font-mono text-[10px] font-bold tracking-widest uppercase flex-wrap">
                       {navHistory.length > 1 && (
                         <button 
                           onClick={goBackUrl}
                           className="flex items-center gap-1 hover:bg-brand-100/50 px-2 py-1 rounded transition-colors mr-2 cursor-pointer"
                         >
                           <ArrowLeft className="w-3.5 h-3.5" /> Back
                         </button>
                       )}
                       {navHistory.map((stepId, idx) => (
                         <div key={idx} className="flex items-center gap-1.5 opacity-60">
                           {idx > 0 && <ChevronRight className="w-3 h-3" />}
                           <span>{compiledFormulas[stepId]?.name ?? stepId}</span>
                         </div>
                       ))}
                    </div>

                    <p className="font-mono text-base md:text-xl lg:text-2xl text-slate-900 leading-relaxed font-bold break-words">
                      <span className="text-slate-500">{currentStep.name}</span> <span className="text-brand-400 font-normal mx-2">=</span> 
                      {currentStep.tokens.map((token, i) => (
                        token.type === 'text' ? (
                          <span key={i}>{token.value}</span>
                        ) : (
                          <button 
                            key={i} 
                            onClick={() => setNavHistory([...navHistory, token.stepId!])}
                            title="Click to trace this logic"
                            className="text-brand-600 hover:bg-brand-100 bg-brand-50 mx-1 px-1.5 py-0.5 rounded shadow-3xs border border-brand-200 transition-colors inline-block cursor-pointer active:scale-95"
                          >
                            {token.value}
                          </button>
                        )
                      ))}
                    </p>
                    
                    <div className="mt-8 pt-4 border-t border-brand-200/50 text-[11px] text-slate-500 font-medium">
                      Click the highlighted interactive variables above to trace down deeply into their mathematical roots. Let the engine do the work.
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center px-4 max-w-3xl mx-auto">
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
          <strong className="font-semibold text-slate-500">Disclaimer:</strong> The mathematical formulas and algorithmic cascades generated by this engine are provided strictly for reference. Real-world financial integrations may exhibit variances due to point-of-sale platform versions, proprietary architectures, and localized tax compliances.
        </p>
      </div>

      <footer className="border-t border-slate-200 py-6 mt-12 bg-white flex flex-col items-center font-sans tracking-wide">
        <AnimatePresence>
          {showTopBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-50 p-3 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:-translate-y-1 transition-all cursor-pointer"
              title="Go to Top"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Developer Credits Widget */}
        <div className="relative z-10 mt-2">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-slate-300 shadow-sm rounded-full px-4 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors select-none cursor-pointer flex items-center justify-center overflow-hidden min-h-[32px]"
            layout
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isExpanded ? (
                <motion.span
                  key="abbrev"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono tracking-widest text-[11px] italic text-[#787f9d] font-bold px-1.5 py-0.5 rounded-md"
                >
                  T&C
                </motion.span>
              ) : (
                <motion.span
                  key="full"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap inline-block text-slate-600 font-medium px-1"
                >
                  Developed by Thomas & Carson @ 2026
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
