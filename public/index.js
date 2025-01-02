document.addEventListener('DOMContentLoaded', function() {
    const typingTextElement = document.getElementById("typing-text");
    const textToType = `Expanding kids imagination, thinking and questioning-abilities.`;
    const statusMessage = document.getElementById('status-message');
    const API_URL = 'http://localhost:3000/chat';
    const TRANSLATE_API_URL = 'https://api.mymemory.translated.net/get';
    const stillPhotoSrc = "https://res.cloudinary.com/dmttn34te/image/upload/v1733497437/still_2_qwmdjo.jpg";
    const talkingGifSrc = "https://res.cloudinary.com/dmttn34te/image/upload/v1733497438/talking_hxyyrp.gif";
    const characterImage = document.getElementById('character-image');
    let lines = [];
    let currentIndex = 0;
    let storyGenerated = false;
    let speaking = false;
    let speechRate = 1.0;
    let currentUtterance = null;
    let lastGeneratedPrompt = '';
    let storyGenerationCount = parseInt(localStorage.getItem('storyGenerationCount') || '0');
    const chatBody = document.getElementById('chat-body');
    const processBtn = document.getElementById('process-btn');
    const storyInput = document.getElementById('story-input');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const readFullBtn = document.getElementById('read-full-btn');
    const stopBtn = document.getElementById('stop-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const languageSelect = document.getElementById('languageSelect');
    const pasteBtn = document.getElementById('pasteBtn');
    const speedControl = document.getElementById('speedControl');
    const speedValue = document.getElementById('speedValue');
    const audioProgress = document.getElementById('audio-progress');
    const editBtn = document.getElementById('edit-btn');
    const editModal = document.getElementById('editModal');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editStoryArea = document.getElementById('edit-story-area');
    const downloadStoryBtn = document.getElementById('downloadStoryBtn');
    const uploadStoryBtn = document.getElementById('uploadStoryBtn');
    const uploadStoryFileInput = document.getElementById('uploadStoryFile');
    const resetBtn = document.getElementById('resetBtn');
    const ageSelect = document.getElementById('ageSelect');
    const combinedAgeInput = document.getElementById('combinedAge');
    const ageInput = document.getElementById('ageInput');
    const sendToPerplexityBtn = document.getElementById('sendToPerplexityBtn');
    const copyToChatGPTBtn = document.getElementById('copyToChatGPTBtn');
    const directGenerateStoryBtn = document.getElementById('directGenerateStoryBtn');
    const generateButtonSpinner = directGenerateStoryBtn.querySelector('.spinner-border');
    const topicInput = document.getElementById('topicInput');
    const promptOutput = document.getElementById('promptOutput');
    const randomWordBtn = document.querySelector('.input-group-append .btn');
    const translateBtn = document.getElementById('translate-btn');
    const themeSwitcher = document.querySelector('.theme-switcher');


    let currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark-neon') {
        document.body.classList.add('dark-neon');
    }

    themeSwitcher.addEventListener('click', () => {
        document.body.classList.toggle('dark-neon');
        currentTheme = document.body.classList.contains('dark-neon') ? 'dark-neon' : 'light';
        localStorage.setItem('theme', currentTheme);
    });
    let earnedAchievements = {};
    try {
        const storedAchievements = localStorage.getItem('earnedAchievements');
        if (storedAchievements) {
            earnedAchievements = JSON.parse(storedAchievements);
        }
    } catch (e) {
        console.error("Error loading achievements from localStorage:", e);
        earnedAchievements = {};
    }

    function updateCombinedAge() {
        if (document.getElementById('ageSelectOption').checked) {
            combinedAgeInput.value = ageSelect.value;
        } else if (document.getElementById('ageInputOption').checked) {
            combinedAgeInput.value = ageInput.value;
        }
    }

    document.querySelectorAll('input[name="ageOption"]').forEach(radio => {
        radio.addEventListener('change', updateCombinedAge);
    });

    ageSelect.addEventListener('change', updateCombinedAge);
    ageInput.addEventListener('input', updateCombinedAge);
    updateCombinedAge();

    function updateCharacterImage(isTalking) {
        if (characterImage) {
            characterImage.src = isTalking ? talkingGifSrc : stillPhotoSrc;
        }
    }

    function autoTypeText(text, element) {
        let i = 0;
        const interval = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            if (i === text.length) {
                clearInterval(interval);
            }
        }, 100);
    }
    autoTypeText(textToType, typingTextElement);

    async function fillInputWithRandomWord() {
        try {
            const response = await fetch('https://random-word-api.herokuapp.com/word?number=1');
            if (!response.ok) throw new Error("Failed to fetch the word.");
            const data = await response.json();
            topicInput.value = data[0];
            topicInput.dispatchEvent(new Event('input'));
            setStatusMessage("Random word fetched!", 'success');
        } catch (error) {
            console.error("Error fetching random word:", error);
            setStatusMessage("Could not fetch a random word.", 'error');
        }
    }

    function generatePrompt(topic, language, age) {
        let intro = "Let's hear a great story!";
        let languageText = language === 'hi-IN' ? 'हिंदी' : language;
        return `Create an engaging learning session for children aged ${age} years on the topic [${topic}] in ${languageText} Language. The session should be designed to inspire curiosity, encourage imagination, and foster critical thinking about the topic [${topic}]. Avoid symbols unsuitable for text-to-speech (e.g., *, /, #). Use only paragraph-like text without point names or headings, and do not mention the question number. Use the "..." to indicate a break after certain certain sentences so that it not gets boring. Start with a fun and exciting introduction in 1-2 sentences that immediately draws the child into the topic [${topic}], making it relatable and engaging. Before starting any story, say in an excited voice: "${intro}" in ${languageText}. No need to ask again if they want to hear a story. Begin with a beautiful learning story, which could be a fantasy story. The conversation should feel like a friendly chat, making the learning process enjoyable. After some time, take a little break, speaking in a way that psychologically attracts children. Present the topic in a simple, imaginative, and clear way (maximum 30 words). Include easy-to-understand details to make the concept more relatable. Provide 5 creative questions followed by imaginative answers, encouraging curiosity. Each answer should be unique, thought-provoking, and encourage creativity. Add a "..." gap before each answer [e.g., question...answer]. Give children time to think before answering the question, saying something like, "What do you think the answer might be?" Wait a while, and then provide the answer in ${languageText}. Every second question should introduce an imaginative twist related to the topic to break the flow and spark the imagination. Add surprising, lesser-known facts or scenarios related to the topic to keep the child intrigued and help them connect the topic with real-world applications. Include practical examples or situations connecting the topic to daily life, making it fun and easy to relate to. Conclude with a thought-provoking statement that pushes the child to explore the topic further, sparking their imagination and critical thinking. Finally, create a historical story based on the topic.`;
    }



    function setStatusMessage(message, type) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.innerHTML = `${message} <span class="status-icon ${type || ''}">
                                    ${type === 'success' ? '✔' : (type === 'error' ? '✖' : '')}
                                </span>`;
        statusMessage.classList.add('fade-in');
        setTimeout(() => {
            statusMessage.classList.remove('fade-in');
            statusMessage.classList.add('fade-out');
            setTimeout(() => {
                statusMessage.classList.remove('fade-out');
            }, 500);
        }, 3000);
    }

    function renderChat() {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.innerHTML = '';
        lines.forEach((line, index) => {
            const parts = line.split("...");
            const prePause = parts[0] || "";
            const postPause = parts[1] || "";
            const chatMessage = document.createElement('div');
            chatMessage.className = 'chat-message';
            chatMessage.innerHTML = `
    <span style="color: #fd7e14; font-weight: bold; font-size: 1.2em; letter-spacing: 0.5px; text-shadow: -0.5px 0px 0px black;">${prePause}</span>
    <span style="color: #20c997; font-size: 1.2em; font-style: italic; letter-spacing: 0.5px; text-shadow: -0.5px 0px 0px black;">${postPause}</span>`;
            chatContainer.appendChild(chatMessage);
        });
        chatContainer.style.display = lines.length > 0 ? 'block' : 'none';
        highlightAndScroll();
    }

    function updateControls() {
        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= lines.length - 1;
        pauseBtn.disabled = !speechSynthesis.speaking;
        playBtn.disabled = speechSynthesis.speaking || lines.length === 0;
    }

    function highlightAndScroll() {
        const chatContainer = document.getElementById('chat-container');
        const chatMessages = chatContainer.querySelectorAll('.chat-message');
        chatMessages.forEach((message, index) => {
            message.classList.toggle('highlight', index === currentIndex);
            message.addEventListener('click', () => {
                currentIndex = index;
                highlightAndScroll();
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                }
                speakLine();
            });
        });
        chatMessages[currentIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    function speakLine() {
        speaking = true;
        if (currentIndex >= lines.length) {
            speaking = false;
            updateCharacterImage(false);
            updateControls();
            return;
        }
        const line = lines[currentIndex];
        const parts = line.split("...");
        const prePause = parts[0] || "";
        const postPause = parts[1] || "";
        const utterances = [];

        if (prePause) {
            const preUtterance = new SpeechSynthesisUtterance(prePause);
            preUtterance.lang = languageSelect.value;
            preUtterance.rate = speechRate;
            utterances.push(preUtterance);
        }

        if (postPause) {
            const postUtterance = new SpeechSynthesisUtterance(postPause);
            postUtterance.lang = languageSelect.value;
            postUtterance.rate = speechRate;
            utterances.push(postUtterance);
        }
        let utteranceIndex = 0;
        const speakNext = () => {
            if (utteranceIndex < utterances.length) {
                const utterance = utterances[utteranceIndex];
                utterance.onstart = () => updateCharacterImage(true);
                utterance.onend = () => {
                    utteranceIndex++;
                    updateCharacterImage(false);
                    speakNext();
                };
                speechSynthesis.speak(utterance);
                currentUtterance = utterance
            } else {
                speaking = false;
                if (currentIndex < lines.length - 1) {
                    currentIndex++;
                    highlightAndScroll();
                    updateControls();
                    speakLine();
                } else {
                    updateControls();
                }
            }
        };
        speechSynthesis.cancel();
        speakNext();
        highlightAndScroll();
    }

    function readFullStory() {
        speaking = true;
        speechSynthesis.cancel();
        const fullText = lines.join(' '); // Join with space for better reading
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = languageSelect.value;
        utterance.rate = speechRate;
        utterance.onstart = () => {
            updateCharacterImage(true);
            currentUtterance = utterance; // Set the currentUtterance here

        };
        utterance.onend = () => {
            speaking = false;
            updateCharacterImage(false);
            updateControls();
            currentUtterance = null; // Clear currentUtterance
            audioProgress.style.width = '100%'; //Set progress to 100
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            speaking = false;
            updateCharacterImage(false);
            updateControls();
            currentUtterance = null; // Clear on error

            setStatusMessage('Error while reading full story.', 'error');
        };


        speechSynthesis.speak(utterance);

        updateControls();
    }

    function updateAudioProgress() {
        if (speechSynthesis.speaking && currentUtterance) {
            const progress = (speechSynthesis.currentTime / currentUtterance.duration) * 100;
            audioProgress.style.width = `${progress}%`;
            audioProgress.setAttribute('aria-valuenow', progress);
        }
    }
    setInterval(updateAudioProgress, 100);


    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            highlightAndScroll();
            speakLine();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < lines.length - 1) {
            currentIndex++;
            highlightAndScroll();
            speakLine();
        }
    });

    playBtn.addEventListener('click', () => {
        if (lines.length > 0) {
            speakLine()
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
        } else {
            speechSynthesis.resume();
        }
        speaking = !speaking;
        updateControls();
    });

    readFullBtn.addEventListener('click', readFullStory);

    stopBtn.addEventListener('click', () => {
        speaking = false;
        speechSynthesis.cancel();
        updateCharacterImage(false);
        updateControls();
    });

    saveBtn.addEventListener('click', () => {
        saveStoryToLocalStorage();
    });

    loadBtn.addEventListener('click', () => {
        loadStoryFromLocalStorage();
    });

    function saveStoryToLocalStorage() {
        localStorage.setItem('savedStory', JSON.stringify(lines));
        setStatusMessage("Story saved to local storage.", 'success');
    }

    function loadStoryFromLocalStorage() {
        const savedStory = localStorage.getItem('savedStory');
        if (savedStory) {
            lines = JSON.parse(savedStory);
            currentIndex = 0;
            renderChat();
            setStatusMessage("Story loaded from local storage.", 'success');
        } else {
            setStatusMessage("No story saved in local storage.", 'error');
        }
    }

    processBtn.addEventListener('click', async () => {
        const storyText = storyInput.value;
        processBtn.disabled = true;
        try {
            lines = storyText.split('\n').filter(line => line.trim());
            currentIndex = 0;
            renderChat();
            awardAchievement('storyProcessed');
            chatContainer.scrollTop = chatContainer.scrollHeight;
            setStatusMessage("Story processed.", 'success');
        } catch (error) {
            console.error("Error processing story:", error);
            setStatusMessage("Error processing story.", 'error');
        } finally {
            processBtn.disabled = false;
        }
    });

    editBtn.addEventListener('click', () => {
        editStoryArea.value = lines.join('\n');
        $('#editModal').modal('show');
    });

    $('#editModal').on('hidden.bs.modal', function() {});

    saveEditBtn.addEventListener('click', () => {
        lines = editStoryArea.value.split('\n').filter(line => line.trim());
        currentIndex = 0;
        renderChat();
        $('#editModal').modal('hide');
        setStatusMessage("Story edit saved.", 'success');
    });

    speedControl.addEventListener('input', () => {
        speechRate = parseFloat(speedControl.value);
        speedValue.textContent = speechRate.toFixed(1);
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            storyInput.value = clipboardText;
        } catch (err) {
            setStatusMessage('Failed to read from clipboard.', 'error');
        }
    });

    downloadStoryBtn.addEventListener('click', () => {
        if (!lines || lines.length === 0) {
            setStatusMessage('No story to download.', 'error');
            return;
        }
        const storyContent = lines.join('\n');
        const blob = new Blob([storyContent], {
            type: 'text/plain'
        });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'story.txt';
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
        setStatusMessage("Story downloaded successfully.", 'success');
    });

    uploadStoryBtn.addEventListener('click', () => {
        uploadStoryFileInput.click();
    });

    uploadStoryFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            setStatusMessage('No file selected.', 'error');
            return;
        }
        if (!file.name.endsWith('.txt')) {
            setStatusMessage('Please upload a .txt file.', 'error');
            return;
        }
        try {
            const fileContent = await file.text();
            lines = fileContent.split('\n').filter(line => line.trim());
            currentIndex = 0;
            renderChat();
            awardAchievement('storyUploaded');
            setStatusMessage('Custom story uploaded successfully!', 'success');
        } catch (error) {
            console.error('Error reading file:', error);
            setStatusMessage('Failed to upload story.', 'error');
        }
    });

    directGenerateStoryBtn.addEventListener('click', async () => {
        let topic = topicInput.value.trim();
        const language = languageSelect.value;
        const age = combinedAgeInput.value;
        if (!topic) {
            setStatusMessage('Please enter a topic first.', 'error');
            return;
        }
        if (promptOutput.textContent.trim() === '') {
            promptOutput.textContent = generatePrompt(topic, language, age);
            if (promptOutput.textContent.trim() !== lastGeneratedPrompt) {
                awardAchievement('promptGenerated');
                lastGeneratedPrompt = promptOutput.textContent.trim();
            }
        }
        const prompt = promptOutput.textContent.trim();
        directGenerateStoryBtn.disabled = true;
        generateButtonSpinner.style.display = 'inline-block';
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt
                }),
            });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const data = await response.json();
            const generatedStory = data.message;
            lines = generatedStory.split('\n').filter(line => line.trim());
            currentIndex = 0;
            renderChat();
            storyGenerationCount++;
            localStorage.setItem('storyGenerationCount', storyGenerationCount);
            awardAchievement('storyGenerated');
            chatContainer.scrollTop = chatContainer.scrollHeight;
            setStatusMessage('Story generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating story:', error);
            setStatusMessage('Failed. Please try again or try to "Build Custom Story".', 'error');
        } finally {
            directGenerateStoryBtn.disabled = false;
            generateButtonSpinner.style.display = 'none';
        }
    });

    sendToPerplexityBtn.addEventListener('click', () => {
        let topic = topicInput.value.trim();
        const language = languageSelect.value;
        const age = combinedAgeInput.value;
        if (!topic) {
            setStatusMessage('Please enter a topic first.', 'error');
            return;
        }
        if (promptOutput.textContent.trim() === '') {
            promptOutput.textContent = generatePrompt(topic, language, age);
            if (promptOutput.textContent.trim() !== lastGeneratedPrompt) {
                awardAchievement('promptGenerated');
                lastGeneratedPrompt = promptOutput.textContent.trim();
            }
        }
        const prompt = promptOutput.textContent.trim();
        navigator.clipboard.writeText(prompt).then(() => {
            const perplexityUrl = `https://www.perplexity.ai/search/new?q=${encodeURIComponent(prompt)}`;
            window.open(perplexityUrl, '_blank', 'width=800,height=600');
        });
    });

    copyToChatGPTBtn.addEventListener('click', () => {
        let topic = topicInput.value.trim();
        const language = languageSelect.value;
        const age = combinedAgeInput.value;

        if (!topic) {
            setStatusMessage('Please enter a topic first.', 'error');
            return;
        }

        if (promptOutput.textContent.trim() === '') {
            promptOutput.textContent = generatePrompt(topic, language, age);
            if (promptOutput.textContent.trim() !== lastGeneratedPrompt) {
                awardAchievement('promptGenerated');
                lastGeneratedPrompt = promptOutput.textContent.trim();
            }
        }

        const prompt = promptOutput.textContent.trim();
        navigator.clipboard.writeText(prompt).then(() => {
            // Construct the URL for ChatGPT search
            const chatGPTUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
            window.open(chatGPTUrl, '_blank', 'width=800,height=600');
        });
    });

    const achievements = {
        storyProcessed: {
            name: 'Story Processed',
            icon: '📖',
            condition: () => lines.length > 0,
        },
        storyUploaded: {
            name: 'Story Uploaded',
            icon: '📤',
            condition: () => document.getElementById('uploadStoryFile').files.length > 0,
        },
        promptGenerated: {
            name: 'Prompt Generated',
            icon: '💡',
            condition: () => document.getElementById('promptOutput').textContent.trim() !== '',
        },
        storyGenerated: {
            name: 'Story Generated',
            icon: '🌟',
            condition: () => storyGenerationCount > 0,
        },
        storyTranslated: {
            name: 'Story Translated',
            icon: '🌐',
            condition: () => translateBtn.classList.contains('translated')
        }
    };

    function awardAchievement(achievementKey) {
        const achievement = achievements[achievementKey];
        if (achievement && achievement.condition()) {
            earnedAchievements[achievementKey] = (earnedAchievements[achievementKey] || 0) + 1;
            localStorage.setItem('earnedAchievements', JSON.stringify(earnedAchievements));
            displayAchievements();
        }
    }

    function displayAchievements() {
        const achievementsContainer = document.getElementById('achievements-container');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = '';
            for (const key in earnedAchievements) {
                const achievement = achievements[key];
                if (achievement) {
                    const badge = document.createElement('div');
                    badge.className = 'achievement-badge';
                    badge.innerHTML = `<span>${achievement.icon}</span>`;
                    badge.setAttribute('title', achievement.name);
                    const count = document.createElement('span');
                    count.className = 'achievement-count';
                    count.textContent = earnedAchievements[key];
                    badge.appendChild(count)
                    achievementsContainer.appendChild(badge);
                }
            }
        }
    }
    displayAchievements();

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset everything?")) {
            lines = [];
            currentIndex = 0;
            renderChat();
            storyInput.value = '';
            promptOutput.textContent = '';
            localStorage.removeItem('savedStory');
            localStorage.removeItem('earnedAchievements');
            localStorage.setItem('storyGenerationCount', '0');
            storyGenerationCount = 0;
            earnedAchievements = {};
            displayAchievements();
            setStatusMessage("All data reset.", 'success');
        }
    });
    randomWordBtn.addEventListener('click', fillInputWithRandomWord);


    async function translateStory() {
        if (!lines || lines.length === 0) {
            setStatusMessage('No story to translate.', 'error');
            return;
        }

        const sourceLang = 'en';
        const targetLang = languageSelect.value.split('-')[0];

        if (sourceLang === targetLang) {
            setStatusMessage('Source and target languages are the same.', 'error');
            return;
        }

        const textToTranslate = lines.join('\n');
        const maxLength = 500;
        const chunks = [];
        for (let i = 0; i < textToTranslate.length; i += maxLength) {
            chunks.push(textToTranslate.slice(i, i + maxLength));
        }

        let translatedLines = [];
        for (const chunk of chunks) {
            const encodedText = encodeURIComponent(chunk);
            const url = `${TRANSLATE_API_URL}?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                if (data.responseData && data.responseData.translatedText) {
                    translatedLines.push(data.responseData.translatedText);
                } else {
                    throw new Error('Translation failed: Response data not found');
                }
            } catch (error) {
                console.error('Translation error:', error);
                setStatusMessage('Translation failed', 'error');
                translateBtn.classList.remove('translated');
                return;
            }
        }

        lines = translatedLines.join('\n').split('\n').filter(line => line.trim());
        currentIndex = 0;
        renderChat();
        awardAchievement('storyTranslated');
        setStatusMessage('Story translated successfully!', 'success');
        translateBtn.classList.add('translated');
    }
    translateBtn.addEventListener('click', translateStory);

    const footer = document.createElement('footer');
    footer.textContent = "Made by With_Mindset | Developed by S.A.M";
    footer.style.textAlign = 'center';
    footer.style.marginTop = '20px'
    document.body.appendChild(footer);

    topicInput.addEventListener('input', () => {
        promptOutput.textContent = '';
    });

});

document.getElementById('ageInputOption').addEventListener('change', function() {
    document.getElementById('ageInputDiv').style.display = 'block';
    document.getElementById('ageSelectDiv').style.display = 'none';
});

document.getElementById('ageSelectOption').addEventListener('change', function() {
    document.getElementById('ageInputDiv').style.display = 'none';
    document.getElementById('ageSelectDiv').style.display = 'block';
});

let illustration = document.querySelector('.illustration');

function moveAwayFromCursor(event) {
    const screenWidth = window.innerWidth - illustration.offsetWidth;
    const screenHeight = window.innerHeight - illustration.offsetHeight;

    // Calculate a position away from the cursor
    const offsetX = (event.clientX / screenWidth) * 200;
    const offsetY = (event.clientY / screenHeight) * 200;

    const randomX = Math.min(screenWidth, Math.max(0, event.clientX + offsetX));
    const randomY = Math.min(screenHeight, Math.max(0, event.clientY + offsetY));

    illustration.style.left = randomX + 'px';
    illustration.style.top = randomY + 'px';
}
document.addEventListener('mousemove', moveAwayFromCursor);

const button = document.querySelector('.cute-btn');
const inputGroup = document.querySelector('.input-group');
button.addEventListener('click', () => {
    const wave = document.createElement('div');
    wave.classList.add('magical-wave');
    inputGroup.appendChild(wave);
    setTimeout(() => {
        wave.remove();
    }, 500);
});