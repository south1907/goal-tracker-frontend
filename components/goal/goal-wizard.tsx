'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateGoalMutation } from '@/lib/api/mutations';
import { GoalType, TimeframeType } from '@/types/goal';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface GoalWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function GoalWizard({ onComplete, onCancel }: GoalWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const createGoalMutation = useCreateGoalMutation();
  
  // Ensure wizard content is visible after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.querySelector('[data-goal-wizard-step]') as HTMLElement;
      if (element && window.getComputedStyle(element).opacity === '0') {
        element.style.opacity = '1';
      }
    }, 500); // Fallback after 500ms
    
    return () => clearTimeout(timer);
  }, [currentStep]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '🎯',
    type: 'count' as GoalType,
    unit: 'times',
    target: 1,
    timeframe: {
      type: 'fixed' as TimeframeType,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rollingDays: 30,
      rrule: '',
    },
    privacy: 'private' as const,
    settings: {
      milestones: [
        { label: '25%', threshold: 0.25 },
        { label: '50%', threshold: 0.5 },
        { label: '75%', threshold: 0.75 },
        { label: '100%', threshold: 1 },
      ],
    },
  });
  
  const steps = [
    { title: 'Basics', description: 'Name and description' },
    { title: 'Type & Target', description: 'What you want to achieve' },
    { title: 'Timeframe', description: 'When to complete it' },
    { title: 'Review', description: 'Ready to create' },
  ];
  
  const goalTypes = [
    { value: 'count', label: 'Count', description: 'Track occurrences (e.g., workouts, books)', emoji: '🔢' },
    { value: 'sum', label: 'Sum', description: 'Track totals (e.g., distance, hours)', emoji: '📊' },
    { value: 'streak', label: 'Streak', description: 'Track consecutive days', emoji: '🔥' },
    { value: 'milestone', label: 'Milestone', description: 'Track progress milestones', emoji: '🏆' },
  ];
  
  const units = {
    count: ['times', 'sessions', 'items', 'books', 'workouts'],
    sum: ['km', 'miles', 'hours', 'minutes', 'pages', 'words'],
    streak: ['days', 'weeks'],
    milestone: ['%', 'levels', 'stages'],
    open: ['items', 'tasks', 'goals'],
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      // Convert form data to API format
      const apiGoal = {
        name: formData.name,
        description: formData.description,
        emoji: formData.emoji,
        goal_type: formData.type,
        unit: formData.unit,
        target: formData.target,
        timeframe_type: formData.timeframe.type,
        start_at: formData.timeframe.start,
        end_at: formData.timeframe.end,
        rolling_days: formData.timeframe.rollingDays,
        rrule: formData.timeframe.rrule,
        privacy: formData.privacy,
        settings_json: formData.settings,
      };
      
      await createGoalMutation.mutateAsync(apiGoal);
      toast.success('Goal created successfully!');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to create goal. Please try again.');
      console.error('Create goal error:', error);
    }
  };
  
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create New Goal</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {steps[currentStep].title}: {steps[currentStep].description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              // Ensure opacity is 1 after animation completes
              const element = document.querySelector('[data-goal-wizard-step]') as HTMLElement;
              if (element) {
                element.style.opacity = '1';
              }
            }}
            data-goal-wizard-step
          >
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Emoji
                  </label>
                  <div className="flex gap-2">
                    {['🎯', '📚', '🏃‍♂️', '💪', '🎨', '🎵', '📝', '🧘‍♀️'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant={formData.emoji === emoji ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFormData({ emoji })}
                        className="text-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Goal Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="e.g., Read 20 Books in 2025"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Description (optional)
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Why is this goal important to you?"
                  />
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Goal Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {goalTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={formData.type === type.value ? 'default' : 'outline'}
                        onClick={() => updateFormData({ type: type.value as GoalType })}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <span className="text-2xl">{type.emoji}</span>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-center opacity-75">{type.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Unit
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {units[formData.type].map((unit) => (
                      <Button
                        key={unit}
                        variant={formData.unit === unit ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFormData({ unit })}
                      >
                        {unit}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Target
                  </label>
                  <Input
                    type="number"
                    value={formData.target}
                    onChange={(e) => updateFormData({ target: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Timeframe Type
                  </label>
                  <Tabs value={formData.timeframe.type} onValueChange={(value) => updateFormData({ timeframe: { ...formData.timeframe, type: value as TimeframeType } })}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="fixed">Fixed Period</TabsTrigger>
                      <TabsTrigger value="rolling">Rolling Window</TabsTrigger>
                      <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fixed" className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={formData.timeframe.start}
                            onChange={(e) => updateFormData({ timeframe: { ...formData.timeframe, start: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={formData.timeframe.end}
                            onChange={(e) => updateFormData({ timeframe: { ...formData.timeframe, end: e.target.value } })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="rolling" className="space-y-3 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Rolling Window (days)
                        </label>
                        <div className="flex gap-2">
                          {[7, 30, 90].map((days) => (
                            <Button
                              key={days}
                              variant={formData.timeframe.rollingDays === days ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateFormData({ timeframe: { ...formData.timeframe, rollingDays: days } })}
                            >
                              {days} days
                            </Button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="recurring" className="space-y-3 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Recurring Pattern
                        </label>
                        <Input
                          placeholder="e.g., Weekly, Monthly"
                          value={formData.timeframe.rrule || ''}
                          onChange={(e) => updateFormData({ timeframe: { ...formData.timeframe, rrule: e.target.value } })}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{formData.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{formData.name}</h3>
                      {formData.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formData.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="ml-2 font-medium">{goalTypes.find(t => t.value === formData.type)?.label}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Target:</span>
                      <span className="ml-2 font-medium">{formData.target} {formData.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                      <span className="ml-2 font-medium">{formData.timeframe.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Privacy:</span>
                      <span className="ml-2 font-medium">{formData.privacy}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handlePrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && !formData.name.trim() || createGoalMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createGoalMutation.isPending ? 'Creating...' : (currentStep === steps.length - 1 ? 'Create Goal' : 'Next')}
              {currentStep < steps.length - 1 && !createGoalMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
