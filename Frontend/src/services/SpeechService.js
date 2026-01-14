class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onInterruptCallback = null; // Callback when user interrupts AI
  }

  initRecognition(onResult, onError, onInterrupt) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.onInterruptCallback = onInterrupt;

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Detect if user is speaking while AI is speaking (interrupt)
      if (this.synthesis && this.synthesis.speaking && (finalTranscript.trim() || interimTranscript.trim())) {
        console.log('🛑 User interrupt detected - stopping AI speech');
        this.stopSpeaking();
        if (this.onInterruptCallback) {
          this.onInterruptCallback({ final: finalTranscript, interim: interimTranscript });
        }
      }

      onResult({ final: finalTranscript, interim: interimTranscript });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        this.recognition.start();
      }
    };

    return true;
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      return true;
    }
    return false;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      return true;
    }
    return false;
  }

  // Text-to-speech for AI responses with natural voice modulation
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Enhance text with natural pauses and emphasis
      const enhancedText = this._enhanceText(text, options);
      
      // Default options for natural human speech
      const defaultOptions = {
        lang: 'en-US',
        rate: 0.95,        // Slightly slower for clarity (normal human ~0.9-1.1)
        pitch: 1.0,        // Natural pitch
        volume: 1.0,
        voiceIndex: 0      // Use default voice
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Split text into chunks for voice variation
      const chunks = enhancedText.split('||PAUSE||');
      let chunkIndex = 0;

      const speakChunk = () => {
        if (chunkIndex >= chunks.length) {
          resolve();
          return;
        }

        const chunk = chunks[chunkIndex].trim();
        if (!chunk) {
          chunkIndex++;
          speakChunk();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = finalOptions.lang;
        
        // Add natural voice variation
        utterance.rate = this._getVariableRate(chunk, finalOptions.rate);
        utterance.pitch = this._getVariablePitch(chunk, finalOptions.pitch);
        utterance.volume = finalOptions.volume;

        // Try to use a natural voice if available
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          // Prefer female voice for friendlier tone, or use system default
          const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('woman'));
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          } else if (finalOptions.voiceIndex < voices.length) {
            utterance.voice = voices[finalOptions.voiceIndex];
          }
        }

        utterance.onend = () => {
          chunkIndex++;
          // Add natural pause between chunks
          setTimeout(() => speakChunk(), 300);
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          reject(error);
        };

        this.synthesis.speak(utterance);
      };

      speakChunk();
    });
  }

  /**
   * Enhance text with natural pauses and emphasis
   * @private
   */
  _enhanceText(text, options = {}) {
    let enhanced = text;

    // Add pauses after punctuation for natural flow
    enhanced = enhanced.replace(/([.!?])\s+/g, '$1||PAUSE||');
    
    // Add longer pause after question marks to seem thoughtful
    enhanced = enhanced.replace(/\?(\|\|PAUSE\|\|)?/g, '?||PAUSE||PAUSE||');

    // Add slight pauses after commas for lists
    enhanced = enhanced.replace(/,\s+/g, ', ');

    // Mark certain words for emphasis (slower speech)
    const emphasisWords = ['specifically', 'importantly', 'furthermore', 'however', 'therefore'];
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhanced = enhanced.replace(regex, `**${word}**`);
    });

    return enhanced;
  }

  /**
   * Get variable speech rate based on content
   * @private
   */
  _getVariableRate(text, baseRate = 0.95) {
    // Speak numbers and technical terms slower
    if (/\d+|algorithm|database|architecture|performance/.test(text)) {
      return Math.max(0.8, baseRate - 0.1);
    }

    // Speak emphasis words slower
    if (/\*\*/.test(text)) {
      return Math.max(0.8, baseRate - 0.15);
    }

    // Speak questions slightly slower and more thoughtfully
    if (text.includes('?')) {
      return Math.max(0.85, baseRate - 0.05);
    }

    // Regular speech slightly faster for natural flow
    return Math.min(1.1, baseRate + 0.05);
  }

  /**
   * Get variable pitch based on content
   * @private
   */
  _getVariablePitch(text, basePitch = 1.0) {
    // Slightly higher pitch at end of questions for natural intonation
    if (text.trim().endsWith('?')) {
      return basePitch + 0.1;
    }

    // Slightly lower pitch for emphasis words
    if (/\*\*/.test(text)) {
      return basePitch - 0.1;
    }

    // Slightly higher pitch for follow-ups to sound engaging
    if (/tell|explain|describe|can you/.test(text.toLowerCase())) {
      return basePitch + 0.05;
    }

    return basePitch;
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSpeaking() {
    return this.synthesis && this.synthesis.speaking;
  }
}

export default new SpeechService();