"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy, BookOpen } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What should you do if you receive an email claiming your account will be suspended unless you click a link immediately?',
    options: [
      'Click the link immediately to save your account',
      'Verify through the company\'s official website or app',
      'Reply to the email asking for more information',
      'Ignore it completely'
    ],
    correctAnswer: 1,
    explanation: 'Always verify urgent requests through official channels, not email links. Contact the company directly using known contact information.',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    question: 'Which of these email addresses looks suspicious?',
    options: [
      'support@paypal.com',
      'security@paypal-support.com',
      'help@paypal.com',
      'info@paypal.com'
    ],
    correctAnswer: 1,
    explanation: 'The domain "paypal-support.com" is not the official PayPal domain (paypal.com). Official emails come from @paypal.com.',
    difficulty: 'easy'
  },
  {
    id: 'q3',
    question: 'A bank email asks for your password to "verify your identity." What should you do?',
    options: [
      'Provide your password as requested',
      'Call the bank using the number on your card',
      'Reply with a different password',
      'Send a screenshot of your login page'
    ],
    correctAnswer: 1,
    explanation: 'Banks never ask for passwords via email. Always contact them using official phone numbers from your card or statements.',
    difficulty: 'easy'
  },
  {
    id: 'q4',
    question: 'You receive an email with a link that looks like "https://paypal.com/secure-login". How can you verify it\'s safe?',
    options: [
      'Click it immediately since it has HTTPS',
      'Hover over the link to see the real URL',
      'Check if it has a padlock icon',
      'Trust it because it says "paypal.com"'
    ],
    correctAnswer: 1,
    explanation: 'Hovering reveals the actual destination. Scammers use similar-looking URLs like "paypal.com.suspicious-site.com".',
    difficulty: 'medium'
  },
  {
    id: 'q5',
    question: 'What does SPF (Sender Policy Framework) check in email authentication?',
    options: [
      'If the email contains a virus',
      'If the sending domain is authorized to send emails',
      'If the email subject is appropriate',
      'If the email is encrypted'
    ],
    correctAnswer: 1,
    explanation: 'SPF verifies that the sending domain is authorized to send emails from that address, helping detect spoofed emails.',
    difficulty: 'hard'
  },
  {
    id: 'q6',
    question: 'An email claims you\'ve won a prize but requires payment of "processing fees." This is likely:',
    options: [
      'A legitimate contest win',
      'A advance-fee scam',
      'A bank error in your favor',
      'A government tax refund'
    ],
    correctAnswer: 1,
    explanation: 'Advance-fee scams require upfront payment for promised rewards. Legitimate contests don\'t require payment to claim prizes.',
    difficulty: 'medium'
  },
  {
    id: 'q7',
    question: 'What\'s the safest way to handle an email with an unexpected attachment?',
    options: [
      'Open it immediately to see what it is',
      'Delete it without opening',
      'Forward it to friends to check',
      'Save it for later review'
    ],
    correctAnswer: 1,
    explanation: 'Unexpected attachments may contain malware. Delete suspicious emails without opening them, especially from unknown senders.',
    difficulty: 'easy'
  }
];

interface PhishingQuizProps {
  className?: string;
  onComplete?: (score: number, total: number) => void;
}

export default function PhishingQuiz({ className = '', onComplete }: PhishingQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setQuizCompleted(true);
      if (onComplete) {
        onComplete(score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0), quizQuestions.length);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    setUserAnswers([]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreMessage = () => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    if (percentage >= 80) return { message: 'Excellent! You\'re a phishing expert!', icon: '🏆' };
    if (percentage >= 60) return { message: 'Good job! Keep learning to stay safe.', icon: '👍' };
    return { message: 'Keep practicing! Review the explanations to improve.', icon: '📚' };
  };

  if (quizCompleted) {
    const { message, icon } = getScoreMessage();

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl">{icon}</div>
            <div className="text-2xl font-bold">
              {score} / {quizQuestions.length}
            </div>
            <div className="text-lg text-gray-700">
              {message}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">Correct</div>
                <div className="text-2xl font-bold text-green-600">{score}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-medium text-red-800">Incorrect</div>
                <div className="text-2xl font-bold text-red-600">{quizQuestions.length - score}</div>
              </div>
            </div>

            <Button onClick={handleRestart} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Spot the Phish Quiz</CardTitle>
          </div>
          <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
            {currentQuestion.difficulty}
          </Badge>
        </div>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-lg font-medium">
            {currentQuestion.question}
          </div>

          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={`w-full justify-start text-left p-3 h-auto ${
                  showExplanation && index === currentQuestion.correctAnswer
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : ''
                }`}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showExplanation && index === currentQuestion.correctAnswer && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Explanation</div>
              <div className="text-sm text-blue-800">
                {currentQuestion.explanation}
              </div>
            </div>
          )}

          {showExplanation && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Score: {score} / {currentQuestionIndex + 1}
              </div>
              <Button onClick={handleNext}>
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
