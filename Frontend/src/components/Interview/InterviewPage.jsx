import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Square, MessageSquare, Brain } from 'lucide-react';
import SpeechService from '../../services/SpeechService';
import { useAuth } from '../../context/AuthContext';
import maleInterviewerImage from '../../assets/male_interviewer.png';

const InterviewPage = () => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.userName || 'User');
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    initializeMedia();
    return cleanup;
  }, []);

  // Fetch user data if not available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUser(data.user);
              setUsername(data.user.userName || 'User');
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUsername(user.userName || 'User');
      }
    };
    fetchUserData();
  }, [user, setUser]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    SpeechService.stopListening();
    SpeechService.stopSpeaking();
  };

  const handleStartInterview = async () => {
    setIsInterviewActive(true);
    
    // Initialize speech recognition
    const initialized = SpeechService.initRecognition(
      handleSpeechResult,
      handleSpeechError
    );

    if (!initialized) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    // Get first question from AI
    await getNextQuestion();
  };

  const handleSpeechResult = ({ final, interim }) => {
    setInterimTranscript(interim);
    
    if (final.trim()) {
      setUserTranscript(prev => prev + final);
      
      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Detect end of answer (2 seconds of silence)
      silenceTimerRef.current = setTimeout(() => {
        if (final.trim()) {
          handleAnswerComplete(final.trim());
        }
      }, 2000);
    }
  };

  const handleSpeechError = (error) => {
    console.error('Speech error:', error);
    if (error === 'no-speech') {
      // User stopped speaking, might want to prompt
    }
  };

  const getNextQuestion = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/interview/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationHistory,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const question = data.question;
        setCurrentQuestion(question);
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, {
          role: 'interviewer',
          content: question,
          timestamp: new Date()
        }]);

        // Speak the question
        setIsAISpeaking(true);
        await SpeechService.speak(question);
        setIsAISpeaking(false);

        // Start listening for answer
        setIsListening(true);
        SpeechService.startListening();
      }
    } catch (error) {
      console.error('Error getting question:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerComplete = async (answer) => {
    // Stop listening while processing
    SpeechService.stopListening();
    setIsListening(false);
    
    // Add answer to history
    setConversationHistory(prev => [...prev, {
      role: 'candidate',
      content: answer,
      timestamp: new Date()
    }]);

    // Clear transcripts
    setUserTranscript('');
    setInterimTranscript('');

    // Get next question
    await getNextQuestion();
  };

  const handleStopInterview = async () => {
    SpeechService.stopListening();
    SpeechService.stopSpeaking();
    setIsInterviewActive(false);
    setIsListening(false);
    
    // Generate interview report
    if (conversationHistory.length > 0) {
      await generateReport();
    }

    // Stop media
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/interview/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationHistory
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Navigate to report page or show modal
        console.log('Report generated:', data.report);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              {isAISpeaking && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Brain className="animate-pulse" size={20} />
                  <span className="font-medium">AI is speaking...</span>
                </div>
              )}
              {isListening && (
                <div className="flex items-center gap-2 text-green-600">
                  <Mic className="animate-pulse" size={20} />
                  <span className="font-medium">Listening...</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="animate-spin" size={20} />
                  <span className="font-medium">Processing...</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Questions: {conversationHistory.filter(h => h.role === 'interviewer').length}
            </div>
          </div>

          {/* Video Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* AI Interviewer */}
            <div className="relative bg-white rounded-xl overflow-hidden aspect-video border border-gray-200 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <img 
                    src={maleInterviewerImage} 
                    alt="AI Interviewer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2">
                <p className="font-medium">AI Interviewer</p>
              </div>
            </div>
            
            {/* User Camera Feed */}
            <div className="relative bg-white rounded-xl overflow-hidden aspect-video border border-gray-200 shadow-sm">
              {videoEnabled ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <VideoOff className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2">
                <p className="font-medium">{username}</p>
              </div>
            </div>
          </div>

          {/* Current Question & Transcript */}
          <div className="space-y-4 mb-6">
            {currentQuestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Current Question:</p>
                <p className="text-gray-800">{currentQuestion}</p>
              </div>
            )}

            {(userTranscript || interimTranscript) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">Your Answer:</p>
                <p className="text-gray-800">
                  {userTranscript}
                  <span className="text-gray-400">{interimTranscript}</span>
                </p>
              </div>
            )}
          </div>

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <MessageSquare size={16} />
                Conversation History
              </h3>
              <div className="space-y-3">
                {conversationHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      item.role === 'interviewer' 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {item.role === 'interviewer' ? 'Interviewer' : 'You'}
                    </p>
                    <p className="text-sm text-gray-800">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
            {!isInterviewActive ? (
              <button
                onClick={handleStartInterview}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-md"
              >
                <Mic className="w-5 h-5" />
                <span>Start Interview</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-lg transition ${
                    videoEnabled
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-lg transition ${
                    audioEnabled
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleStopInterview}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-md"
                >
                  <Square className="w-5 h-5" />
                  <span>End Interview</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;