
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
