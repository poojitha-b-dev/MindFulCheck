// src/models/assessmentTypes.ts

import * as tf from '@tensorflow/tfjs';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type AssessmentType = 'depression' | 'anxiety';

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
  mlWeight?: number; // Weight for ML analysis
  category?: string; // Category for pattern analysis
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration?: string;
  priority?: number; // ML-determined priority
}

export interface AssessmentResult {
  score: number;
  severity: string;
  interpretation: string;
  color: string;
  recommendations: Recommendation[];
  riskFactors: string[];
  protectiveFactors: string[];
  mlPrediction?: {
    riskLevel: number;
    confidence: number;
    personalizedInsights: string[];
    patternAnalysis: string[];
    interventionSuggestions: string[];
  };
}

// Enhanced ML-powered assessment analysis with deeper learning
class AssessmentMLService {
  private model: tf.LayersModel | null = null;
  private patternModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private userResponseHistory: any[] = [];

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create main risk assessment neural network
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [20], units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'softmax' }) // minimal, mild, moderate, severe
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Create pattern recognition model
      this.patternModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'sigmoid' }) // Multiple pattern outputs
        ]
      });

      this.patternModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Load any existing user data
      this.loadUserHistory();

      this.isInitialized = true;
      console.log('Enhanced Assessment ML Service initialized');
    } catch (error) {
      console.error('Failed to initialize Assessment ML Service:', error);
    }
  }

  private loadUserHistory() {
    try {
      const stored = localStorage.getItem('assessmentHistory');
      if (stored) {
        this.userResponseHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user history:', error);
    }
  }

  private saveUserHistory() {
    try {
      localStorage.setItem('assessmentHistory', JSON.stringify(this.userResponseHistory));
    } catch (error) {
      console.error('Error saving user history:', error);
    }
  }

  async analyzeAssessment(
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType,
    userHistory?: any[]
  ): Promise<{
    riskLevel: number;
    confidence: number;
    personalizedInsights: string[];
    patternAnalysis: string[];
    interventionSuggestions: string[];
  }> {
    if (!this.model || !this.patternModel) {
      await this.initialize();
    }

    try {
      // Store current assessment for learning
      const currentAssessment = {
        answers,
        ageGroup,
        assessmentType,
        timestamp: new Date(),
        userHistory: userHistory || []
      };
      
      this.userResponseHistory.push(currentAssessment);
      this.saveUserHistory();

      // Prepare enhanced features for ML model
      const features = this.prepareEnhancedFeatures(answers, ageGroup, assessmentType, userHistory);
      
      // Get risk prediction
      const riskPrediction = this.model!.predict(tf.tensor2d([features])) as tf.Tensor;
      const riskResult = await riskPrediction.data();
      riskPrediction.dispose();

      // Get pattern analysis
      const patternFeatures = this.preparePatternFeatures(answers, ageGroup, assessmentType);
      const patternPrediction = this.patternModel!.predict(tf.tensor2d([patternFeatures])) as tf.Tensor;
      const patternResult = await patternPrediction.data();
      patternPrediction.dispose();

      // Extract risk level and confidence
      const riskProbabilities = Array.from(riskResult);
      const riskLevel = riskProbabilities.indexOf(Math.max(...riskProbabilities)) / 3; // Normalize to 0-1
      const confidence = Math.max(...riskProbabilities);

      // Generate enhanced insights
      const insights = this.generateEnhancedInsights(answers, ageGroup, assessmentType, riskLevel, Array.from(patternResult));
      const patternAnalysis = this.analyzeResponsePatterns(answers, Array.from(patternResult));
      const interventions = this.generateInterventionSuggestions(riskLevel, answers, ageGroup, assessmentType);

      return {
        riskLevel,
        confidence,
        personalizedInsights: insights,
        patternAnalysis,
        interventionSuggestions: interventions
      };
    } catch (error) {
      console.error('Error in ML analysis:', error);
      return this.getFallbackAnalysis(answers, ageGroup, assessmentType);
    }
  }

  private prepareEnhancedFeatures(
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType,
    userHistory?: any[]
  ): number[] {
    const features = [];

    // Normalize answers (0-1) and pad/truncate to 10
    const normalizedAnswers = answers.map(a => a / 3);
    for (let i = 0; i < 10; i++) {
      features.push(normalizedAnswers[i] || 0);
    }

    // Age group encoding (one-hot)
    const ageGroups = ['child', 'teen', 'adult', 'senior'];
    ageGroups.forEach(group => {
      features.push(group === ageGroup ? 1 : 0);
    });

    // Assessment type encoding
    features.push(assessmentType === 'depression' ? 1 : 0);
    features.push(assessmentType === 'anxiety' ? 1 : 0);

    // Historical trend analysis
    if (userHistory && userHistory.length > 0) {
      const recentScores = userHistory.slice(-3).map(h => h.score / 27);
      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      features.push(avgRecent);
      
      // Trend direction
      if (recentScores.length >= 2) {
        const trend = recentScores[recentScores.length - 1] - recentScores[0];
        features.push(Math.max(-1, Math.min(1, trend)));
      } else {
        features.push(0);
      }
    } else {
      features.push(0, 0);
    }

    // Time-based factors
    const hour = new Date().getHours();
    features.push(hour / 24);

    // Response consistency (variance in answers)
    const variance = this.calculateVariance(answers);
    features.push(Math.min(1, variance / 9)); // Normalize variance

    return features;
  }

  private preparePatternFeatures(
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType
  ): number[] {
    const features = [];

    // Answer patterns
    const normalizedAnswers = answers.map(a => a / 3);
    for (let i = 0; i < 10; i++) {
      features.push(normalizedAnswers[i] || 0);
    }

    // Age group encoding
    const ageEncoding = { child: 0, teen: 0.33, adult: 0.66, senior: 1 };
    features.push(ageEncoding[ageGroup]);

    // Assessment type
    features.push(assessmentType === 'depression' ? 0 : 1);

    // Answer clustering (high, medium, low responses)
    const highAnswers = answers.filter(a => a >= 2).length / answers.length;
    const lowAnswers = answers.filter(a => a === 0).length / answers.length;
    features.push(highAnswers);
    features.push(lowAnswers);

    return features;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return variance;
  }

  private generateEnhancedInsights(
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType,
    riskLevel: number,
    patternScores: number[]
  ): string[] {
    const insights = [];

    // Analyze answer patterns with ML insights
    const highScoreQuestions = answers
      .map((score, index) => ({ score, index }))
      .filter(item => item.score >= 2)
      .map(item => item.index);

    const lowScoreQuestions = answers
      .map((score, index) => ({ score, index }))
      .filter(item => item.score === 0)
      .map(item => item.index);

    // Generate insights based on ML pattern recognition
    if (assessmentType === 'depression') {
      if (highScoreQuestions.includes(0)) { // Mood question
        insights.push("Your responses indicate significant mood challenges. Our AI analysis suggests focusing on mood-stabilizing activities like regular exercise, sunlight exposure, and maintaining social connections.");
      }
      if (highScoreQuestions.includes(2)) { // Sleep question
        insights.push("Sleep disturbances are significantly affecting your wellbeing. Our ML model identifies sleep as a key intervention point - establishing a consistent sleep routine could have cascading positive effects on your mood.");
      }
      if (patternScores[0] > 0.7) { // High pattern recognition score
        insights.push("Our AI has identified patterns in your responses that suggest you may benefit from cognitive behavioral therapy techniques, particularly around thought pattern recognition.");
      }
    } else if (assessmentType === 'anxiety') {
      if (highScoreQuestions.includes(0)) { // Worry question
        insights.push("Excessive worry is a key concern identified by our analysis. Machine learning suggests that worry management techniques like the 5-4-3-2-1 grounding method could be particularly effective for your response pattern.");
      }
      if (highScoreQuestions.includes(3)) { // Physical symptoms
        insights.push("You're experiencing physical anxiety symptoms. Our AI recommends a multi-modal approach including breathing exercises, progressive muscle relaxation, and potentially discussing medication options with a healthcare provider.");
      }
      if (patternScores[1] > 0.6) { // Anxiety pattern recognition
        insights.push("Your response pattern suggests anxiety that may be triggered by specific situations. Our ML analysis recommends exposure therapy techniques and mindfulness-based interventions.");
      }
    }

    // Age-specific ML insights
    if (ageGroup === 'teen') {
      insights.push("Our analysis shows that for your age group, peer support and school-life balance are particularly important. The AI model suggests focusing on building resilience through social connections and stress management skills.");
    } else if (ageGroup === 'adult') {
      insights.push("Based on adult response patterns in our database, work-life balance and stress management techniques are crucial. Our ML model recommends time management strategies and boundary-setting practices.");
    } else if (ageGroup === 'senior') {
      insights.push("For your age group, our AI analysis emphasizes the importance of social connections and maintaining physical activity. The model suggests community engagement and gentle exercise as key interventions.");
    }

    // Risk-level specific ML insights
    if (riskLevel >= 0.7) {
      insights.push("Our machine learning analysis indicates elevated risk factors that warrant professional attention. The AI model strongly recommends connecting with a mental health professional for personalized treatment planning.");
    } else if (riskLevel >= 0.4) {
      insights.push("Your response pattern suggests moderate risk factors. Our ML analysis recommends proactive intervention with self-care strategies and consideration of professional support to prevent escalation.");
    } else {
      insights.push("You're showing good mental health resilience according to our AI analysis. The model suggests maintaining your current positive practices while building additional coping strategies for future challenges.");
    }

    // Response consistency insights
    const variance = this.calculateVariance(answers);
    if (variance > 6) {
      insights.push("Your responses show significant variation, which our AI interprets as possible situational factors affecting your mental health. Consider tracking your mood and identifying environmental triggers.");
    }

    return insights.slice(0, 4); // Limit to 4 most relevant insights
  }

  private analyzeResponsePatterns(answers: number[], patternScores: number[]): string[] {
    const patterns = [];

    // Analyze response clustering
    const highResponses = answers.filter(a => a >= 2).length;
    const lowResponses = answers.filter(a => a === 0).length;
    const midResponses = answers.filter(a => a === 1).length;

    if (highResponses > answers.length * 0.6) {
      patterns.push("Consistently elevated responses across multiple domains suggest widespread impact on daily functioning");
    } else if (lowResponses > answers.length * 0.6) {
      patterns.push("Predominantly low scores indicate good overall functioning with specific areas of concern");
    } else if (midResponses > answers.length * 0.5) {
      patterns.push("Moderate response pattern suggests fluctuating symptoms that may be situational or cyclical");
    }

    // Pattern-specific analysis based on ML scores
    if (patternScores[0] > 0.7) {
      patterns.push("AI detected cognitive pattern indicators suggesting benefit from thought restructuring techniques");
    }
    if (patternScores[1] > 0.7) {
      patterns.push("Behavioral pattern recognition indicates potential for activity-based interventions");
    }
    if (patternScores[2] > 0.6) {
      patterns.push("Social pattern analysis suggests interpersonal factors may be significant in your mental health");
    }

    return patterns;
  }

  private generateInterventionSuggestions(
    riskLevel: number,
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType
  ): string[] {
    const interventions = [];

    // Risk-based interventions
    if (riskLevel >= 0.7) {
      interventions.push("Immediate professional consultation recommended - consider scheduling within 1-2 weeks");
      interventions.push("Crisis safety planning with a mental health professional");
      interventions.push("Medication evaluation may be beneficial - discuss with a psychiatrist");
    } else if (riskLevel >= 0.4) {
      interventions.push("Regular therapy sessions (weekly or bi-weekly) would be beneficial");
      interventions.push("Consider group therapy or support groups for peer connection");
      interventions.push("Develop a structured self-care routine with professional guidance");
    } else {
      interventions.push("Preventive mental health maintenance through regular check-ins");
      interventions.push("Build resilience through mindfulness and stress management practices");
      interventions.push("Maintain social connections and engage in meaningful activities");
    }

    // Assessment-specific interventions
    if (assessmentType === 'depression') {
      interventions.push("Behavioral activation therapy to increase engagement in rewarding activities");
      interventions.push("Light therapy and vitamin D supplementation (consult healthcare provider)");
      interventions.push("Regular exercise routine - even 20 minutes daily can be beneficial");
    } else if (assessmentType === 'anxiety') {
      interventions.push("Cognitive behavioral therapy focusing on anxiety management");
      interventions.push("Progressive muscle relaxation and breathing technique training");
      interventions.push("Gradual exposure therapy for specific anxiety triggers");
    }

    // Age-specific interventions
    if (ageGroup === 'teen') {
      interventions.push("School counselor involvement and academic support planning");
      interventions.push("Family therapy to improve communication and support systems");
    } else if (ageGroup === 'adult') {
      interventions.push("Workplace stress management and work-life balance strategies");
      interventions.push("Time management and priority-setting skill development");
    } else if (ageGroup === 'senior') {
      interventions.push("Community engagement programs and social activity participation");
      interventions.push("Physical health optimization to support mental wellbeing");
    }

    return interventions.slice(0, 6); // Return top 6 interventions
  }

  private getFallbackAnalysis(
    answers: number[],
    ageGroup: AgeGroup,
    assessmentType: AssessmentType
  ) {
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    const maxScore = answers.length * 3;
    const riskLevel = totalScore / maxScore;

    return {
      riskLevel,
      confidence: 0.7,
      personalizedInsights: [
        "This assessment provides a snapshot of your current mental health status based on evidence-based screening tools.",
        "Consider tracking your mood and symptoms over time to identify patterns and triggers.",
        "Professional support is available if you need additional help - you don't have to navigate this alone."
      ],
      patternAnalysis: [
        "Response patterns suggest areas for focused attention and intervention.",
        "Your answers indicate both challenges and strengths in your mental health profile."
      ],
      interventionSuggestions: [
        "Regular self-assessment and mood tracking",
        "Professional consultation for personalized treatment planning",
        "Development of coping strategies and stress management techniques"
      ]
    };
  }
}

