'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

export type StepKey = 'email' | 'password' | 'verify-method' | 'profile';

export const STEP_ORDER: StepKey[] = ['email', 'password', 'verify-method', 'profile'];
const STEP_LABELS: Record<StepKey, string> = {
  email: '邮箱',
  password: '密码',
  'verify-method': '验证',
  profile: '资料',
};

const COLORS = {
  completed: 'var(--chart-1)',
  current: 'var(--accent)',
  pending: 'var(--placeholder)',
};

interface StepperProps {
  currentStep: StepKey;
  completedSteps: Set<StepKey>;
  onStepClick?: (step: StepKey) => void;
}

export function Stepper({ currentStep, completedSteps, onStepClick }: StepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center w-full mb-8">
      {STEP_ORDER.map((step, index) => {
        const isCompleted = completedSteps.has(step);
        const isCurrent = step === currentStep;
        const color = isCompleted ? COLORS.completed : isCurrent ? COLORS.current : COLORS.pending;
        const isClickable = isCompleted && onStepClick != null;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Connector line — render only once between each pair of steps */}
            {index > 0 && (
              <div className="flex-1 h-0.5 -ml-1 mr-1" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: index <= currentIndex ? '100%' : '0%',
                    backgroundColor: index < currentIndex ? COLORS.completed : isCurrent ? COLORS.current : 'transparent',
                  }}
                />
              </div>
            )}

            {/* Step circle + label */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => onStepClick?.(step)}
              className="flex flex-col items-center gap-1 min-w-[48px] cursor-pointer disabled:cursor-default"
            >
              <motion.div
                initial={false}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { scale: isCurrent ? 1.1 : 1, backgroundColor: color }
                }
                transition={{ duration: 0.2 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              >
                {isCompleted ? '✓' : index + 1}
              </motion.div>
              <span className="text-xs" style={{ color }}>
                {STEP_LABELS[step]}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
