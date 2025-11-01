'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoalWizard } from '@/components/goal/goal-wizard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export default function NewGoal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  
  const handleComplete = () => {
    setIsOpen(false);
    router.push('/');
  };
  
  const handleCancel = () => {
    setIsOpen(false);
    router.push('/');
  };
  
  return (
    <div className="w-full min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Create New Goal
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Set up a new goal to track your progress and stay motivated.
              </p>
            </div>
          </div>
        </div>
        
        {/* Goal Wizard */}
        <GoalWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    </div>
  );
}
