import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Square, MessageSquare, Brain } from 'lucide-react';
import SpeechService from '../../services/SpeechService';
import { useAuth } from '../../context/AuthContext';
import femaleInterviewerImage from '../../assets/female_interviewer.png';

const InterviewPage = () => {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [sessionId, setSessionId] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [documentId, setDocumentId] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Log sessionId changes
  useEffect(() => {
    console.log('📊 sessionId changed:', sessionId);
  }, [sessionId]);

  // Small helper to create deliberate pauses (e.g., AI responds 2s after user stops)
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Get URL parameters
  useEffect(() => {
    const role = searchParams.get('role');
    const docId = searchParams.get('documentId');

    if (!role || !docId) {
      alert('Missing required information. Please start the interview from the home page.');
      navigate('/home');
      return;
    }

    setJobRole(role);
    setDocumentId(docId);
    // Difficulty will be determined automatically by the backend
  }, [searchParams, navigate]);

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
    if (!documentId || !jobRole) {
      alert('Missing required information. Please start the interview from the home page.');
      navigate('/home');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Start interview session with backend
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId,
          role: jobRole
          // difficulty will be determined automatically by the backend based on resume embeddings
        })
      });

      console.log('Start interview response status:', response.status, response.ok);

      const data = await response.json();
      
      console.log('Full response data:', data);
      console.log('sessionId from response:', data.sessionId);
      console.log('sessionId type:', typeof data.sessionId);
      
      if (!data.success) {
        alert(data.error || 'Failed to start interview');
        setIsProcessing(false);
        return;
      }

      if (!data.sessionId) {
        console.error('CRITICAL: sessionId is missing from response!', { data });
        alert('Failed to start interview: Missing session ID in response');
        setIsProcessing(false);
        return;
      }

      console.log('Setting sessionId to:', data.sessionId);
      setSessionId(data.sessionId);
      console.log('After setSessionId call - sessionId should be queued for update');
      
      setCurrentQuestion(data.question);
      
      // Add to conversation history
      setConversationHistory([{
        role: 'interviewer',
        content: data.question,
        timestamp: new Date()
      }]);

      // Set interview as active - this will trigger the useEffect to initialize speech recognition
      setIsInterviewActive(true);
      
      // Speak the question
      setIsAISpeaking(true);
      await SpeechService.speak(data.question);
      setIsAISpeaking(false);

      // Start listening for answer (only if mic enabled)
      if (audioEnabled) {
        setIsListening(true);
        SpeechService.startListening();
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechResult = useCallback(({ final, interim }) => {
    console.log('handleSpeechResult called:', { final, interim, currentSessionId: sessionId });
    setInterimTranscript(interim);
    
    if (final.trim()) {
      setUserTranscript(prev => prev + final);
      
      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Detect end of answer (2 seconds of silence)
      silenceTimerRef.current = setTimeout(() => {
        console.log('Silence timeout triggered - calling handleAnswerComplete with:', final.trim());
        if (final.trim()) {
          handleAnswerComplete(final.trim());
        }
      }, 2000);
    }
  }, [sessionId]);

  const handleSpeechError = useCallback((error) => {
    console.error('Speech error:', error);
    if (error === 'no-speech') {
      // User stopped speaking, might want to prompt
    }
  }, []);

  const handleInterrupt = useCallback((transcript) => {
    console.log('🛑 Interview interrupted by user:', transcript);
    // Stop the 2-second silence timer to avoid double submission
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsAISpeaking(false);
  }, []);

  // Re-initialize speech recognition when sessionId or callbacks change
  useEffect(() => {
    if (isInterviewActive && sessionId) {
      console.log('Re-initializing speech recognition with updated callbacks');
      const initialized = SpeechService.initRecognition(
        handleSpeechResult,
        handleSpeechError,
        handleInterrupt
      );
      if (!initialized) {
        console.warn('Failed to initialize speech recognition');
      }
    }
  }, [isInterviewActive, sessionId, handleSpeechResult, handleSpeechError, handleInterrupt]);

  const getNextQuestion = async () => {
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    setIsProcessing(true);
    
    try {
      // This will be called after submitting an answer
      // The backend will return the next question
      // For now, we'll handle this in handleAnswerComplete
    } catch (error) {
      console.error('Error getting question:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerComplete = async (answer) => {
    console.log('=== handleAnswerComplete called ===');
    console.log('Current sessionId value:', sessionId);
    console.log('sessionId type:', typeof sessionId);
    console.log('Answer received:', answer);
    
    if (!sessionId) {
      console.error('CRITICAL: No session ID available', { sessionId });
      alert('Error: No session ID available. Please start the interview again.');
      return;
    }

    // Stop listening while processing
    SpeechService.stopListening();
    setIsListening(false);
    setIsProcessing(true);
    
    // Add answer to history
    setConversationHistory(prev => [...prev, {
      role: 'candidate',
      content: answer,
      timestamp: new Date()
    }]);

    // Clear transcripts
    setUserTranscript('');
    setInterimTranscript('');

    try {
      // Submit answer and get next question
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          answer
        })
      });

      console.log('Answer submission response status:', response.status, response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Could not parse error response' };
        }
        console.error('Server error response:', response.status, errorData);
        const errorMsg = errorData?.error || `Server error: ${response.status}`;
        alert(`Error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        alert('Error: Failed to parse server response');
        return;
      }

      console.log('Answer submission response:', data);
      
      if (data.success) {
        // Check if interview is complete
        if (data.interviewComplete) {
          // Interview is complete, end it
          alert('Interview completed! Ending session...');
          await handleStopInterview();
          return;
        }

        const question = data.question;
        
        // Validate that we have a question
        if (!question) {
          console.error('No question received from server:', data);
          alert('Error: No question received from server');
          return;
        }

        console.log('Received new question:', question);

        setCurrentQuestion(question);
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, {
          role: 'interviewer',
          content: question,
          timestamp: new Date()
        }]);

        // Speak the question after a brief pause to feel more natural
        setIsAISpeaking(true);
        await delay(2000);
        await SpeechService.speak(question);
        setIsAISpeaking(false);

        // Start listening for answer (only if mic enabled)
        if (audioEnabled) {
          setIsListening(true);
          SpeechService.startListening();
        }
      } else {
        const errorMsg = data.error || 'Failed to get next question';
        console.error('API returned success: false', data);
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please check the console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopInterview = async () => {
    SpeechService.stopListening();
    SpeechService.stopSpeaking();
    setIsInterviewActive(false);
    setIsListening(false);
    
    // End interview session - this also evaluates the interview
    let evaluation = null;
    if (sessionId) {
      try {
        const response = await fetch('/api/interview/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.evaluation) {
            evaluation = data.evaluation;
            console.log('Interview evaluation:', evaluation);
          }
        }
      } catch (error) {
        console.error('Error ending interview:', error);
      }
    }

    // Stop media
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Show evaluation summary or navigate to results page
    if (evaluation) {
      const summary = `
Interview Complete!

Overall Score: ${evaluation.overallScore || 'N/A'}/5.0
Confidence Level: ${evaluation.confidenceLevel || 'N/A'}

Feedback:
${evaluation.notes || 'No additional feedback'}
      `.trim();
      
      alert(summary);
      
      // Optionally navigate to a results page
      // navigate('/interview-results', { state: { evaluation } });
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

    if (!newState) {
      // Muted: stop recognition immediately and mark not listening
      SpeechService.stopListening();
      setIsListening(false);
    } else {
      // Unmuted: if interview is active and we're not processing/AI-speaking, resume listening
      if (isInterviewActive && !isProcessing && !isAISpeaking) {
        SpeechService.startListening();
        setIsListening(true);
      }
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
                    src={femaleInterviewerImage} 
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

          {/* Job Role Info */}
          {jobRole && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">
                Interviewing for: <span className="text-blue-800">{jobRole}</span>
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
            {!isInterviewActive ? (
              <button
                onClick={handleStartInterview}
                disabled={isProcessing || !documentId || !jobRole}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="w-5 h-5" />
                <span>{isProcessing ? 'Starting...' : 'Start Interview'}</span>
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