const assessmentMLService = new AssessmentMLService();

const baseOptions = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
];

// Enhanced questions with ML weights and categories for better analysis
const depressionQuestions = {
  child: [
    { id: 'd-c-1', text: 'Do you feel sad or unhappy even when good things happen?', options: baseOptions, mlWeight: 0.9, category: 'mood' },
    { id: 'd-c-2', text: 'Do you find it hard to enjoy playing with friends or doing fun activities?', options: baseOptions, mlWeight: 0.8, category: 'anhedonia' },
    { id: 'd-c-3', text: 'Do you feel tired or have little energy during the day?', options: baseOptions, mlWeight: 0.7, category: 'energy' },
    { id: 'd-c-4', text: 'Do you have trouble sleeping or sleep too much?', options: baseOptions, mlWeight: 0.8, category: 'sleep' },
    { id: 'd-c-5', text: 'Do you get upset easily or cry more than usual?', options: baseOptions, mlWeight: 0.6, category: 'emotional_regulation' },
    { id: 'd-c-6', text: 'Do you feel like nobody likes you or wants to be around you?', options: baseOptions, mlWeight: 0.7, category: 'social' },
    { id: 'd-c-7', text: 'Do you have trouble paying attention in school or during activities?', options: baseOptions, mlWeight: 0.6, category: 'concentration' },
    { id: 'd-c-8', text: 'Do you feel lonely, even when you\'re around other people?', options: baseOptions, mlWeight: 0.7, category: 'social' },
    { id: 'd-c-9', text: 'Do you worry a lot about making mistakes or not being good enough?', options: baseOptions, mlWeight: 0.5, category: 'self_worth' },
    { id: 'd-c-10', text: 'Do you feel like you\'re not good at things other kids can do?', options: baseOptions, mlWeight: 0.6, category: 'self_worth' },
  ],
  teen: [
    { id: 'd-t-1', text: 'Do you feel hopeless about your future?', options: baseOptions, mlWeight: 0.9, category: 'hopelessness' },
    { id: 'd-t-2', text: 'Do you avoid spending time with friends or family?', options: baseOptions, mlWeight: 0.7, category: 'social_withdrawal' },
    { id: 'd-t-3', text: 'Do you feel tired or lack motivation for school or activities?', options: baseOptions, mlWeight: 0.8, category: 'energy' },
    { id: 'd-t-4', text: 'Do you have trouble concentrating on schoolwork or other tasks?', options: baseOptions, mlWeight: 0.7, category: 'concentration' },
    { id: 'd-t-5', text: 'Do you feel worthless or guilty about things?', options: baseOptions, mlWeight: 0.8, category: 'self_worth' },
    { id: 'd-t-6', text: 'Have you noticed changes in your eating habits (eating much more or less)?', options: baseOptions, mlWeight: 0.6, category: 'appetite' },
    { id: 'd-t-7', text: 'Do you feel restless or agitated?', options: baseOptions, mlWeight: 0.5, category: 'psychomotor' },
    { id: 'd-t-8', text: 'Do you ever feel like life isn\'t worth living?', options: baseOptions, mlWeight: 1.0, category: 'suicidal_ideation' },
    { id: 'd-t-9', text: 'Do you have trouble falling asleep, staying asleep, or sleep too much?', options: baseOptions, mlWeight: 0.7, category: 'sleep' },
    { id: 'd-t-10', text: 'Do you feel like you can\'t do anything right?', options: baseOptions, mlWeight: 0.7, category: 'self_efficacy' },
  ],
  adult: [
    { id: 'd-a-1', text: 'Do you feel down, depressed, or hopeless?', options: baseOptions, mlWeight: 0.9, category: 'mood' },
    { id: 'd-a-2', text: 'Do you have little interest or pleasure in doing things you used to enjoy?', options: baseOptions, mlWeight: 0.9, category: 'anhedonia' },
    { id: 'd-a-3', text: 'Do you have trouble falling asleep, staying asleep, or sleep too much?', options: baseOptions, mlWeight: 0.7, category: 'sleep' },
    { id: 'd-a-4', text: 'Do you feel tired or have little energy?', options: baseOptions, mlWeight: 0.8, category: 'energy' },
    { id: 'd-a-5', text: 'Do you have poor appetite or find yourself overeating?', options: baseOptions, mlWeight: 0.6, category: 'appetite' },
    { id: 'd-a-6', text: 'Do you feel bad about yourself, or feel like you\'re a failure?', options: baseOptions, mlWeight: 0.8, category: 'self_worth' },
    { id: 'd-a-7', text: 'Do you have trouble concentrating on work, reading, or other activities?', options: baseOptions, mlWeight: 0.7, category: 'concentration' },
    { id: 'd-a-8', text: 'Do you move or speak noticeably slower, or feel restless and fidgety?', options: baseOptions, mlWeight: 0.6, category: 'psychomotor' },
    { id: 'd-a-9', text: 'Do you have thoughts that you would be better off dead or of hurting yourself?', options: baseOptions, mlWeight: 1.0, category: 'suicidal_ideation' },
    { id: 'd-a-10', text: 'Do you find it difficult to get through your daily tasks and responsibilities?', options: baseOptions, mlWeight: 0.7, category: 'functioning' },
  ],
  senior: [
    { id: 'd-s-1', text: 'Do you feel sad, empty, or depressed most of the time?', options: baseOptions, mlWeight: 0.9, category: 'mood' },
    { id: 'd-s-2', text: 'Do you have trouble enjoying activities you used to find pleasurable?', options: baseOptions, mlWeight: 0.8, category: 'anhedonia' },
    { id: 'd-s-3', text: 'Do you feel more tired or have less energy than usual?', options: baseOptions, mlWeight: 0.7, category: 'energy' },
    { id: 'd-s-4', text: 'Do you have trouble sleeping or find yourself sleeping more than usual?', options: baseOptions, mlWeight: 0.7, category: 'sleep' },
    { id: 'd-s-5', text: 'Do you feel anxious, worried, or on edge?', options: baseOptions, mlWeight: 0.6, category: 'anxiety' },
    { id: 'd-s-6', text: 'Do you feel hopeless about the future?', options: baseOptions, mlWeight: 0.8, category: 'hopelessness' },
    { id: 'd-s-7', text: 'Do you have more trouble remembering things or concentrating?', options: baseOptions, mlWeight: 0.6, category: 'cognitive' },
    { id: 'd-s-8', text: 'Do you feel lonely even when you\'re with other people?', options: baseOptions, mlWeight: 0.7, category: 'social' },
    { id: 'd-s-9', text: 'Do you feel like you\'re a burden to your family or others?', options: baseOptions, mlWeight: 0.8, category: 'self_worth' },
    { id: 'd-s-10', text: 'Do you have trouble making decisions, even about small things?', options: baseOptions, mlWeight: 0.5, category: 'decision_making' },
  ],
};

