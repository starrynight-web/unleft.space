import React, { useState, useEffect } from 'react';
import { Package, Check, Plus } from 'lucide-react';
import { tiers, availablePlans, type Plan } from '@/lib/plans';
import { ContactCard } from '@/components/ui/contact-card';
import ContactForm from '@/components/sections/ContactForm';
import { cn } from '@/lib/utils';

export default function CheckoutView() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planKey, setPlanKey] = useState<string>('');

  useEffect(() => {
    const updatePlanFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan')?.toLowerCase() || '';
      setPlanKey(plan);
      if (plan && tiers[plan]) {
        setSelectedPlan(tiers[plan]);
      } else {
        setSelectedPlan(null);
      }
    };

    updatePlanFromUrl();
    // Also listen for popstate if we use pushState for plan switching
    window.addEventListener('popstate', updatePlanFromUrl);
    return () => window.removeEventListener('popstate', updatePlanFromUrl);
  }, []);

  const handlePlanSwitch = (key: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('plan', key);
    window.history.pushState({}, '', newUrl);
    setPlanKey(key);
    setSelectedPlan(tiers[key]);
  };

  const title = selectedPlan ? `${selectedPlan.name} Plan` : "Your Plan";

  return (
    <ContactCard
      title={title}
      id="checkout-card"
      sideColumnSpan={4}
      mainColumnSpan={8}
      description="Tell us about your project below. We'll confirm details and get back to you within 24 hours."
      contactInfo={[]}
      infoExtra={
        selectedPlan && (
          <div id="plan-summary" className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
              <Package className="h-6 w-6 text-accent-glow shrink-0" />
              <div>
                <p className="font-bold text-text-primary text-base">{selectedPlan.name}</p>
                <p className="text-accent-glow text-sm font-medium">{selectedPlan.price}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary italic leading-relaxed">{selectedPlan.description}</p>
            <div className="h-px bg-accent-primary/20 w-full"></div>
            
            {/* Plan Selector */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-primary tracking-wider uppercase">Switch Plan:</p>
              <div className="grid grid-cols-3 gap-2">
                {availablePlans.map(plan => (
                  <button
                    key={plan.key}
                    onClick={() => handlePlanSwitch(plan.key)}
                    className={cn(
                      "p-3 rounded-lg text-xs font-medium transition-all text-left",
                      plan.key === planKey
                        ? 'bg-accent-primary/30 border border-accent-primary/60 text-accent-glow'
                        : 'bg-[#2D2D44]/30 border border-[#2D2D44] text-text-secondary hover:bg-[#2D2D44]/50 hover:border-[#2D2D44]/70'
                    )}
                  >
                    <div className="font-semibold">{plan.name}</div>
                    <div className="text-[10px] opacity-75 mt-1">{plan.price.split(' /')[0]}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-px bg-accent-primary/20 w-full"></div>
            <p className="text-xs font-semibold text-text-primary tracking-wider uppercase">What's Included:</p>
            <ul className="space-y-2.5 text-xs text-text-secondary">
              {selectedPlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="h-3 w-3 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="hover:text-text-primary transition-colors">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    >
      <div className="w-full">
        <h2 className="text-2xl font-bold text-text-primary mb-8">Send a Message</h2>
        <ContactForm defaultService={selectedPlan?.name} />
      </div>
    </ContactCard>
  );
}
