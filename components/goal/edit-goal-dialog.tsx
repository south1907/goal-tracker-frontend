'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUpdateGoalMutation } from '@/lib/api/mutations';
import { Goal as ApiGoal } from '@/lib/types/api';
import { GoalType, TimeframeType } from '@/types/goal';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditGoalDialogProps {
  goal: ApiGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange }: EditGoalDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const updateGoalMutation = useUpdateGoalMutation(goal?.id || 0);

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
        { label: '25%', threshold: 25 },
        { label: '50%', threshold: 50 },
        { label: '75%', threshold: 75 },
        { label: '100%', threshold: 100 },
      ],
    },
  });

  // Initialize form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        description: goal.description || '',
        emoji: goal.emoji || '🎯',
        type: goal.goal_type || 'count',
        unit: goal.unit || 'times',
        target: goal.target ? Number(goal.target) : 1,
        timeframe: {
          type: goal.timeframe_type || 'fixed',
          start: goal.start_at ? new Date(goal.start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          end: goal.end_at ? new Date(goal.end_at).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rollingDays: goal.rolling_days || 30,
          rrule: goal.rrule || '',
        },
        privacy: goal.privacy || 'private',
        settings: {
          milestones: goal.settings_json?.milestones || [
            { label: '25%', threshold: 25 },
            { label: '50%', threshold: 50 },
            { label: '75%', threshold: 75 },
            { label: '100%', threshold: 100 },
          ],
        },
      });
      setCurrentStep(0);
    }
  }, [goal]);

  const steps = [
    { title: 'Basics', description: 'Name and description' },
    { title: 'Type & Target', description: 'What you want to achieve' },
    { title: 'Timeframe', description: 'When to complete it' },
    { title: 'Review', description: 'Review your changes' },
  ];

  const goalTypes = [
    { value: 'count', label: 'Count', description: 'Track occurrences (e.g., workouts, books)', emoji: '🔢' },
    { value: 'sum', label: 'Sum', description: 'Track totals (e.g., distance, hours)', emoji: '📊' },
    { value: 'streak', label: 'Streak', description: 'Track consecutive days', emoji: '🔥' },
    { value: 'milestone', label: 'Milestone', description: 'Track progress milestones', emoji: '🏆' },
  ];

  const units = {
    count: ['times', 'sessions', 'items', 'books', 'workouts'],
    sum: ['km', 'miles', 'hours', 'minutes', 'pages'],
    streak: ['days', 'weeks', 'months'],
    milestone: ['%', 'levels', 'stages'],
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!goal) return;

    try {
      const updates: any = {
        name: formData.name,
        description: formData.description,
        emoji: formData.emoji,
        goal_type: formData.type,
        unit: formData.unit,
        target: formData.target,
        timeframe_type: formData.timeframe.type,
        start_at: formData.timeframe.start,
        privacy: formData.privacy,
        settings_json: formData.settings,
      };

      if (formData.timeframe.type === 'fixed' && formData.timeframe.end) {
        updates.end_at = formData.timeframe.end;
      }
      if (formData.timeframe.type === 'rolling' && formData.timeframe.rollingDays) {
        updates.rolling_days = formData.timeframe.rollingDays;
      }
      if (formData.timeframe.type === 'recurring' && formData.timeframe.rrule) {
        updates.rrule = formData.timeframe.rrule;
      }

      await updateGoalMutation.mutateAsync(updates);
      onOpenChange(false);
      toast.success('Goal updated successfully!', {
        description: `"${formData.name}" has been updated.`,
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  if (!goal || !open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Goal</SheetTitle>
          <SheetDescription>
            Update your goal details and settings
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      index === currentStep
                        ? 'bg-blue-500 text-white'
                        : index < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-xs text-center max-w-[80px]">
                    <div
                      className={`font-medium ${
                        index === currentStep
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {steps[currentStep].title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {steps[currentStep].description}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Emoji
                      </label>
                      <div className="flex gap-2 flex-wrap">
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
                        placeholder="Add a description..."
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Goal Type
                      </label>
                      <Tabs value={formData.type} onValueChange={(value) => updateFormData({ type: value as GoalType })}>
                        <TabsList className="grid w-full grid-cols-4">
                          {goalTypes.map((type) => (
                            <TabsTrigger key={type.value} value={type.value} className="text-xs">
                              <span className="mr-1">{type.emoji}</span>
                              {type.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Unit
                      </label>
                      <Tabs value={formData.unit} onValueChange={(value) => updateFormData({ unit: value })}>
                        <TabsList className="grid w-full grid-cols-3">
                          {units[formData.type]?.map((unit) => (
                            <TabsTrigger key={unit} value={unit}>
                              {unit}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Target
                      </label>
                      <Input
                        type="number"
                        value={formData.target}
                        onChange={(e) => updateFormData({ target: Number(e.target.value) || 0 })}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Timeframe Type
                      </label>
                      <Tabs
                        value={formData.timeframe.type}
                        onValueChange={(value) =>
                          updateFormData({
                            timeframe: { ...formData.timeframe, type: value as TimeframeType },
                          })
                        }
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="fixed">Fixed</TabsTrigger>
                          <TabsTrigger value="rolling">Rolling</TabsTrigger>
                          <TabsTrigger value="recurring">Recurring</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {formData.timeframe.type === 'fixed' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={formData.timeframe.start}
                            onChange={(e) =>
                              updateFormData({
                                timeframe: { ...formData.timeframe, start: e.target.value },
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={formData.timeframe.end}
                            onChange={(e) =>
                              updateFormData({
                                timeframe: { ...formData.timeframe, end: e.target.value },
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    )}

                    {formData.timeframe.type === 'rolling' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Rolling Days
                        </label>
                        <Input
                          type="number"
                          value={formData.timeframe.rollingDays}
                          onChange={(e) =>
                            updateFormData({
                              timeframe: {
                                ...formData.timeframe,
                                rollingDays: Number(e.target.value) || 30,
                              },
                            })
                          }
                          min="1"
                          max="365"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Privacy
                      </label>
                      <Tabs
                        value={formData.privacy}
                        onValueChange={(value) => updateFormData({ privacy: value as 'private' | 'public' | 'unlisted' })}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="private">Private</TabsTrigger>
                          <TabsTrigger value="public">Public</TabsTrigger>
                          <TabsTrigger value="unlisted">Unlisted</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{formData.emoji}</span>
                        <div>
                          <div className="font-medium">{formData.name}</div>
                          {formData.description && (
                            <div className="text-sm text-muted-foreground">{formData.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Type: {formData.type}</div>
                        <div>Target: {formData.target} {formData.unit}</div>
                        <div>Timeframe: {formData.timeframe.type}</div>
                        <div>Privacy: {formData.privacy}</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={updateGoalMutation.isPending}
                  >
                    {updateGoalMutation.isPending ? 'Saving...' : 'Save Changes'}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

