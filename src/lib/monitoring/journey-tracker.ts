export interface UserJourney {
  id: string;
  userId: string;
  steps: JourneyStep[];
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  conversionGoal?: string;
}

export interface JourneyStep {
  name: string;
  timestamp: Date;
  duration: number;
  metadata?: Record<string, any>;
}

export class JourneyTracker {
  private journeys: Map<string, UserJourney> = new Map();

  startJourney(userId: string, goal?: string): string {
    const journeyId = `${userId}-${Date.now()}`;
    
    this.journeys.set(journeyId, {
      id: journeyId,
      userId,
      steps: [],
      startTime: new Date(),
      completed: false,
      conversionGoal: goal,
    });

    return journeyId;
  }

  addStep(journeyId: string, stepName: string, metadata?: Record<string, any>) {
    const journey = this.journeys.get(journeyId);
    if (!journey) return;

    const lastStep = journey.steps[journey.steps.length - 1];
    const now = new Date();
    const duration = lastStep 
      ? now.getTime() - lastStep.timestamp.getTime()
      : 0;

    journey.steps.push({
      name: stepName,
      timestamp: now,
      duration,
      metadata,
    });
  }

  completeJourney(journeyId: string) {
    const journey = this.journeys.get(journeyId);
    if (!journey) return;

    journey.endTime = new Date();
    journey.completed = true;

    this.saveJourney(journey);
  }

  async getCommonPaths(): Promise<Array<{ path: string[]; count: number }>> {
    const paths = new Map<string, number>();

    for (const journey of this.journeys.values()) {
      const path = journey.steps.map(s => s.name).join(' -> ');
      paths.set(path, (paths.get(path) || 0) + 1);
    }

    return Array.from(paths.entries())
      .map(([path, count]) => ({ path: path.split(' -> '), count }))
      .sort((a, b) => b.count - a.count);
  }

  async getDropoffPoints(): Promise<Array<{ step: string; dropoffRate: number }>> {
    const stepCounts = new Map<string, { entered: number; exited: number }>();

    for (const journey of this.journeys.values()) {
      for (let i = 0; i < journey.steps.length; i++) {
        const step = journey.steps[i].name;
        const counts = stepCounts.get(step) || { entered: 0, exited: 0 };
        counts.entered++;
        
        if (i === journey.steps.length - 1 && !journey.completed) {
          counts.exited++;
        }
        
        stepCounts.set(step, counts);
      }
    }

    return Array.from(stepCounts.entries())
      .map(([step, counts]) => ({
        step,
        dropoffRate: (counts.exited / counts.entered) * 100,
      }))
      .sort((a, b) => b.dropoffRate - a.dropoffRate);
  }

  private async saveJourney(journey: UserJourney) {
    console.log('Saving journey:', journey.id);
  }
}
