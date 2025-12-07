import React, { useState, useRef, useEffect } from 'react';
import { Check, User, Video, VideoOff, Mic, MicOff, Square, Play } from 'lucide-react';

const InterviewPage = () => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(2);
  const [inputValue, setInputValue] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const videoRef = useRef(null);
  const aiVideoRef = useRef(null);
  const streamRef = useRef(null); // Store the stream reference

  useEffect(() => {
    // Initialize video stream when component mounts
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream; // Store stream reference
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Error accessing media devices:', err);
        });
    }

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartInterview = async () => {
    // Ensure we have a stream before starting
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Ensure tracks are enabled based on current state
        stream.getVideoTracks().forEach(track => {
          track.enabled = videoEnabled;
        });
        stream.getAudioTracks().forEach(track => {
          track.enabled = audioEnabled;
        });
      } catch (err) {
        console.error('Error accessing media devices:', err);
        return;
      }
    }
    
    setIsInterviewActive(true);
    setIsRecording(true);
    setCurrentQuestion(1);
  };

  const handleStopInterview = () => {
    setIsInterviewActive(false);
    setIsRecording(false);
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      setInputValue('');
    } else {
      handleStopInterview();
    }
  };

  const toggleVideo = () => {
    const newVideoState = !videoEnabled;
    setVideoEnabled(newVideoState);
    
    // Use the stream reference directly
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
    }
  };

  const toggleAudio = () => {
    const newAudioState = !audioEnabled;
    setAudioEnabled(newAudioState);
    
    // Use the stream reference directly and ensure audio tracks are independent
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newAudioState;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Video Feeds Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* AI Interviewer Video */}
            <div className="relative bg-white rounded-xl overflow-hidden aspect-video border border-gray-200 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">AI Interviewer</p>
                </div>
              </div>
              <video
                ref={aiVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gray-800 px-4 py-2 flex items-center space-x-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">AI interviewer</span>
              </div>
            </div>

            {/* Interviewee Video */}
            <div className="relative bg-white rounded-xl overflow-hidden aspect-video border border-gray-200 shadow-sm">
              {videoEnabled ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  autoPlay
                  playsInline
                  muted={!audioEnabled}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <VideoOff className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-blue-800 px-4 py-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Interviewee</span>
              </div>
            </div>
          </div>

          {/* Controls and Input Section */}
          <div className="space-y-4">
            {/* Input Field
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Let's start the interview now."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                disabled={!isInterviewActive}
              />
              <button
                onClick={handleNext}
                disabled={!isInterviewActive || currentQuestion >= totalQuestions}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div> */}

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
              {!isInterviewActive ? (
                <button
                  onClick={handleStartInterview}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-md"
                >
                  <Play className="w-5 h-5" />
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
                    title={videoEnabled ? 'Turn off video' : 'Turn on video'}
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
                    title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleStopInterview}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-md"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop Interview</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
