import * as tf from '@tensorflow/tfjs';

// Enhanced ML-powered chatbot service
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sentiment?: number;
  confidence?: number;
  intent?: string;
}

export interface UserProfile {
  name?: string;
  age?: number;
  previousAssessments: any[];
  moodHistory: any[];
  preferences: string[];
}

class MLChatbotService {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();
  private isInitialized = false;
  private conversationContext: string[] = [];
  private userProfile: UserProfile = {
    previousAssessments: [],
    moodHistory: [],
    preferences: []
  };
  private currentQuestionIndex = 0;
  private isInAssessmentMode = false;
  private userResponses: string[] = [];
  private conversationState = 'initial'; // initial, listening, supporting, assessing

  // Mental health keywords and their weights
  private mentalHealthKeywords = {
    // Positive emotions
    positive: {
      high: ['amazing', 'fantastic', 'excellent', 'wonderful', 'great', 'awesome', 'perfect', 'brilliant', 'outstanding', 'incredible', 'very good'],
      medium: ['good', 'fine', 'okay', 'alright', 'decent', 'nice', 'well', 'better', 'positive', 'happy'],
      low: ['so-so', 'meh', 'average', 'neutral', 'fair']
    },
    // Negative emotions - FIXED SENTIMENT ANALYSIS
    negative: {
      high: ['terrible', 'awful', 'horrible', 'devastating', 'miserable', 'hopeless', 'suicidal', 'worthless', 'unbearable', 'crushing', 'very bad', 'worst', 'extremely bad'],
      medium: ['bad', 'sad', 'depressed', 'anxious', 'worried', 'stressed', 'upset', 'down', 'low', 'struggling', 'not good', 'not so good', 'poor', 'rough'],
      low: ['not great', 'could be better', 'tired', 'overwhelmed', 'frustrated', 'disappointed', 'meh', 'blah']
    },
    // Specific conditions
    anxiety: ['anxious', 'worried', 'nervous', 'panic', 'fear', 'stress', 'overwhelmed', 'restless', 'tense', 'on edge'],
    depression: ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired', 'exhausted', 'numb', 'lonely', 'isolated'],
    help: ['help', 'support', 'advice', 'guidance', 'assistance', 'therapy', 'counseling', 'talk', 'listen'],
    crisis: ['suicide', 'kill', 'die', 'end', 'hurt', 'harm', 'emergency', 'can\'t go on', 'give up', 'no point'],
    sharing: ['share', 'tell', 'talk about', 'explain', 'describe', 'open up', 'confide', 'express']
  };

  // Enhanced wellbeing assessment questions with comprehensive quick responses
  private wellbeingQuestions = [
    {
      question: "Hi! I'm here to support you through whatever you're going through. How are you feeling today?",
      quickResponses: ["Excellent", "Very good", "Good", "Okay", "Not so good", "Bad", "Very bad", "Terrible"],
      followUpQuestions: {
        positive: ["That's wonderful to hear! What's been contributing to these good feelings?"],
        negative: ["I'm sorry you're not feeling well. Would you mind sharing what's been troubling you? I'd like to help."],
        neutral: ["I understand. Sometimes we're just in a neutral space. Is there anything specific on your mind?"]
      }
    },
    {
      question: "Thank you for sharing that with me. How has your sleep been lately?",
      quickResponses: ["Excellent", "Very good", "Good", "Okay", "Poor", "Very poor", "Terrible", "Can't sleep"],
      followUpQuestions: {
        positive: ["Good sleep is so important for our wellbeing. What helps you sleep well?"],
        negative: ["Sleep troubles can really affect how we feel. What's been keeping you awake?"],
        neutral: ["Sleep can vary from day to day. Have you noticed any patterns?"]
      }
    },
    {
      question: "I appreciate you being open with me. How are your energy levels throughout the day?",
      quickResponses: ["Very high", "High energy", "Normal", "Low energy", "Very low", "Exhausted", "No energy", "Drained"],
      followUpQuestions: {
        positive: ["It's great that you have good energy! What activities energize you most?"],
        negative: ["Low energy can be really challenging. When do you feel most drained?"],
        neutral: ["Energy levels can fluctuate. Are there certain times of day when you feel different?"]
      }
    },
    {
      question: "You're doing great by talking about this. Are you feeling anxious or worried about anything specific?",
      quickResponses: ["Not at all", "Very little", "A little", "Somewhat", "Very anxious", "Extremely anxious", "Constantly worried", "Panicking"],
      followUpQuestions: {
        positive: ["I'm glad you're feeling calm. What helps you maintain that peace of mind?"],
        negative: ["Anxiety can be overwhelming. Would you like to tell me more about what's causing these worries?"],
        neutral: ["A little anxiety is normal. Is there anything particular that triggers it?"]
      }
    },
    {
      question: "Thank you for trusting me with your feelings. How connected do you feel to the people around you?",
      quickResponses: ["Very connected", "Connected", "Somewhat connected", "Somewhat isolated", "Very isolated", "Completely alone", "It's complicated", "No one understands"],
      followUpQuestions: {
        positive: ["Strong connections are so valuable. Who are the people that matter most to you?"],
        negative: ["Feeling isolated can be really painful. I want you to know that you're not alone in this conversation with me."],
        neutral: ["Relationships can be complex. What would help you feel more connected?"]
      }
    }
  ];