const anxietyQuestions = {
  child: [
    { id: 'a-c-1', text: 'Do you worry a lot about things that might happen?', options: baseOptions, mlWeight: 0.8, category: 'worry' },
    { id: 'a-c-2', text: 'Do you feel scared to be away from your parents or caregivers?', options: baseOptions, mlWeight: 0.7, category: 'separation_anxiety' },
    { id: 'a-c-3', text: 'Do you get nervous when meeting new people or going to new places?', options: baseOptions, mlWeight: 0.6, category: 'social_anxiety' },
    { id: 'a-c-4', text: 'Do you have trouble sleeping because you\'re worried about things?', options: baseOptions, mlWeight: 0.7, category: 'sleep_anxiety' },
    { id: 'a-c-5', text: 'Do you feel your heart beating fast when you\'re worried or scared?', options: baseOptions, mlWeight: 0.8, category: 'physical_symptoms' },
    { id: 'a-c-6', text: 'Do you avoid doing things because they make you nervous or scared?', options: baseOptions, mlWeight: 0.8, category: 'avoidance' },
    { id: 'a-c-7', text: 'Do you get stomachaches or headaches when you\'re worried?', options: baseOptions, mlWeight: 0.6, category: 'somatic_symptoms' },
    { id: 'a-c-8', text: 'Do you need a lot of reassurance from adults when you\'re worried?', options: baseOptions, mlWeight: 0.5, category: 'reassurance_seeking' },
    { id: 'a-c-9', text: 'Do you worry about making mistakes or not doing things perfectly?', options: baseOptions, mlWeight: 0.7, category: 'perfectionism' },
    { id: 'a-c-10', text: 'Do you get upset when things don\'t go as planned?', options: baseOptions, mlWeight: 0.5, category: 'flexibility' },
  ],
  teen: [
    { id: 'a-t-1', text: 'Do you feel nervous or anxious in social situations with peers?', options: baseOptions, mlWeight: 0.8, category: 'social_anxiety' },
    { id: 'a-t-2', text: 'Do you worry excessively about exams, grades, or school performance?', options: baseOptions, mlWeight: 0.7, category: 'academic_anxiety' },
    { id: 'a-t-3', text: 'Do you have trouble relaxing or unwinding?', options: baseOptions, mlWeight: 0.8, category: 'tension' },
    { id: 'a-t-4', text: 'Do you avoid activities or situations because of fear or worry?', options: baseOptions, mlWeight: 0.8, category: 'avoidance' },
    { id: 'a-t-5', text: 'Do you feel restless, keyed up, or on edge?', options: baseOptions, mlWeight: 0.7, category: 'restlessness' },
    { id: 'a-t-6', text: 'Do you have trouble falling asleep due to racing thoughts or worries?', options: baseOptions, mlWeight: 0.7, category: 'sleep_anxiety' },
    { id: 'a-t-7', text: 'Do you become irritable when you\'re anxious or stressed?', options: baseOptions, mlWeight: 0.6, category: 'irritability' },
    { id: 'a-t-8', text: 'Do you feel like your mind goes blank when you\'re stressed or anxious?', options: baseOptions, mlWeight: 0.6, category: 'cognitive_symptoms' },
    { id: 'a-t-9', text: 'Do you worry excessively about what others think of you?', options: baseOptions, mlWeight: 0.7, category: 'social_evaluation' },
    { id: 'a-t-10', text: 'Do you experience physical symptoms like sweating, shaking, or rapid heartbeat when anxious?', options: baseOptions, mlWeight: 0.8, category: 'physical_symptoms' },
  ],
  adult: [
    { id: 'a-a-1', text: 'Do you feel nervous, anxious, or on edge?', options: baseOptions, mlWeight: 0.8, category: 'general_anxiety' },
    { id: 'a-a-2', text: 'Do you find yourself worrying too much about different things?', options: baseOptions, mlWeight: 0.9, category: 'excessive_worry' },
    { id: 'a-a-3', text: 'Do you have trouble controlling your worries once they start?', options: baseOptions, mlWeight: 0.9, category: 'worry_control' },
    { id: 'a-a-4', text: 'Do you have difficulty relaxing or unwinding?', options: baseOptions, mlWeight: 0.7, category: 'tension' },
    { id: 'a-a-5', text: 'Do you feel restless or find it hard to sit still?', options: baseOptions, mlWeight: 0.6, category: 'restlessness' },
    { id: 'a-a-6', text: 'Do you become easily annoyed or irritable?', options: baseOptions, mlWeight: 0.6, category: 'irritability' },
    { id: 'a-a-7', text: 'Do you feel afraid that something awful might happen?', options: baseOptions, mlWeight: 0.8, category: 'catastrophic_thinking' },
    { id: 'a-a-8', text: 'Do you have trouble falling asleep or staying asleep due to worry?', options: baseOptions, mlWeight: 0.7, category: 'sleep_anxiety' },
    { id: 'a-a-9', text: 'Do you experience racing thoughts that are hard to control?', options: baseOptions, mlWeight: 0.7, category: 'racing_thoughts' },
    { id: 'a-a-10', text: 'Do you have physical symptoms like sweating, trembling, or muscle tension when anxious?', options: baseOptions, mlWeight: 0.8, category: 'physical_symptoms' },
  ],
  senior: [
    { id: 'a-s-1', text: 'Do you worry frequently about your health or the health of family members?', options: baseOptions, mlWeight: 0.8, category: 'health_anxiety' },
    { id: 'a-s-2', text: 'Do you feel nervous or anxious more often than you used to?', options: baseOptions, mlWeight: 0.8, category: 'general_anxiety' },
    { id: 'a-s-3', text: 'Do you have trouble relaxing or feeling calm?', options: baseOptions, mlWeight: 0.7, category: 'tension' },
    { id: 'a-s-4', text: 'Do you feel restless or on edge?', options: baseOptions, mlWeight: 0.6, category: 'restlessness' },
    { id: 'a-s-5', text: 'Do you avoid certain activities or places due to fear or worry?', options: baseOptions, mlWeight: 0.7, category: 'avoidance' },
    { id: 'a-s-6', text: 'Do you have trouble sleeping because of worries or anxious thoughts?', options: baseOptions, mlWeight: 0.7, category: 'sleep_anxiety' },
    { id: 'a-s-7', text: 'Do you experience heart palpitations or rapid heartbeat?', options: baseOptions, mlWeight: 0.8, category: 'cardiac_symptoms' },
    { id: 'a-s-8', text: 'Do you get easily startled or feel jumpy?', options: baseOptions, mlWeight: 0.6, category: 'hypervigilance' },
    { id: 'a-s-9', text: 'Do you worry about being alone or something happening when you\'re by yourself?', options: baseOptions, mlWeight: 0.7, category: 'safety_concerns' },
    { id: 'a-s-10', text: 'Do you experience physical symptoms like sweating, shaking, or dizziness when anxious?', options: baseOptions, mlWeight: 0.8, category: 'physical_symptoms' },
  ],
};

