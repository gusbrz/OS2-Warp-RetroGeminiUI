
import type React from 'react';

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  zIndex: number;
  isMaximized: boolean;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}

export interface TodoItem {
  id: number;
  task: string;
  completed: boolean;
}

/* ---- Agente de Tráfego Pago para Advocacia ---- */

export interface TrafficCampaignRequest {
  officeName: string;
  practiceArea: string;
  practiceAreaHint: string;
  platform: string;
  objective: string;
  monthlyBudget: number;
}

export interface TrafficAdCopy {
  headline: string;
  description: string;
  cta: string;
}

export interface BudgetAllocation {
  channel: string;
  percentage: number;
  rationale: string;
}

export interface TrafficCampaignPlan {
  campaignName: string;
  strategy: string;
  targetSummary: string;
  adCopies: TrafficAdCopy[];
  keywords: string[];
  negativeKeywords: string[];
  audiences: string[];
  budgetAllocation: BudgetAllocation[];
  kpis: string[];
  complianceNotes: string[];
}