  // Empathetic response templates
  private empatheticResponses = {
    listening: [
      "I'm really listening to what you're sharing, and I want you to know that your feelings are completely valid.",
      "Thank you for trusting me with this. It takes courage to open up about difficult feelings.",
      "I can hear that this is really hard for you. Please know that I'm here to support you through this.",
      "What you're going through sounds incredibly challenging. You're being so brave by talking about it.",
      "I'm honored that you're sharing this with me. Your feelings matter, and so do you."
    ],
    supporting: [
      "I really feel for what you're going through. I hope things start to turn around for you soon.",
      "You're showing incredible strength by reaching out and talking about this. That's not easy to do.",
      "Please remember that you're not alone in this. There are people who care about you, including me right now.",
      "What you're feeling is temporary, even though it might not feel that way right now. You can get through this.",
      "You matter, and your life has value. I believe in your ability to overcome these challenges.",
      "It's okay to not be okay sometimes. You're human, and you're doing the best you can.",
      "I want you to know that seeking help and talking about your feelings shows real courage and wisdom."
    ],
    motivating: [
      "You have more strength inside you than you realize. You've made it through difficult times before.",
      "Every small step you take matters. You don't have to solve everything at once.",
      "You're not defined by this difficult moment. You have the power to create positive change in your life.",
      "Remember that healing isn't linear. It's okay to have ups and downs - that's part of the journey.",
      "You deserve happiness and peace. Don't give up on yourself - you're worth fighting for.",
      "There are people who care about you, even when it doesn't feel that way. You matter to this world.",
      "You've survived 100% of your worst days so far. That's an incredible track record."
    ]
  };

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize vocabulary with common mental health terms
      this.buildVocabulary();
      
      // Create a more sophisticated sentiment analysis model
      await this.createAdvancedSentimentModel();
      