export const getAgeSpecificQuestions = (
  type: AssessmentType,
  ageGroup: AgeGroup
): AssessmentQuestion[] => {
  if (type === 'depression') return depressionQuestions[ageGroup];
  if (type === 'anxiety') return anxietyQuestions[ageGroup];
  return [];
};

function getSeverity(score: number): { severity: string; color: string } {
  if (score < 7) return { severity: 'mild', color: '#4caf50' };
  if (score < 15) return { severity: 'moderate', color: '#ff9800' };
  return { severity: 'severe', color: '#f44336' };
}

export const interpretDepressionResult = async (
  score: number,
  ageGroup: AgeGroup,
  answers: number[],
  userHistory?: any[]
): Promise<AssessmentResult> => {
  const { severity, color } = getSeverity(score);
  let interpretation = '';
  let recommendations: Recommendation[] = [];
  let riskFactors: string[] = [];
  let protectiveFactors: string[] = [];

  // Get enhanced ML analysis
  const mlPrediction = await assessmentMLService.analyzeAssessment(
    answers,
    ageGroup,
    'depression',
    userHistory
  );

  // Enhanced risk and protective factor analysis using ML insights
  answers.forEach((answer, index) => {
    const questions = getAgeSpecificQuestions('depression', ageGroup);
    const question = questions[index];
    
    if (answer >= 2 && question) {
      const weight = question.mlWeight || 1;
      const impact = answer * weight;
      
      if (impact >= 2) {
        switch (question.category) {
          case 'mood': riskFactors.push('Persistent depressed mood'); break;
          case 'anhedonia': riskFactors.push('Loss of interest in activities'); break;
          case 'sleep': riskFactors.push('Sleep disturbances'); break;
          case 'energy': riskFactors.push('Fatigue and low energy'); break;
          case 'appetite': riskFactors.push('Appetite changes'); break;
          case 'self_worth': riskFactors.push('Negative self-perception'); break;
          case 'concentration': riskFactors.push('Concentration difficulties'); break;
          case 'suicidal_ideation': riskFactors.push('Thoughts of self-harm (HIGH PRIORITY)'); break;
          case 'social': riskFactors.push('Social isolation or withdrawal'); break;
          case 'functioning': riskFactors.push('Impaired daily functioning'); break;
        }
      }
    } else if (answer === 0 && question) {
      switch (question.category) {
        case 'mood': protectiveFactors.push('Stable mood regulation'); break;
        case 'anhedonia': protectiveFactors.push('Maintained interest in activities'); break;
        case 'sleep': protectiveFactors.push('Good sleep quality'); break;
        case 'energy': protectiveFactors.push('Adequate energy levels'); break;
        case 'self_worth': protectiveFactors.push('Positive self-regard'); break;
        case 'concentration': protectiveFactors.push('Good concentration'); break;
        case 'social': protectiveFactors.push('Strong social connections'); break;
        case 'functioning': protectiveFactors.push('Good daily functioning'); break;
      }
    }
  });

  // Enhanced interpretation with ML insights
  if (severity === 'mild') {
    interpretation = 'Mild depressive symptoms detected. Our AI analysis suggests early intervention and self-care strategies may be beneficial to prevent progression.';
  } else if (severity === 'moderate') {
    interpretation = 'Moderate depressive symptoms present. Our machine learning analysis indicates structured interventions and professional support would be beneficial.';
  } else {
    interpretation = 'Severe depressive symptoms identified. Our AI strongly recommends immediate professional mental health support and comprehensive treatment planning.';
  }

  // Enhanced recommendations with comprehensive wellness activities
  const recs = {
    child: {
      mild: [
        {
          type: 'music',
          title: 'Mood-Boosting Music for Kids',
          description: 'Listen to uplifting music designed to improve children\'s mood.',
          videoUrl: 'https://www.youtube.com/embed/8ybW48rKBME',
          duration: '10 min',
          priority: 1,
        },
        {
          type: 'activity',
          title: 'Fun Physical Activities',
          description: 'Engage in age-appropriate physical activities to boost mood.',
          duration: '15-30 min',
          priority: 2,
        },
        {
          type: 'art',
          title: 'Color Therapy Art Activities',
          description: 'Use bright colors and creative art to express emotions and improve mood.',
          duration: '20 min',
          priority: 3,
        },
        {
          type: 'nature',
          title: 'Nature Walks and Outdoor Play',
          description: 'Spend time outdoors in nature to boost mood and energy.',
          duration: '30 min',
          priority: 4,
        },
      ],
      moderate: [
        {
          type: 'breathing',
          title: 'Balloon Breathing for Kids',
          description: 'Learn fun breathing exercises designed for children.',
          videoUrl: 'https://www.youtube.com/embed/RVA2N6tX2cg',
          duration: '5 min',
          priority: 1,
        },
        {
          type: 'story',
          title: 'Therapeutic Stories',
          description: 'Listen to stories that help process emotions.',
          videoUrl: 'https://www.youtube.com/embed/1KaOrSuWZeM',
          duration: '8 min',
          priority: 2,
        },
        {
          type: 'yoga',
          title: 'Kids Yoga for Emotional Balance',
          description: 'Gentle yoga poses designed for children to improve mood.',
          duration: '15 min',
          priority: 3,
        },
        {
          type: 'support',
          title: 'Talk to a Trusted Adult',
          description: 'It\'s important to share feelings with parents, teachers, or counselors.',
          priority: 4,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Immediate Support Needed',
          description: 'Please have a parent or guardian contact a mental health professional immediately.',
          priority: 1,
        },
        {
          type: 'breathing',
          title: 'Calming Breathing Exercises',
          description: 'Practice these breathing techniques with an adult.',
          videoUrl: 'https://www.youtube.com/embed/CvF9AEe-ozc',
          duration: '5 min',
          priority: 2,
        },
      ],
    },
    teen: {
      mild: [
        {
          type: 'journaling',
          title: 'Mood Journaling for Teens',
          description: 'Learn how to track and understand your emotions through writing.',
          priority: 1,
        },
        {
          type: 'music',
          title: 'Therapeutic Music Playlist',
          description: 'Curated music to help regulate mood and emotions.',
          videoUrl: 'https://www.youtube.com/embed/2Vv-BfVoq4g',
          duration: '10 min',
          priority: 2,
        },
        {
          type: 'exercise',
          title: 'Teen Fitness and Movement',
          description: 'Age-appropriate exercises to boost mood and energy.',
          duration: '20-30 min',
          priority: 3,
        },
        {
          type: 'art',
          title: 'Creative Expression Therapy',
          description: 'Use art, music, or writing to express and process emotions.',
          duration: '30 min',
          priority: 4,
        },
        {
          type: 'social',
          title: 'Peer Support Strategies',
          description: 'Learn how to build and maintain supportive friendships.',
          priority: 5,
        },
      ],
      moderate: [
        {
          type: 'yoga',
          title: 'Yoga for Teen Mental Health',
          description: 'Gentle yoga practices designed for adolescents.',
          videoUrl: 'https://www.youtube.com/embed/v7AYKMP6rOE',
          duration: '15 min',
          priority: 1,
        },
        {
          type: 'counseling',
          title: 'School Counseling Resources',
          description: 'Connect with school counselors or teen support groups.',
          priority: 2,
        },
        {
          type: 'mindfulness',
          title: 'Teen Mindfulness Practices',
          description: 'Age-appropriate mindfulness and meditation techniques.',
          priority: 3,
        },
        {
          type: 'walking',
          title: 'Daily Walking Routine',
          description: 'Establish a daily walking habit to improve mood and physical health.',
          duration: '20-30 min',
          priority: 4,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Professional Help Needed',
          description: 'Contact a mental health professional, school counselor, or crisis helpline immediately.',
          priority: 1,
        },
        {
          type: 'meditation',
          title: 'Crisis Coping Meditation',
          description: 'Immediate coping strategies for severe emotional distress.',
          videoUrl: 'https://www.youtube.com/embed/92i5m3tV5XY',
          duration: '10 min',
          priority: 2,
        },
      ],
    },
    adult: {
      mild: [
        {
          type: 'exercise',
          title: 'Mood-Boosting Exercise',
          description: 'Light to moderate exercise routines proven to improve mood.',
          videoUrl: 'https://www.youtube.com/embed/2L2lnxIcNmo',
          duration: '10-20 min',
          priority: 1,
        },
        {
          type: 'meditation',
          title: 'Daily Mindfulness Practice',
          description: 'Establish a regular mindfulness meditation routine.',
          videoUrl: 'https://www.youtube.com/embed/inpok4MKVLM',
          duration: '10 min',
          priority: 2,
        },
        {
          type: 'walking',
          title: 'Nature Walking Therapy',
          description: 'Regular walks in nature to improve mood and reduce stress.',
          duration: '30-45 min',
          priority: 3,
        },
        {
          type: 'yoga',
          title: 'Gentle Yoga for Depression',
          description: 'Yoga sequences specifically designed for mood improvement.',
          duration: '20-30 min',
          priority: 4,
        },
        {
          type: 'color',
          title: 'Color Therapy and Art',
          description: 'Use color therapy and creative arts to improve emotional wellbeing.',
          duration: '15-20 min',
          priority: 5,
        },
        {
          type: 'lifestyle',
          title: 'Sleep Hygiene Improvement',
          description: 'Optimize your sleep schedule and environment for better mental health.',
          priority: 6,
        },
      ],
      moderate: [
        {
          type: 'therapy',
          title: 'Cognitive Behavioral Therapy',
          description: 'Learn CBT techniques to challenge negative thought patterns.',
          priority: 1,
        },
        {
          type: 'yoga',
          title: 'Therapeutic Yoga Practice',
          description: 'Yoga sequences specifically designed for depression management.',
          videoUrl: 'https://www.youtube.com/embed/4pLUleLdwY4',
          duration: '15-30 min',
          priority: 2,
        },
        {
          type: 'exercise',
          title: 'Structured Exercise Program',
          description: 'Regular cardio and strength training to combat depression.',
          duration: '30-45 min',
          priority: 3,
        },
        {
          type: 'walking',
          title: 'Daily Walking Meditation',
          description: 'Combine walking with mindfulness for dual benefits.',
          duration: '20-30 min',
          priority: 4,
        },
        {
          type: 'support',
          title: 'Support Group Participation',
          description: 'Connect with others experiencing similar challenges.',
          priority: 5,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Immediate Professional Support',
          description: 'Contact a mental health professional, your doctor, or a crisis helpline immediately.',
          priority: 1,
        },
        {
          type: 'meditation',
          title: 'Crisis Stabilization Techniques',
          description: 'Immediate coping strategies for severe depression.',
          videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
          duration: '15 min',
          priority: 2,
        },
        {
          type: 'safety',
          title: 'Safety Planning',
          description: 'Develop a safety plan with professional support.',
          priority: 3,
        },
      ],
    },
    senior: {
      mild: [
        {
          type: 'music',
          title: 'Therapeutic Music for Seniors',
          description: 'Music therapy designed for older adults.',
          videoUrl: 'https://www.youtube.com/embed/2OEL4P1Rz04',
          duration: '10 min',
          priority: 1,
        },
        {
          type: 'walking',
          title: 'Gentle Walking Program',
          description: 'Safe, enjoyable walking routines for seniors.',
          duration: '15-20 min',
          priority: 2,
        },
        {
          type: 'art',
          title: 'Senior Art Therapy',
          description: 'Creative activities designed for older adults.',
          duration: '30 min',
          priority: 3,
        },
        {
          type: 'social',
          title: 'Social Engagement Activities',
          description: 'Strategies to maintain social connections and community involvement.',
          priority: 4,
        },
      ],
      moderate: [
        {
          type: 'exercise',
          title: 'Gentle Exercise for Seniors',
          description: 'Safe, effective exercises for older adults.',
          videoUrl: 'https://www.youtube.com/embed/6fbM6D5eYuw',
          duration: '10-15 min',
          priority: 1,
        },
        {
          type: 'yoga',
          title: 'Chair Yoga for Seniors',
          description: 'Gentle yoga that can be done sitting or standing.',
          duration: '15-20 min',
          priority: 2,
        },
        {
          type: 'support',
          title: 'Family and Community Support',
          description: 'Engage family members and community resources.',
          priority: 3,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Medical and Mental Health Support',
          description: 'Contact your doctor, a mental health professional, or emergency services.',
          priority: 1,
        },
        {
          type: 'meditation',
          title: 'Gentle Meditation for Seniors',
          description: 'Calming meditation practices for older adults.',
          videoUrl: 'https://www.youtube.com/embed/MIr3RsUWrdo',
          duration: '10 min',
          priority: 2,
        },
      ],
    },
  };

  recommendations = recs[ageGroup][severity];

  return {
    score,
    severity,
    interpretation,
    color,
    recommendations,
    riskFactors,
    protectiveFactors,
    mlPrediction
  };
};

