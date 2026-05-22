import * as tf from '@tensorflow/tfjs';

export interface MoodEntry {
  id: string;
  date: Date;
  mood: number;
  energy: number;
  sleep: number;
  anxiety: number;
  notes?: string;
  activities?: string[];
  weather?: string;
  socialInteraction?: number;
  exercise?: number;
  workStress?: number;
}

export interface MoodPrediction {
  predictedMood: number;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
}

export interface MoodPattern {
  pattern: string;
  description: string;
  frequency: number;
  triggers: string[];
  suggestions: string[];
}

class MoodAnalysisService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private moodHistory: MoodEntry[] = [];

  // Factors that influence mood
  private moodFactors = {
    sleep: { weight: 0.25, description: "Sleep quality significantly affects mood and energy" },
    exercise: { weight: 0.20, description: "Physical activity releases endorphins and improves mood" },
    socialInteraction: { weight: 0.18, description: "Social connections are crucial for mental wellbeing" },
    workStress: { weight: 0.15, description: "Work-related stress can significantly impact mood" },
    weather: { weight: 0.10, description: "Weather patterns can influence mood and energy levels" },
    routine: { weight: 0.12, description: "Consistent routines help maintain emotional stability" }
  };

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create a neural network for mood prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [8], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Output mood score 0-1
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Load any existing mood data
      this.loadMoodHistory();
      
      // Train model if we have enough data
      if (this.moodHistory.length >= 10) {
        await this.trainModel();
      }

      this.isInitialized = true;
      console.log('Mood Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mood Analysis Service:', error);
    }
  }

  private loadMoodHistory() {
    try {
      const stored = localStorage.getItem('moodHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.moodHistory = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  }

  private saveMoodHistory() {
    try {
      localStorage.setItem('moodHistory', JSON.stringify(this.moodHistory));
    } catch (error) {
      console.error('Error saving mood history:', error);
    }
  }

  addMoodEntry(entry: Omit<MoodEntry, 'id'>): MoodEntry {
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date()
    };

    this.moodHistory.push(newEntry);
    this.saveMoodHistory();

    // Retrain model if we have enough data
    if (this.moodHistory.length >= 10 && this.moodHistory.length % 5 === 0) {
      this.trainModel();
    }

    return newEntry;
  }

  private async trainModel() {
    if (!this.model || this.moodHistory.length < 10) return;

    try {
      const { inputs, outputs } = this.prepareTrainingData();
      
      if (inputs.length === 0) return;

      const xs = tf.tensor2d(inputs);
      const ys = tf.tensor2d(outputs.map(y => [y]));

      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: Math.min(32, inputs.length),
        validationSplit: 0.2,
        verbose: 0
      });

      xs.dispose();
      ys.dispose();

      console.log('Mood prediction model trained successfully');
    } catch (error) {
      console.error('Error training mood model:', error);
    }
  }

  private prepareTrainingData() {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (let i = 1; i < this.moodHistory.length; i++) {
      const current = this.moodHistory[i];
      const previous = this.moodHistory[i - 1];

      // Features: previous mood, sleep, energy, anxiety, day of week, time since last entry, etc.
      const features = [
        previous.mood / 10,
        previous.sleep / 10,
        previous.energy / 10,
        previous.anxiety / 10,
        current.date.getDay() / 7, // Day of week
        Math.min((current.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24), 7) / 7, // Days since last entry
        (current.socialInteraction || 5) / 10,
        (current.exercise || 5) / 10
      ];

      inputs.push(features);
      outputs.push(current.mood / 10);
    }

    return { inputs, outputs };
  }

  async predictMood(currentFactors: {
    previousMood: number;
    sleep: number;
    energy: number;
    anxiety: number;
    socialInteraction?: number;
    exercise?: number;
    dayOfWeek?: number;
  }): Promise<MoodPrediction> {
    if (!this.model) {
      return this.getFallbackPrediction(currentFactors);
    }

    try {
      const features = [
        currentFactors.previousMood / 10,
        currentFactors.sleep / 10,
        currentFactors.energy / 10,
        currentFactors.anxiety / 10,
        (currentFactors.dayOfWeek || new Date().getDay()) / 7,
        1, // Assuming 1 day since last entry
        (currentFactors.socialInteraction || 5) / 10,
        (currentFactors.exercise || 5) / 10
      ];

      const prediction = this.model.predict(tf.tensor2d([features])) as tf.Tensor;
      const result = await prediction.data();
      prediction.dispose();

      const predictedMood = result[0] * 10;
      const confidence = this.calculateConfidence(currentFactors);

      return {
        predictedMood,
        confidence,
        factors: this.analyzeMoodFactors(currentFactors),
        recommendations: this.generateRecommendations(currentFactors, predictedMood)
      };
    } catch (error) {
      console.error('Error predicting mood:', error);
      return this.getFallbackPrediction(currentFactors);
    }
  }

  private getFallbackPrediction(factors: any): MoodPrediction {
    // Simple rule-based prediction as fallback
    let predictedMood = 5;
    
    // Sleep impact
    if (factors.sleep >= 7) predictedMood += 1;
    else if (factors.sleep <= 4) predictedMood -= 1.5;

    // Energy impact
    if (factors.energy >= 7) predictedMood += 0.8;
    else if (factors.energy <= 4) predictedMood -= 1;

    // Anxiety impact (inverse)
    if (factors.anxiety <= 3) predictedMood += 0.5;
    else if (factors.anxiety >= 7) predictedMood -= 1.2;

    // Exercise impact
    if (factors.exercise && factors.exercise >= 6) predictedMood += 0.7;

    predictedMood = Math.max(1, Math.min(10, predictedMood));

    return {
      predictedMood,
      confidence: 0.6,
      factors: this.analyzeMoodFactors(factors),
      recommendations: this.generateRecommendations(factors, predictedMood)
    };
  }

  private calculateConfidence(factors: any): number {
    // Calculate confidence based on data quality and consistency
    let confidence = 0.5;

    // More data points = higher confidence
    if (this.moodHistory.length > 30) confidence += 0.2;
    else if (this.moodHistory.length > 10) confidence += 0.1;

    // Consistent patterns = higher confidence
    const recentEntries = this.moodHistory.slice(-7);
    if (recentEntries.length >= 3) {
      const variance = this.calculateVariance(recentEntries.map(e => e.mood));
      if (variance < 2) confidence += 0.2;
    }

    return Math.min(0.95, confidence);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return variance;
  }

  private analyzeMoodFactors(factors: any) {
    const analysis = [];

    // Sleep analysis
    if (factors.sleep >= 7) {
      analysis.push({
        factor: "Sleep",
        impact: 0.8,
        description: "Good sleep quality is positively impacting your mood"
      });
    } else if (factors.sleep <= 5) {
      analysis.push({
        factor: "Sleep",
        impact: -0.7,
        description: "Poor sleep quality may be negatively affecting your mood"
      });
    }

    // Energy analysis
    if (factors.energy >= 7) {
      analysis.push({
        factor: "Energy",
        impact: 0.6,
        description: "High energy levels are contributing to better mood"
      });
    } else if (factors.energy <= 4) {
      analysis.push({
        factor: "Energy",
        impact: -0.6,
        description: "Low energy levels may be bringing down your mood"
      });
    }

    // Anxiety analysis
    if (factors.anxiety >= 7) {
      analysis.push({
        factor: "Anxiety",
        impact: -0.8,
        description: "High anxiety levels are likely impacting your mood negatively"
      });
    } else if (factors.anxiety <= 3) {
      analysis.push({
        factor: "Anxiety",
        impact: 0.5,
        description: "Low anxiety levels are helping maintain a positive mood"
      });
    }

    return analysis;
  }

  private generateRecommendations(factors: any, predictedMood: number): string[] {
    const recommendations = [];

    if (factors.sleep <= 6) {
      recommendations.push("Try to improve your sleep hygiene - aim for 7-9 hours of quality sleep");
    }

    if (factors.energy <= 5) {
      recommendations.push("Consider light exercise or a short walk to boost your energy");
    }

    if (factors.anxiety >= 6) {
      recommendations.push("Practice deep breathing or meditation to help manage anxiety");
    }

    if (predictedMood <= 5) {
      recommendations.push("Reach out to friends or family for social support");
      recommendations.push("Engage in activities you enjoy or find meaningful");
    }

    if (!factors.exercise || factors.exercise <= 4) {
      recommendations.push("Regular physical activity can significantly improve mood");
    }

    return recommendations;
  }

  identifyMoodPatterns(): MoodPattern[] {
    if (this.moodHistory.length < 14) {
      return [];
    }

    const patterns: MoodPattern[] = [];

    // Weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern();
    if (weeklyPattern) patterns.push(weeklyPattern);

    // Sleep-mood correlation
    const sleepPattern = this.analyzeSleepMoodCorrelation();
    if (sleepPattern) patterns.push(sleepPattern);

    // Trend analysis
    const trendPattern = this.analyzeMoodTrend();
    if (trendPattern) patterns.push(trendPattern);

    return patterns;
  }

  private analyzeWeeklyPattern(): MoodPattern | null {
    const dayAverages = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));

    this.moodHistory.forEach(entry => {
      const day = entry.date.getDay();
      dayAverages[day].total += entry.mood;
      dayAverages[day].count++;
    });

    const averages = dayAverages.map(day => day.count > 0 ? day.total / day.count : 0);
    const maxDay = averages.indexOf(Math.max(...averages));
    const minDay = averages.indexOf(Math.min(...averages));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (Math.abs(averages[maxDay] - averages[minDay]) > 1.5) {
      return {
        pattern: "Weekly Mood Variation",
        description: `Your mood tends to be highest on ${dayNames[maxDay]} and lowest on ${dayNames[minDay]}`,
        frequency: 1, // Weekly
        triggers: [`${dayNames[minDay]} activities or stress`],
        suggestions: [`Plan enjoyable activities for ${dayNames[minDay]}`, `Prepare for ${dayNames[minDay]} challenges`]
      };
    }

    return null;
  }

  private analyzeSleepMoodCorrelation(): MoodPattern | null {
    const correlations = this.moodHistory.map(entry => ({
      sleep: entry.sleep,
      mood: entry.mood
    }));

    if (correlations.length < 10) return null;

    // Calculate correlation coefficient
    const correlation = this.calculateCorrelation(
      correlations.map(c => c.sleep),
      correlations.map(c => c.mood)
    );

    if (Math.abs(correlation) > 0.5) {
      return {
        pattern: "Sleep-Mood Connection",
        description: correlation > 0 
          ? "Your mood strongly correlates with sleep quality - better sleep leads to better mood"
          : "There's an unusual inverse relationship between your sleep and mood",
        frequency: 1, // Daily
        triggers: ["Sleep quality", "Sleep duration"],
        suggestions: [
          "Maintain consistent sleep schedule",
          "Create a relaxing bedtime routine",
          "Limit screen time before bed"
        ]
      };
    }

    return null;
  }

  private analyzeMoodTrend(): MoodPattern | null {
    if (this.moodHistory.length < 14) return null;

    const recent = this.moodHistory.slice(-14);
    const older = this.moodHistory.slice(-28, -14);

    if (older.length === 0) return null;

    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (Math.abs(difference) > 1) {
      return {
        pattern: difference > 0 ? "Improving Mood Trend" : "Declining Mood Trend",
        description: difference > 0 
          ? "Your mood has been improving over the past two weeks"
          : "Your mood has been declining over the past two weeks",
        frequency: 0.5, // Bi-weekly
        triggers: difference > 0 ? ["Positive life changes"] : ["Stressors", "Life challenges"],
        suggestions: difference > 0 
          ? ["Continue current positive practices", "Identify what's working well"]
          : ["Consider professional support", "Review recent stressors", "Focus on self-care"]
      };
    }

    return null;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  getMoodHistory(): MoodEntry[] {
    return [...this.moodHistory];
  }

  getRecentMoodSummary(days: number = 7) {
    const recent = this.moodHistory.slice(-days);
    if (recent.length === 0) return null;

    const avgMood = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
    const avgSleep = recent.reduce((sum, entry) => sum + entry.sleep, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, entry) => sum + entry.energy, 0) / recent.length;
    const avgAnxiety = recent.reduce((sum, entry) => sum + entry.anxiety, 0) / recent.length;

    return {
      averageMood: avgMood,
      averageSleep: avgSleep,
      averageEnergy: avgEnergy,
      averageAnxiety: avgAnxiety,
      totalEntries: recent.length,
      period: `Last ${days} days`
    };
  }
}

export const moodAnalysisService = new MoodAnalysisService();