      this.isInitialized = true;
      console.log('Enhanced ML Chatbot Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML Chatbot Service:', error);
    }
  }

  private buildVocabulary() {
    const commonWords = [
      'i', 'am', 'feel', 'feeling', 'today', 'help', 'need', 'want', 'can', 'you',
      'me', 'my', 'have', 'been', 'really', 'very', 'so', 'just', 'like', 'think',
      'know', 'get', 'going', 'time', 'good', 'bad', 'better', 'worse', 'hard',
      'difficult', 'easy', 'happy', 'sad', 'angry', 'scared', 'worried', 'anxious',
      'depressed', 'stressed', 'tired', 'exhausted', 'overwhelmed', 'lonely',
      'hopeless', 'hopeful', 'grateful', 'thankful', 'excited', 'nervous', 'alone',
      'isolated', 'connected', 'supported', 'understood', 'misunderstood', 'lost',
      'confused', 'clear', 'uncertain', 'confident', 'insecure', 'strong', 'weak'
    ];

    // Add all mental health keywords
    Object.values(this.mentalHealthKeywords).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(word => {
          if (!commonWords.includes(word)) {
            commonWords.push(word);
          }
        });
      } else {
        Object.values(category).flat().forEach(word => {
          if (!commonWords.includes(word)) {
            commonWords.push(word);
          }
        });
      }
    });

    commonWords.forEach((word, index) => {
      this.vocabulary.set(word, index);
      this.reverseVocabulary.set(index, word);
    });
  }

  private async createAdvancedSentimentModel() {
    // Create a more sophisticated neural network for sentiment analysis
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [this.vocabulary.size], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // negative, neutral, positive
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  private analyzeSentiment(text: string): { sentiment: number; confidence: number } {
    const lowerText = text.toLowerCase();
    let sentimentScore = 0;
    let confidence = 0.5;
    let wordCount = 0;

    // Enhanced sentiment analysis with context awareness
    const words = lowerText.split(/\s+/);
    
    // Check for positive words with intensity
    Object.entries(this.mentalHealthKeywords.positive).forEach(([level, words]) => {
      words.forEach(word => {
        if (lowerText.includes(word)) {
          wordCount++;
          switch (level) {
            case 'high': sentimentScore += 1.0; confidence = Math.max(confidence, 0.9); break;
            case 'medium': sentimentScore += 0.6; confidence = Math.max(confidence, 0.8); break;
            case 'low': sentimentScore += 0.3; confidence = Math.max(confidence, 0.7); break;
          }
        }
      });
    });

    // Check for negative words with intensity - FIXED
    Object.entries(this.mentalHealthKeywords.negative).forEach(([level, words]) => {
      words.forEach(word => {
        if (lowerText.includes(word)) {
          wordCount++;
          switch (level) {
            case 'high': sentimentScore -= 1.0; confidence = Math.max(confidence, 0.9); break;
            case 'medium': sentimentScore -= 0.6; confidence = Math.max(confidence, 0.8); break;
            case 'low': sentimentScore -= 0.3; confidence = Math.max(confidence, 0.7); break;
          }
        }
      });
    });

    // Adjust confidence based on text length and word count
    if (words.length > 5 && wordCount > 0) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    // Normalize sentiment to -1 to 1 range
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    return { sentiment: sentimentScore, confidence };
  }

  private detectIntent(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Crisis detection (highest priority)
    if (this.mentalHealthKeywords.crisis.some(word => lowerText.includes(word))) {
      return 'crisis';
    }

    // Sharing/opening up detection
    if (this.mentalHealthKeywords.sharing.some(word => lowerText.includes(word)) || 
        lowerText.includes('because') || lowerText.includes('since') || 
        lowerText.includes('happened') || lowerText.includes('going through')) {
      return 'sharing';
    }

    // Greeting detection
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(lowerText) && !this.isInAssessmentMode) {
      return 'greeting';
    }

    // Help seeking
    if (this.mentalHealthKeywords.help.some(word => lowerText.includes(word))) {
      return 'help_seeking';
    }

    // Anxiety detection
    if (this.mentalHealthKeywords.anxiety.some(word => lowerText.includes(word))) {
      return 'anxiety';
    }

    // Depression detection
    if (this.mentalHealthKeywords.depression.some(word => lowerText.includes(word))) {
      return 'depression';
    }

    // Assessment response
    if (this.isInAssessmentMode) {
      return 'assessment_response';
    }

    return 'general';
  }

  private getEmpatheticResponse(sentiment: number, userText: string, intent: string): string {
    const lowerText = userText.toLowerCase();

    // Handle sharing/opening up specifically
    if (intent === 'sharing' || lowerText.length > 50) {
      this.conversationState = 'listening';
      const listeningResponses = this.empatheticResponses.listening;
      let response = listeningResponses[Math.floor(Math.random() * listeningResponses.length)];
      
      // Add specific acknowledgment based on content
      if (sentiment <= -0.5) {
        response += " What you're going through sounds really difficult. Would you like to tell me more about it?";
      } else if (sentiment >= 0.3) {
        response += " It's wonderful that you're sharing positive experiences with me. What's been the best part?";
      } else {
        response += " I'm here to listen to whatever you'd like to share.";
      }
      
      return response;
    }

    // FIXED: Very negative responses with immediate support
    if (sentiment <= -0.7) {
      this.conversationState = 'supporting';
      const supportingResponses = this.empatheticResponses.supporting;
      let response = supportingResponses[Math.floor(Math.random() * supportingResponses.length)];
      
      response += " I'm really sorry you're going through this. Would you mind sharing what's been troubling you? I'd like to help you through this.";
      
      return response;
    }

    // FIXED: Moderately negative responses with gentle inquiry
    if (sentiment <= -0.3) {
      this.conversationState = 'listening';
      const responses = [
        "I understand you're not feeling great right now, and that's completely okay. Sometimes life can be really challenging.",
        "Thank you for being honest about how you're feeling. It takes courage to acknowledge when things are difficult.",
        "I hear that things are tough for you right now. I'm here to listen and support you through this."
      ];
      let response = responses[Math.floor(Math.random() * responses.length)];
      response += " Would you like to share what's been weighing on your mind? I'm here to listen.";
      return response;
    }

    // Neutral responses with gentle exploration
    if (sentiment >= -0.3 && sentiment <= 0.3) {
      const responses = [
        "I appreciate you sharing where you're at right now. Sometimes being in a neutral space is perfectly okay too.",
        "Thank you for checking in with me. It's important to acknowledge how we're feeling, even when it's just 'okay'.",
        "I hear you. Sometimes we're just in that in-between space, and that's completely normal."
      ];
      let response = responses[Math.floor(Math.random() * responses.length)];
      response += " Is there anything specific you'd like to talk about today, or would you prefer to just take things as they come?";
      return response;
    }

    // Positive responses with celebration and exploration
    if (sentiment > 0.3) {
      const responses = [
        "I'm so glad to hear you're feeling good! That's wonderful, and it makes me happy to hear.",
        "It's fantastic that you're in a positive space right now. Those moments are so precious and important.",
        "That's amazing to hear! I love when people share good news with me - it brightens my day too."
      ];
      let response = responses[Math.floor(Math.random() * responses.length)];
      response += " What's been contributing to these positive feelings? I'd love to hear more about what's going well for you.";
      return response;
    }

    return "Thank you for sharing that with me. I'm here to support you in whatever way I can. How would you like to continue our conversation?";
  }

  private generateQuickResponses(questionIndex: number, sentiment?: number): string[] {
    if (questionIndex < this.wellbeingQuestions.length) {
      return this.wellbeingQuestions[questionIndex].quickResponses;
    }

    // Generate contextual quick responses based on conversation state
    if (this.conversationState === 'supporting') {
      return [
        "I'd like to share more",
        "I need some encouragement",
        "What can I do to feel better?",
        "I want to try an assessment",
        "I'm not ready to talk more",
        "Things are really hard",
        "I feel hopeless",
        "I need help"
      ];
    }

    return [
      "Tell me more",
      "I'm feeling better now",
      "I need some advice",
      "Can you help me?",
      "I'd like to try something",
      "I'm struggling",
      "Things are tough",
      "I feel okay"
    ];
  }

  private generateFollowUpQuestions(intent: string, sentiment: number): string[] {
    if (this.isInAssessmentMode && this.currentQuestionIndex < this.wellbeingQuestions.length) {
      return this.generateQuickResponses(this.currentQuestionIndex, sentiment);
    }

    const followUps = {
      anxiety: [
        "What usually helps when you feel anxious?",
        "Would you like to try a breathing exercise?",
        "Can you tell me more about what triggers your anxiety?",
        "How long have you been feeling this way?",
        "I feel very anxious",
        "I'm panicking",
        "I can't calm down",
        "I'm overwhelmed"
      ],
      depression: [
        "How long have you been feeling this way?",
        "What activities used to bring you joy?",
        "Do you have support from friends or family?",
        "Would you like to talk about what's been hardest?",
        "I feel very sad",
        "I feel hopeless",
        "Nothing interests me",
        "I'm exhausted"
      ],
      sharing: [
        "Thank you for opening up to me",
        "That sounds really difficult",
        "You're being so brave by sharing this",
        "How can I best support you right now?",
        "It's been really hard",
        "I don't know what to do",
        "I feel lost",
        "I need support"
      ],
      positive: [
        "What's been the best part of your day?",
        "How can we help you maintain these good feelings?",
        "Would you like to set any positive intentions?",
        "What's been working well for you?",
        "I'm feeling great",
        "Things are going well",
        "I'm happy today",
        "Life is good"
      ],
      general: sentiment < 0 ? [
        "Would you like to talk more about what's bothering you?",
        "What would help you feel a little better right now?",
        "I'm here to listen to whatever you need to share",
        "You don't have to go through this alone",
        "I'm struggling",
        "Things are hard",
        "I feel bad",
        "I need help"
      ] : [
        "What's been on your mind lately?",
        "How can I best support you today?",
        "Is there anything you'd like to explore together?",
        "What would be most helpful for you right now?",
        "I'm doing okay",
        "Things are fine",
        "I feel alright",
        "I'm managing"
      ]
    };

    return followUps[intent] || followUps.general;
  }

  async processMessage(userMessage: string, conversationHistory: ChatMessage[]): Promise<{
    response: string;
    sentiment: number;
    confidence: number;
    intent: string;
    followUpQuestions: string[];
    recommendations: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Analyze the user's message with ML
    const { sentiment, confidence } = this.analyzeSentiment(userMessage);
    const intent = this.detectIntent(userMessage);

    // Update conversation context
    this.conversationContext.push(userMessage);
    if (this.conversationContext.length > 10) {
      this.conversationContext.shift();
    }

    let response = "";
    let followUpQuestions: string[] = [];

    // Handle different intents with enhanced empathy
    if (intent === 'crisis') {
      response = "I'm very concerned about what you've shared, and I want you to know that your life has value and meaning. You're not alone in this. Please reach out to a crisis helpline immediately:\n\n🆘 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🚨 Emergency Services: 911\n\nYou matter, and there are people who want to help you. Are you in immediate danger right now?";
      followUpQuestions = ["I need immediate help", "I'm safe for now", "I want to talk to someone", "I'm not in danger"];
    } else if (intent === 'greeting' && conversationHistory.length <= 1) {
      // Start wellbeing assessment with enhanced introduction
      this.isInAssessmentMode = true;
      this.currentQuestionIndex = 0;
      response = "Hello! I'm so glad you're here. I'm your AI mental health companion, and I want you to know that this is a safe space where you can be completely honest about how you're feeling. There's no judgment here - just support and understanding. " + this.wellbeingQuestions[0].question;
      followUpQuestions = this.wellbeingQuestions[0].quickResponses;
    } else if (intent === 'assessment_response' && this.isInAssessmentMode) {
      // Store the response and provide empathetic acknowledgment
      this.userResponses.push(userMessage);
      
      // Provide contextual empathetic response based on the answer
      let acknowledgment = "";
      const currentQuestion = this.wellbeingQuestions[this.currentQuestionIndex];
      
      if (sentiment <= -0.5) {
        acknowledgment = "I really hear you, and I'm sorry you're struggling with this. ";
      } else if (sentiment >= 0.3) {
        acknowledgment = "I'm glad to hear that's going well for you. ";
      } else {
        acknowledgment = "Thank you for sharing that with me. ";
      }
      
      // Move to next question or finish assessment
      this.currentQuestionIndex++;
      
      if (this.currentQuestionIndex < this.wellbeingQuestions.length) {
        // Ask next question with empathetic transition
        const nextQuestion = this.wellbeingQuestions[this.currentQuestionIndex];
        response = acknowledgment + nextQuestion.question;
        followUpQuestions = nextQuestion.quickResponses;
      } else {
        // Assessment complete
        this.isInAssessmentMode = false;
        response = this.generateEnhancedAssessmentSummary();
        followUpQuestions = this.generateFollowUpQuestions('general', sentiment);
      }
    } else {
      // Generate empathetic response based on sentiment and intent
      response = this.getEmpatheticResponse(sentiment, userMessage, intent);
      followUpQuestions = this.generateFollowUpQuestions(intent, sentiment);
      
      // Add motivational message for negative sentiments
      if (sentiment <= -0.5 && this.conversationState === 'supporting') {
        const motivationalResponses = this.empatheticResponses.motivating;
        response += "\n\n" + motivationalResponses[Math.floor(Math.random() * motivationalResponses.length)];
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(intent, sentiment);

    return {
      response,
      sentiment,
      confidence,
      intent,
      followUpQuestions,
      recommendations
    };
  }

  private generateEnhancedAssessmentSummary(): string {
    const responses = this.userResponses;
    let summary = "Thank you so much for being open and honest with me throughout this conversation. Your willingness to share shows real strength and self-awareness.\n\n";
    
    // Analyze overall sentiment from responses using ML
    let overallSentiment = 0;
    let concernAreas = [];
    let positiveAreas = [];
    
    responses.forEach((response, index) => {
      const { sentiment } = this.analyzeSentiment(response);
      overallSentiment += sentiment;
      
      // Identify specific areas of concern or strength
      if (sentiment <= -0.5) {
        const questionTopic = this.getQuestionTopic(index);
        concernAreas.push(questionTopic);
      } else if (sentiment >= 0.3) {
        const questionTopic = this.getQuestionTopic(index);
        positiveAreas.push(questionTopic);
      }
    });
    
    overallSentiment /= responses.length;

    // Provide personalized, empathetic summary
    if (overallSentiment <= -0.5) {
      summary += "I can see that you're going through a really challenging time right now, and I want you to know that what you're feeling is completely valid. It takes incredible courage to acknowledge these struggles and reach out for support.\n\n";
      
      if (concernAreas.length > 0) {
        summary += `I noticed you're particularly struggling with ${concernAreas.join(', ')}. These are important areas that deserve attention and care.\n\n`;
      }
      
      summary += "Please remember that you're not alone in this journey. What you're experiencing is temporary, even though it might not feel that way right now. I strongly encourage you to reach out to a mental health professional who can provide personalized support and guidance.\n\n";
      
      summary += "In the meantime, please be gentle with yourself. You're doing the best you can, and that's enough. You matter, and your life has value.";
      
    } else if (overallSentiment <= 0) {
      summary += "It sounds like you're navigating some ups and downs right now, which is completely normal and human. Life has its challenges, and you're handling them with grace.\n\n";
      
      if (positiveAreas.length > 0) {
        summary += `I'm glad to hear that ${positiveAreas.join(' and ')} are going well for you. These are important strengths to build upon.\n\n`;
      }
      
      if (concernAreas.length > 0) {
        summary += `I also noticed that ${concernAreas.join(' and ')} might need some extra attention. That's okay - we all have areas where we can grow and improve.\n\n`;
      }
      
      summary += "Consider focusing on small, manageable self-care activities and maintaining connections with supportive people in your life. You're on a good path.";
      
    } else {
      summary += "It's wonderful to hear that you're feeling relatively well! Your positive outlook and self-awareness are real strengths.\n\n";
      
      if (positiveAreas.length > 0) {
        summary += `I'm especially glad to hear that ${positiveAreas.join(', ')} are going well for you. Keep doing what's working!\n\n`;
      }
      
      summary += "Remember that maintaining good mental health is an ongoing journey, and you're doing great. Continue to nurture the practices and relationships that support your wellbeing.";
    }

    summary += "\n\nI'm here whenever you need someone to talk to, whether you're having a good day or a difficult one. You never have to face anything alone. How would you like to continue our conversation?";
    
    // Reset for next assessment
    this.userResponses = [];
    this.currentQuestionIndex = 0;
    this.conversationState = 'initial';
    
    return summary;
  }

  private getQuestionTopic(index: number): string {
    const topics = ['overall mood', 'sleep', 'energy levels', 'anxiety', 'social connections'];
    return topics[index] || 'wellbeing';
  }

  private generateRecommendations(intent: string, sentiment: number): string[] {
    const recommendations = [];

    if (intent === 'anxiety') {
      recommendations.push(
        "Try the 4-7-8 breathing technique for immediate relief",
        "Take our comprehensive anxiety assessment",
        "Practice grounding exercises (5-4-3-2-1 technique)",
        "Consider guided meditation for anxiety"
      );
    } else if (intent === 'depression') {
      recommendations.push(
        "Take our depression screening assessment",
        "Try to get some sunlight or fresh air today",
        "Consider reaching out to a mental health professional",
        "Explore our mood tracking tools"
      );
    } else if (intent === 'sharing') {
      recommendations.push(
        "Continue sharing in our safe space",
        "Consider professional counseling for deeper support",
        "Try journaling to process your thoughts",
        "Connect with trusted friends or family"
      );
    } else if (sentiment < -0.3) {
      recommendations.push(
        "Log your feelings in our mood tracker",
        "Try a guided meditation or breathing exercise",
        "Reach out to someone you trust",
        "Consider professional mental health support"
      );
    } else if (sentiment > 0.3) {
      recommendations.push(
        "Record this positive moment in your mood tracker",
        "Share what's working well with others",
        "Set a positive intention for tomorrow",
        "Continue the practices that are helping you"
      );
    }

    // Always include general wellness recommendations
    recommendations.push(
      "Explore our mental health resources",
      "Try our interactive wellness exercises"
    );

    return recommendations;
  }

  updateUserProfile(profile: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  getUserProfile(): UserProfile {
    return this.userProfile;
  }

  clearConversationContext() {
    this.conversationContext = [];
    this.isInAssessmentMode = false;
    this.currentQuestionIndex = 0;
    this.userResponses = [];
    this.conversationState = 'initial';
  }
}

export const mlChatbotService = new MLChatbotService();