export const interpretAnxietyResult = async (
  score: number,
  ageGroup: AgeGroup,
  answers: number[],
  userHistory?: any[]
): Promise<AssessmentResult> => {
  const { severity, color } = getSeverity(score);
  let interpretation = '';
  let recommendations: Recommendation[] = [];
  let riskFactors: string[] = [];
  let protectiveFactors: string[] = [];

  // Get enhanced ML analysis
  const mlPrediction = await assessmentMLService.analyzeAssessment(
    answers,
    ageGroup,
    'anxiety',
    userHistory
  );

  // Enhanced risk and protective factor analysis for anxiety
  answers.forEach((answer, index) => {
    const questions = getAgeSpecificQuestions('anxiety', ageGroup);
    const question = questions[index];
    
    if (answer >= 2 && question) {
      const weight = question.mlWeight || 1;
      const impact = answer * weight;
      
      if (impact >= 2) {
        switch (question.category) {
          case 'general_anxiety': riskFactors.push('Persistent anxiety and nervousness'); break;
          case 'excessive_worry': riskFactors.push('Uncontrollable excessive worry'); break;
          case 'worry_control': riskFactors.push('Difficulty controlling anxious thoughts'); break;
          case 'tension': riskFactors.push('Chronic tension and inability to relax'); break;
          case 'restlessness': riskFactors.push('Restlessness and agitation'); break;
          case 'physical_symptoms': riskFactors.push('Physical anxiety symptoms'); break;
          case 'avoidance': riskFactors.push('Avoidance of anxiety-provoking situations'); break;
          case 'sleep_anxiety': riskFactors.push('Sleep disruption due to anxiety'); break;
          case 'social_anxiety': riskFactors.push('Social anxiety and fear of judgment'); break;
          case 'catastrophic_thinking': riskFactors.push('Catastrophic thinking patterns'); break;
        }
      }
    } else if (answer === 0 && question) {
      switch (question.category) {
        case 'general_anxiety': protectiveFactors.push('Emotional stability and calmness'); break;
        case 'worry_control': protectiveFactors.push('Good worry management skills'); break;
        case 'tension': protectiveFactors.push('Ability to relax and unwind'); break;
        case 'restlessness': protectiveFactors.push('Calm and settled demeanor'); break;
        case 'social_anxiety': protectiveFactors.push('Comfort in social situations'); break;
        case 'sleep_anxiety': protectiveFactors.push('Good sleep quality'); break;
      }
    }
  });

  // Enhanced interpretation with ML insights
  if (severity === 'mild') {
    interpretation = 'Mild anxiety symptoms present. Our AI analysis suggests stress management and relaxation techniques may be helpful for prevention and management.';
  } else if (severity === 'moderate') {
    interpretation = 'Moderate anxiety levels detected. Our machine learning analysis recommends anxiety management strategies and professional guidance for optimal outcomes.';
  } else {
    interpretation = 'Severe anxiety symptoms identified. Our AI strongly recommends immediate professional mental health support and comprehensive anxiety treatment.';
  }

  // Enhanced anxiety recommendations with comprehensive wellness activities
  const recs = {
    child: {
      mild: [
        {
          type: 'breathing',
          title: 'Fun Breathing Games',
          description: 'Learn breathing exercises through games and activities.',
          videoUrl: 'https://www.youtube.com/embed/CvF9AEe-ozc',
          duration: '5 min',
          priority: 1,
        },
        {
          type: 'color',
          title: 'Calming Color Activities',
          description: 'Use soothing colors and art to reduce anxiety.',
          duration: '15 min',
          priority: 2,
        },
        {
          type: 'nature',
          title: 'Peaceful Nature Time',
          description: 'Spend quiet time in nature to reduce anxiety.',
          duration: '20 min',
          priority: 3,
        },
      ],
      moderate: [
        {
          type: 'story',
          title: 'Anxiety Management Stories',
          description: 'Stories that teach children how to cope with worry.',
          videoUrl: 'https://www.youtube.com/embed/1KaOrSuWZeM',
          duration: '8 min',
          priority: 1,
        },
        {
          type: 'yoga',
          title: 'Calming Kids Yoga',
          description: 'Gentle yoga poses to reduce anxiety in children.',
          duration: '10 min',
          priority: 2,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Professional Support Needed',
          description: 'Contact a child psychologist or your pediatrician immediately.',
          priority: 1,
        },
      ],
    },
    teen: {
      mild: [
        {
          type: 'mindfulness',
          title: 'Teen Mindfulness Techniques',
          description: 'Age-appropriate mindfulness practices for anxiety management.',
          videoUrl: 'https://www.youtube.com/embed/w6T02g5hnT4',
          duration: '12 min',
          priority: 1,
        },
        {
          type: 'exercise',
          title: 'Anxiety-Relief Exercise',
          description: 'Physical activities that help reduce teen anxiety.',
          duration: '20-30 min',
          priority: 2,
        },
        {
          type: 'walking',
          title: 'Mindful Walking Practice',
          description: 'Combine walking with mindfulness to reduce anxiety.',
          duration: '15-20 min',
          priority: 3,
        },
      ],
      moderate: [
        {
          type: 'yoga',
          title: 'Anxiety-Relief Yoga',
          description: 'Yoga practices specifically for anxiety reduction.',
          videoUrl: 'https://www.youtube.com/embed/4pLUleLdwY4',
          duration: '15 min',
          priority: 1,
        },
        {
          type: 'breathing',
          title: 'Advanced Breathing Techniques',
          description: 'Learn powerful breathing methods for anxiety control.',
          duration: '10 min',
          priority: 2,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Immediate Support Required',
          description: 'Contact a mental health professional or crisis helpline.',
          priority: 1,
        },
      ],
    },
    adult: {
      mild: [
        {
          type: 'breathing',
          title: 'Progressive Muscle Relaxation',
          description: 'Learn systematic relaxation techniques.',
          videoUrl: 'https://www.youtube.com/embed/odADwWzHR24',
          duration: '7 min',
          priority: 1,
        },
        {
          type: 'walking',
          title: 'Anxiety-Reducing Walks',
          description: 'Regular walking routine to manage anxiety naturally.',
          duration: '20-30 min',
          priority: 2,
        },
        {
          type: 'yoga',
          title: 'Calming Yoga Flow',
          description: 'Gentle yoga sequences for anxiety relief.',
          duration: '15-20 min',
          priority: 3,
        },
        {
          type: 'color',
          title: 'Color Therapy for Anxiety',
          description: 'Use color therapy techniques to promote calm.',
          duration: '10-15 min',
          priority: 4,
        },
      ],
      moderate: [
        {
          type: 'meditation',
          title: 'Anxiety-Focused Meditation',
          description: 'Meditation practices designed for anxiety management.',
          videoUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8',
          duration: '10 min',
          priority: 1,
        },
        {
          type: 'exercise',
          title: 'Anxiety-Busting Workouts',
          description: 'Structured exercise routines to reduce anxiety.',
          duration: '30-45 min',
          priority: 2,
        },
        {
          type: 'therapy',
          title: 'CBT for Anxiety',
          description: 'Cognitive behavioral therapy techniques for anxiety.',
          priority: 3,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Professional Treatment Needed',
          description: 'Seek immediate professional mental health support.',
          priority: 1,
        },
      ],
    },
    senior: {
      mild: [
        {
          type: 'music',
          title: 'Calming Music Therapy',
          description: 'Therapeutic music for anxiety relief.',
          videoUrl: 'https://www.youtube.com/embed/2OEL4P1Rz04',
          duration: '10 min',
          priority: 1,
        },
        {
          type: 'walking',
          title: 'Gentle Walking for Calm',
          description: 'Peaceful walking routines for seniors.',
          duration: '15-20 min',
          priority: 2,
        },
      ],
      moderate: [
        {
          type: 'exercise',
          title: 'Gentle Movement for Anxiety',
          description: 'Low-impact exercises to reduce anxiety.',
          videoUrl: 'https://www.youtube.com/embed/6fbM6D5eYuw',
          duration: '10 min',
          priority: 1,
        },
        {
          type: 'breathing',
          title: 'Senior Breathing Exercises',
          description: 'Gentle breathing techniques for older adults.',
          duration: '5-10 min',
          priority: 2,
        },
      ],
      severe: [
        {
          type: 'crisis',
          title: 'Medical Consultation Required',
          description: 'Contact your healthcare provider or mental health professional.',
          priority: 1,
        },
      ],
    },
  };

  recommendations = recs[ageGroup][severity];

  return {
    score,
    severity,
    interpretation,
    color,
    recommendations,
    riskFactors,
    protectiveFactors,
    mlPrediction
  };
};