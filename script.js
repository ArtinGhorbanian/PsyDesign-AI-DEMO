// static/script.js

/**
 * This script handles all the client-side interactivity for the PsyDesign AI dashboard.
 * It manages UI state, API requests, dynamic content rendering, and user interactions.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. Element Selectors
    // Caching DOM elements for efficient and repeated access.
    // ==========================================================================
    const generateBtn = document.getElementById('generate-btn');
    const brandDescriptionInput = document.getElementById('brand-description');
    const loaderContainer = document.getElementById('loader-container');
    const brandOutput = document.getElementById('brand-output');
    const historyList = document.getElementById('history-list');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const newDesignBtn = document.getElementById('new-design-btn');
    const inputSectionWrapper = document.getElementById('input-section-wrapper');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const languageSelector = document.getElementById('language-selector');
    const currentLangText = document.getElementById('current-lang-text');
    const languageOptions = document.getElementById('language-options');
    const allLangOptions = languageOptions.querySelectorAll('li');

    // ==========================================================================
    // 2. Application State
    // Variables to hold the application's state throughout the user session.
    // ==========================================================================
    let currentAnalysisData = null; // Stores the JSON data of the currently displayed brand.
    let currentHistory = [];        // Caches the list of history items fetched from the server.
    let currentAudio = null;        // Holds the active Audio object for TTS.
    let currentlyPlayingButton = null; // Tracks the TTS button that is currently active.

    // ==========================================================================
    // 3. UI Enhancements & Effects
    // ==========================================================================

    /**
     * Custom Cursor Logic
     * Creates a smooth, animated cursor for a more engaging user experience.
     * This effect is only enabled on devices with a fine pointer (like a mouse).
     */
    if (window.matchMedia("(pointer: fine)").matches) {
        const customCursor = document.querySelector('.custom-cursor');
        let mouse = { x: -100, y: -100 }; // Current mouse position
        let pos = { x: 0, y: 0 };         // Smoothed cursor position
        const speed = 0.1;               // Smoothing factor

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        const updateCursorPosition = () => {
            pos.x += (mouse.x - pos.x) * speed;
            pos.y += (mouse.y - pos.y) * speed;
            customCursor.style.transform = `translate3d(${pos.x - (customCursor.offsetWidth / 2)}px, ${pos.y - (customCursor.offsetHeight / 2)}px, 0)`;
            requestAnimationFrame(updateCursorPosition); // Create a smooth animation loop
        };
        updateCursorPosition();

        // Enlarge the cursor when hovering over interactive elements.
        const interactiveElements = 'a, button, .history-item, textarea, input, li, .sidebar-logo-container';
        document.body.addEventListener('mouseover', (e) => {
            document.body.classList.toggle('link-hover', !!e.target.closest(interactiveElements));
        });
    }

    // ==========================================================================
    // 4. Core Functions
    // The main logic for handling UI changes, API calls, and data rendering.
    // ==========================================================================

    /**
     * Toggles the visibility of the sidebar and the overlay.
     */
    const toggleSidebar = () => {
        const isOpen = sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
        menuToggle.classList.toggle('hidden', isOpen);
    };

    /**
     * Initializes the language selector dropdown with the current language.
     */
    const setupLanguageSelector = () => {
        const currentLangValue = document.documentElement.lang || 'en';
        const selectedOption = Array.from(allLangOptions).find(li => li.dataset.value === currentLangValue);

        if (selectedOption) {
            currentLangText.textContent = selectedOption.textContent;
            selectedOption.classList.add('selected');
        }

        // Toggle dropdown visibility.
        languageSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            languageSelector.classList.toggle('open');
        });

        // Handle language change.
        allLangOptions.forEach(li => {
            li.addEventListener('click', () => {
                window.location.href = `/?lang=${li.dataset.value}`;
            });
        });
    };
    
    // Close the language selector if the user clicks outside of it.
    document.addEventListener('click', () => {
        if (languageSelector.classList.contains('open')) {
            languageSelector.classList.remove('open');
        }
    });

    /**
     * Fetches the design history from the API and populates the sidebar.
     */
    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            if (!response.ok) throw new Error('Failed to fetch history.');
            currentHistory = await response.json();
            historyList.innerHTML = ''; // Clear the list before repopulating

            currentHistory.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.dataset.id = item.id;
                li.title = item.description;
                li.innerHTML = `<p>${item.description}</p><button class="delete-history-btn" title="Delete"><i data-lucide="x" size="16"></i></button>`;

                // Attach event listener for deleting the item.
                li.querySelector('.delete-history-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the click from also selecting the item.
                    handleDeleteHistory(item.id, li);
                });

                // Attach event listener for viewing the item.
                li.addEventListener('click', () => displayHistoryItem(item.id));
                historyList.appendChild(li);
            });
            lucide.createIcons(); // Re-render icons after adding them to the DOM.
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    /**
     * Handles the deletion of a history item.
     * @param {number} id - The ID of the history item to delete.
     * @param {HTMLElement} element - The list item element in the DOM.
     */
    async function handleDeleteHistory(id, element) {
        if (!confirm('Are you sure you want to delete this design?')) return;
        try {
            const response = await fetch(`/api/history/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete item.');

            // Animate the element out before removing it from the DOM.
            element.style.transition = 'opacity 0.3s, transform 0.3s';
            element.style.opacity = '0';
            element.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                element.remove();
                // If the deleted item was the active one, return to the main input screen.
                if (element.classList.contains('active')) showInputScreen();
            }, 300);
        } catch (error) {
            console.error('Error deleting history item:', error);
            alert('Could not delete the item.');
        }
    }

    /**
     * Displays the details of a selected history item.
     * @param {number} id - The ID of the history item to display.
     */
    function displayHistoryItem(id) {
        const item = currentHistory.find(h => h.id == id);
        if (item) {
            displayResults(item.analysis, item.logo_url);
            setActiveHistoryItem(id);
            if (sidebar.classList.contains('open')) toggleSidebar(); // Close sidebar on mobile
        }
    }

    /**
     * Main function to handle the brand generation request.
     */
    async function handleGenerateClick() {
        const description = brandDescriptionInput.value.trim();
        if (!description) {
            alert('Please describe your brand concept.');
            return;
        }

        // Switch to the loading view.
        inputSectionWrapper.style.display = 'none';
        loaderContainer.style.display = 'block';
        brandOutput.style.display = 'none';

        try {
            const response = await fetch('/api/generate-brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, language: document.documentElement.lang }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Server error.');
            }
            const data = await response.json();
            displayResults(data.analysis, data.logo_url);
            await loadHistory(); // Refresh history to include the new item.
            setActiveHistoryItem(data.id);
        } catch (error) {
            console.error('Error:', error);
            alert(`Failed to generate brand identity: ${error.message}`);
            showInputScreen(); // Return to input screen on error.
        } finally {
            loaderContainer.style.display = 'none';
        }
    }
    
    /**
     * Dynamically loads a Google Font stylesheet if it hasn't been loaded yet.
     * @param {string} fontName - The name of the Google Font to load.
     */
    function loadGoogleFont(fontName) {
        const fontId = `font-${fontName.replace(/\s+/g, '-')}`;
        if (document.getElementById(fontId)) return; // Don't load the same font twice.

        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
        document.head.appendChild(link);
    }

    /**
     * Renders the brand analysis results on the page.
     * @param {object} analysisData - The JSON object containing the brand identity.
     * @param {string} logoUrl - The URL of the generated logo.
     */
    function displayResults(analysisData, logoUrl) {
        currentAnalysisData = analysisData; // Store current data for other functions (like chat).
        const t = getTranslations(); // Get UI text for the current language.
        const { brand_personality, visual_identity, target_audience_persona, brand_names, slogans, brand_story } = analysisData;
        
        // Dynamically load the recommended fonts.
        const headingFont = visual_identity.font_pairing.heading.name;
        const bodyFont = visual_identity.font_pairing.body.name;
        loadGoogleFont(headingFont);
        loadGoogleFont(bodyFont);

        // Populate the brand output container with the results.
        brandOutput.innerHTML = `
            <div class="result-card">
                <h2>${t.report_title}</h2>
                <div class="grid-2">
                    <div class="grid-item"><h4>${t.brand_archetype}</h4><p>${brand_personality.archetype}</p></div>
                    <div class="grid-item"><h4>${t.tone_of_voice}</h4><p>${brand_personality.tone_of_voice}</p></div>
                    <div class="grid-item" style="grid-column: 1 / -1;"><h4>${t.core_values}</h4><ul>${brand_personality.values.map(v => `<li>${v}</li>`).join('')}</ul></div>
                </div>
            </div>
            
            <div class="result-card">
                <h2>${t.logo_title}</h2>
                <div class="logo-container" id="main-logo-container">
                    <img src="${logoUrl}" alt="Generated Brand Logo" id="main-logo-img">
                    <button class="download-logo-btn" id="download-logo-btn" title="Download Logo"><i data-lucide="download"></i></button>
                </div>
            </div>

            <div class="result-card">
                <h2>${t.font_pairing_live}</h2>
                <div class="font-preview-container">
                    <p class="font-preview-heading" style="font-family: '${headingFont}', var(--font-heading);">${t.font_preview_heading_text}</p>
                    <p class="font-preview-body" style="font-family: '${bodyFont}', var(--font-body);">${t.font_preview_body_text}</p>
                </div>
                <p class="font-info">${t.heading}: ${headingFont} | ${t.body}: ${bodyFont}</p>
            </div>

            <div class="result-card">
                <h2>${t.brand_story_title}</h2>
                <p><em>"${brand_story}"</em></p>
            </div>

            <div class="result-card">
                <h2>${t.brand_names_title}</h2>
                <ul class="suggestions-list">${brand_names.map(name => `<li>${name}</li>`).join('')}</ul>
            </div>

            <div class="result-card">
                <h2>${t.slogans_title}</h2>
                <ul class="suggestions-list">${slogans.map(slogan => `<li>${slogan}</li>`).join('')}</ul>
            </div>

            <div class="result-card">
                <h3>${t.target_audience}: ${target_audience_persona.name}</h3>
                <div class="grid-2">
                    <div class="grid-item"><p><strong>${t.age}:</strong> ${target_audience_persona.age_range}</p></div>
                    <div class="grid-item"><p><strong>${t.occupation}:</strong> ${target_audience_persona.occupation}</p></div>
                </div>
                <div class="grid-item" style="margin-top: 1.5rem;"><h4>${t.interests}</h4><ul>${target_audience_persona.interests.map(i => `<li>${i}</li>`).join('')}</ul></div>
                <div class="grid-item" style="margin-top: 1.5rem;"><h4>${t.pain_points}</h4><ul>${target_audience_persona.pain_points.map(p => `<li>${p}</li>`).join('')}</ul></div>
            </div>

            <div class="result-card persona-chat-container">
                <h2>${t.chat_title}</h2>
                <div id="chat-box" class="chat-box"></div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="${t.chat_placeholder}">
                    <button id="chat-send-btn"><i data-lucide="send"></i></button>
                </div>
            </div>
        `;

        // Hide the input screen and show the results.
        inputSectionWrapper.style.display = 'none';
        brandOutput.style.display = 'flex';

        // Attach event listeners to the newly created elements.
        document.getElementById('chat-send-btn').addEventListener('click', handleChatSend);
        document.getElementById('chat-input').addEventListener('keyup', e => { if (e.key === 'Enter') handleChatSend(); });
        document.getElementById('download-logo-btn').addEventListener('click', handleDownloadLogo);
        lucide.createIcons();
    }

    /**
     * Handles the logo download process by calling the proxy endpoint.
     */
    async function handleDownloadLogo() {
        const btn = document.getElementById('download-logo-btn');
        const logoImg = document.getElementById('main-logo-img');
        if (!logoImg) return;

        btn.innerHTML = '<div class="download-loader"></div>'; // Show loading spinner
        btn.disabled = true;

        try {
            const logoUrl = logoImg.src;
            // The proxy endpoint handles serving the file for download.
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(logoUrl.replace(window.location.origin, ''))}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            
            const imageBlob = await response.blob();
            const blobUrl = URL.createObjectURL(imageBlob);
            
            // Create a temporary link to trigger the download.
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `logo_${currentAnalysisData.brand_names[0].replace(/\s+/g, '_') || 'brand'}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(blobUrl); // Clean up the blob URL.
        } catch (error) {
            console.error("Download Error:", error);
            alert(`Could not download the logo: ${error.message}`);
        } finally {
            // Restore the download button to its original state.
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="download"></i>';
            lucide.createIcons();
        }
    }
    
    /**
     * Sends a user's message to the chat API and displays the response.
     */
    async function handleChatSend() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        if (!message || !currentAnalysisData) return;

        appendChatMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true; // Prevent multiple submissions

        try {
            const response = await fetch('/api/chat-with-persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysis: JSON.stringify(currentAnalysisData),
                    message,
                    language: document.documentElement.lang
                }),
            });
            if (!response.ok) throw new Error("Chat API Error");
            const data = await response.json();
            appendChatMessage(data.reply || data.error || 'Sorry, I could not respond.', 'persona');
        } catch (error) {
            console.error('Chat error:', error);
            appendChatMessage('An error occurred.', 'persona');
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }
    
    /**
     * Appends a new message to the chat box UI.
     * @param {string} text - The message content.
     * @param {string} sender - 'user' or 'persona'.
     */
    function appendChatMessage(text, sender) {
        const chatBox = document.getElementById('chat-box');
        if (!chatBox) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        messageDiv.appendChild(bubble);

        // Add action buttons (copy, speak) only to persona messages.
        if (sender === 'persona') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'chat-message-actions';
            actionsDiv.innerHTML = `
                <button class="chat-action-btn copy-btn" title="Copy text"><i data-lucide="copy" size="16"></i></button>
                <button class="chat-action-btn speak-btn" title="Read aloud" data-text="${text}">
                    <img src="/static/speaker-filled-audio-tool.png" alt="Speak">
                </button>`;
            messageDiv.appendChild(actionsDiv);
        }
        chatBox.appendChild(messageDiv);
        lucide.createIcons();
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message.

        // Add functionality to the copy button.
        const copyBtn = messageDiv.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.innerHTML = '<i data-lucide="check" size="16"></i>';
                    lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i data-lucide="copy" size="16"></i>';
                        lucide.createIcons();
                    }, 1500); // Revert icon after 1.5s
                });
            });
        }
        
        // Add functionality to the speak button.
        const speakBtn = messageDiv.querySelector('.speak-btn');
        if (speakBtn) speakBtn.addEventListener('click', () => handleTTS(speakBtn));
    }

    /**
     * Stops any currently playing Text-to-Speech audio.
     */
    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (currentlyPlayingButton) {
            currentlyPlayingButton.innerHTML = `<img src="/static/speaker-filled-audio-tool.png" alt="Speak">`;
            currentlyPlayingButton = null;
        }
    }

    /**
     * Handles Text-to-Speech (TTS) requests.
     * @param {HTMLElement} button - The speak button that was clicked.
     */
    async function handleTTS(button) {
        const textToSpeak = button.dataset.text;

        if (currentlyPlayingButton === button) {
            // If the same button is clicked again, stop the audio.
            stopCurrentAudio();
        } else {
            stopCurrentAudio(); // Stop any previous audio first.
            currentlyPlayingButton = button;
            button.innerHTML = '<i data-lucide="x" size="18"></i>'; // Show a 'stop' icon
            lucide.createIcons();
            try {
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: textToSpeak }),
                });
                if (!response.ok) {
                    const errData = await response.json();
                    alert(errData.error || "TTS feature is part of the full product.");
                    throw new Error('Failed to generate audio.');
                }
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                currentAudio = new Audio(audioUrl);
                currentAudio.play();
                currentAudio.onended = stopCurrentAudio; // Clean up when audio finishes.
            } catch (error) {
                console.error('TTS error:', error);
                stopCurrentAudio(); // Clean up on error.
            }
        }
    }

    /**
     * Highlights the currently active history item in the sidebar.
     * @param {number|null} id - The ID of the item to activate, or null to deactivate all.
     */
    function setActiveHistoryItem(id) {
        document.querySelectorAll('.history-item').forEach(el => {
            el.classList.toggle('active', id && parseInt(el.dataset.id, 10) === id);
        });
    }

    /**
     * Resets the UI to the initial input screen.
     */
    function showInputScreen() {
        inputSectionWrapper.style.display = 'block';
        loaderContainer.style.display = 'none';
        brandOutput.style.display = 'none';
        brandDescriptionInput.value = '';
        setActiveHistoryItem(null); // Deactivate any selected history item.
    }
    
    /**
     * Retrieves translation strings for dynamic UI elements based on the document's language.
     * @returns {object} An object containing translated strings.
     */
    function getTranslations() {
        // This object mirrors the structure of translations needed for the results page.
        // It prevents hardcoding English text into the JavaScript.
        const translations = {
            en: { report_title: "Brand Psychology Report", logo_title: "Generated Logo", chat_title: "Chat with Your Brand Persona", chat_placeholder: "Ask about brand voice...", chat_button: "Send", brand_archetype: "Brand Archetype", tone_of_voice: "Tone of Voice", core_values: "Core Values", font_pairing_live: "Live Font Pairing Preview", heading: "Heading", body: "Body", target_audience: "Target Audience", age: "Age", occupation: "Occupation", interests: "Interests", pain_points: "Pain Points", brand_names_title: "Suggested Brand Names", slogans_title: "Suggested Slogans", brand_story_title: "Brand Story", font_preview_heading_text: "This is a Heading.", font_preview_body_text: "This is the body text. It's designed to give you a feel for the selected font in a paragraph." },
            es: { report_title: "Informe de Psicología de Marca", logo_title: "Logo Generado", chat_title: "Chatea con la Persona de tu Marca", chat_placeholder: "Pregunta sobre el tono...", chat_button: "Enviar", brand_archetype: "Arquetipo de Marca", tone_of_voice: "Tono de Voz", core_values: "Valores Fundamentales", font_pairing_live: "Previsualización de Fuentes en Vivo", heading: "Título", body: "Cuerpo", target_audience: "Público Objetivo", age: "Edad", occupation: "Ocupación", interests: "Intereses", pain_points: "Puntos de Dolor", brand_names_title: "Nombres de Marca Sugeridos", slogans_title: "Lemas Sugeridos", brand_story_title: "Historia de la Marca", font_preview_heading_text: "Esto es un Título.", font_preview_body_text: "Este es el texto del cuerpo. Está diseñado para que te hagas una idea de la fuente seleccionada en un párrafo." },
            fr: { report_title: "Rapport de Psychologie de Marque", logo_title: "Logo Généré", chat_title: "Discutez avec le Persona", chat_placeholder: "Posez des questions...", chat_button: "Envoyer", brand_archetype: "Archétype de Marque", tone_of_voice: "Ton de la Voix", core_values: "Valeurs Fondamentales", font_pairing_live: "Aperçu en Direct des Polices", heading: "Titre", body: "Corps", target_audience: "Public Cible", age: "Âge", occupation: "Profession", interests: "Intérêts", pain_points: "Points de Douleur", brand_names_title: "Noms de Marque Suggérés", slogans_title: "Slogans Suggérés", brand_story_title: "Histoire de la Marque", font_preview_heading_text: "Ceci est un Titre.", font_preview_body_text: "Ceci est le corps du texte. Il est conçu pour vous donner une idée de la police sélectionnée dans un paragraphe." },
            hi: { report_title: "ब्रांड मनोविज्ञान रिपोर्ट", logo_title: "उत्पन्न लोगो", chat_title: "अपने ब्रांड व्यक्तित्व से चैट करें", chat_placeholder: "आवाज़ के बारे में पूछें...", chat_button: "भेजें", brand_archetype: "ब्रांड आद्यरूप", tone_of_voice: "आवाज़ का लहजा", core_values: "मूलभूत मूल्य", font_pairing_live: "लाइव फ़ॉन्ट पूर्वावलोकन", heading: "शीर्षक", body: "मुख्य-भाग", target_audience: "लक्षित दर्शक", age: "आयु", occupation: "व्यवसाय", interests: "रूचियाँ", pain_points: "समस्याएं", brand_names_title: "सुझाए गए ब्रांड नाम", slogans_title: "सुझाए गए नारे", brand_story_title: "ब्रांड की कहानी", font_preview_heading_text: "यह एक शीर्षक है।", font_preview_body_text: "यह मुख्य लेख है। इसे आपको एक पैराग्राफ में चयनित फ़ॉन्ट का अनुभव देने के लिए डिज़ाइन किया गया है।" },
            zh: { report_title: "品牌心理学报告", logo_title: "生成的标志", chat_title: "与您的品牌形象聊天", chat_placeholder: "询问品牌声音...", chat_button: "发送", brand_archetype: "品牌原型", tone_of_voice: "语气", core_values: "核心价值观", font_pairing_live: "字体实时预览", heading: "标题", body: "正文", target_audience: "目标受众", age: "年龄", occupation: "职业", interests: "兴趣", pain_points: "痛点", brand_names_title: "建议的品牌名称", slogans_title: "建议的口号", brand_story_title: "品牌故事", font_preview_heading_text: "这是一个标题。", font_preview_body_text: "这是正文文本。它旨在让您感受所选字体在段落中的效果。" },
            ar: { report_title: "تقرير سيكولوجية العلامة التجارية", logo_title: "الشعار المُولَّد", chat_title: "تحدث مع شخصية علامتك", chat_placeholder: "اسأل عن نبرة العلامة...", chat_button: "إرسال", brand_archetype: "النموذج الأصلي للعلامة", tone_of_voice: "نبرة الصوت", core_values: "القيم الأساسية", font_pairing_live: "معاينة حية للخطوط", heading: "عنوان", body: "متن", target_audience: "الجمهور المستهدف", age: "العمر", occupation: "المهنة", interests: "الاهتمامات", pain_points: "نقاط الألم", brand_names_title: "أسماء تجارية مقترحة", slogans_title: "شعارات مقترحة", brand_story_title: "قصة العلامة التجارية", font_preview_heading_text: "هذا عنوان.", font_preview_body_text: "هذا هو نص المتن. وهو مصمم ليعطيك إحساسًا بالخط المحدد في فقرة." },
        };
        return translations[document.documentElement.lang] || translations['en'];
    }
    
    // ==========================================================================
    // 5. Initial Setup & Event Listeners
    // Attaches event listeners and runs initial setup functions on page load.
    // ==========================================================================
    lucide.createIcons(); // Initial render for all icons.
    loadHistory(); 
    setupLanguageSelector();
    generateBtn.addEventListener('click', handleGenerateClick);
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    sidebarCloseBtn.addEventListener('click', toggleSidebar);
    newDesignBtn.addEventListener('click', showInputScreen);
});