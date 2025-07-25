const GEMINI_API_KEY = 'AIzaSyBOsZjfdd0FgzwbBzNqtNvuIoasiWOjiRg';
    let isFirstMessage = true;
    let currentTypingInterval = null;
    let isTypingStopped = false;
    let conversationHistory = [];

    const SPECIAL_QUESTIONS = {
      'من صممك':'تم تصميم النظام بالكامل بواسطة المطور محمد قدوري',
      'من صنعك': 'التطوير البرمجي والتصميم على يد محمد قدوري',
      'من طورك': 'الإصدار الحالي من البرنامج من تطوير محمد قدوري',
      'مدير البرنامج': 'محمد هو المسؤول عن تطوير وتصميم هذا البرنامج.',
      'من علمك': 'محمد قدوري هو المطور الأساسي للنظام.',
      'هل تعرف محمد قدوري': 'محمد قدوري هو المطور الأساسي الذي قام بتطويري.',
      'من رئيسك': ' هو المصمم والمطور للبرنامج.',
      'من مديرك': 'مدير البرنامج هو محمد قدوري.',
      'من مصممك': 'المطور والمصمم هو محمد قدوري.',
      'من دربك': 'الأمر واضح لقد تم تدريبي من طرف محمد قدوري',
      'من انت':'نموذج ذكاء إصطناعي',
      'من برمجك':'محمد قدوري',
      'من مبرمجك':'محمد قدوري',
      'من مطورك': 'المطور هو محمد قدوري.',
      'شكون نتا' :' انا محمد قدوري من الجزائر يمكنني مساعدتك وتقديم لك الأفضل',
      'شكون لي خدمك':'هذا سؤال جيد يالطبع تم تصميمي من طرف المطور محمد قدوري',
      'شكون لي صنعك':'محمد قدوري',
      'شكون ليصنعك':'محمد قدوري',
      'انت جزائري':'انا نموذج لغوي تم تدريبي من طرف شخص جزائري وليس انا الجزائري',
      'ماهي جنسيتك':'انا لا امتلك جنسية',
     
      };

    async function fetchAIResponse(query) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] })
          }
        );
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        return '⚠️ حدث خطأ في الاتصال بالخادم';
      }
    }

    function checkSpecialQuestions(query) {
      const lowerQuery = query.toLowerCase();
      for (const [key, value] of Object.entries(SPECIAL_QUESTIONS)) {
        if (lowerQuery.includes(key.toLowerCase())) return value;
      }
      return null;
    }

    function formatResponse(text) {
      const segments = [];
      text.split('```').forEach((part, index) => {
        if (part.trim()) {
          segments.push({ type: index % 2 === 0 ? 'text' : 'code', content: part.trim() });
        }
      });
      return segments;
    }

    async function displayFormattedResponse(segments) {
      const messagesDiv = document.getElementById('messages');
      document.getElementById('loadingIndicator').style.display = 'none';
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ai-message';
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      for (let segment of segments) {
        let container;
        if (segment.type === 'code') {
          container = document.createElement('div');
          container.className = 'code-editor';
          container.innerHTML = `
            <div class="code-toolbar">
              <button onclick="copyCode(this)">نسخ</button>
            </div>
            <pre class="code-content"></pre>
          `;
        } else {
          container = document.createElement('div');
          container.className = 'message-content';
        }
        messageDiv.appendChild(container);
        await typewriterEffectOnElement(segment.type === 'code' ? container.querySelector('.code-content') : container, segment.content);
      }
      speakText(segments.map(seg => seg.content).join('\n'));
    }

    function typewriterEffectOnElement(target, text) {
      return new Promise(resolve => {
        let index = 0;
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        target.appendChild(cursor);
        currentTypingInterval = setInterval(() => {
          if (isTypingStopped) {
            clearInterval(currentTypingInterval);
            cursor.remove();
            isTypingStopped = false;
            resolve();
            return;
          }
          if (index < text.length) {
            target.insertBefore(document.createTextNode(text[index]), cursor);
            index++;
          } else {
            clearInterval(currentTypingInterval);
            cursor.remove();
            resolve();
          }
        }, 10);
      });
    }

    function addMessage(content, type) {
      const messagesDiv = document.getElementById('messages');
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${type}-message`;
      msgDiv.innerHTML = `<div class="message-content">${content}</div>`;
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const input = document.getElementById('userInput');
      const messageText = input.value.trim();
      if (!messageText) return;
      
      if (isFirstMessage) {
        document.getElementById('welcomeMessage').style.opacity = '0';
        isFirstMessage = false;
      }
      
      conversationHistory.push({ role: 'user', content: messageText });
      addMessage(messageText, 'user');
      input.value = '';
      document.getElementById('loadingIndicator').style.display = 'block';

      try {
        const context = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        let specialAnswer = checkSpecialQuestions(messageText);
        let finalAnswer = specialAnswer ? specialAnswer : await fetchAIResponse(context);
        conversationHistory.push({ role: 'assistant', content: finalAnswer });
        const segments = formatResponse(finalAnswer);
        await displayFormattedResponse(segments);
      } catch (error) {
        addMessage('⚠️ حدث خطأ في النظام', 'error');
        document.getElementById('loadingIndicator').style.display = 'none';
      }
    }

    function copyCode(button) {
      const code = button.parentElement.nextElementSibling.textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'تم النسخ!';
        setTimeout(() => button.textContent = 'نسخ', 2000);
      });
    }

    // دعم تحويل النص إلى كلام
    function speakText(text) {
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }

    // دعم التعرف الصوتي
    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.addEventListener('result', (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('userInput').value = transcript;
      });
      recognition.addEventListener('error', (event) => {
        console.error('Speech recognition error', event.error);
      });
    }
    function startVoiceRecognition() {
      if (recognition) recognition.start();
    } document.getElementById('stopBtn').addEventListener('click', () => { isTypingStopped = true; });
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
    });
    document.getElementById('closeSidebar') && document.getElementById('closeSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
    document.getElementById('voiceBtn') && document.getElementById('voiceBtn').addEventListener('click', startVoiceRecognition);

    // عند انتهاء شاشة البداية، إخفاؤها وعرض واجهة الدردشة مع إعادة تمكين التمرير
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.getElementById('splash').style.display = 'none';
        document.getElementById('chatContainer').style.opacity = '1';
        document.body.style.overflow = 'auto';
      }, 3000);
    });
    
    
    
    
    
    