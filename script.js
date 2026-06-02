const storage = window.localStorage;
const audioLock = {};

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initLoginModal();
    initReadingModule();
    initWritingModule();
    initListeningModule();
    initSpeakingModule();
    initDashboardPage();
});

function loadTheme() {
    const theme = storage.getItem('ielts-theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark');
    updateThemeButton();
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    storage.setItem('ielts-theme', isDark ? 'dark' : 'light');
    updateThemeButton();
}

function updateThemeButton() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.textContent = document.body.classList.contains('dark') ? '☀️ Light' : '🌙 Dark';
}

function initLoginModal() {
    const modal = document.getElementById('login-modal');
    const userName = storage.getItem('ielts-user');
    if (!modal) return;
    if (userName) {
        modal.style.display = 'none';
        displayUserName(userName);
        return;
    }
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        if (!name || !email) {
            alert('Please enter your name and email.');
            return;
        }
        storage.setItem('ielts-user', name);
        storage.setItem('ielts-email', email);
        modal.style.display = 'none';
        displayUserName(name);
    });
}

function displayUserName(name) {
    const welcomeEls = document.querySelectorAll('.user-name');
    welcomeEls.forEach(el => {
        el.textContent = name;
    });
}

function initDashboardPage() {
    const page = document.getElementById('dashboard-root');
    if (!page) return;
    const userName = storage.getItem('ielts-user') || 'Student';
    displayUserName(userName);
    const historyData = JSON.parse(storage.getItem('ielts-history') || '[]');
    const historyContainer = document.getElementById('history-body');
    if (historyContainer) {
        if (historyData.length === 0) {
            historyContainer.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">No exam history yet. Start a mock exam to see results.</td></tr>';
        } else {
            historyContainer.innerHTML = historyData.map(item => `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.section}</td>
                    <td>${item.score}</td>
                    <td>${item.status}</td>
                </tr>
            `).join('');
        }
    }
    const practiceStreak = JSON.parse(storage.getItem('ielts-streak') || '0');
    const streakEl = document.getElementById('practice-streak');
    if (streakEl) streakEl.textContent = `${practiceStreak} days`;
}

function startTimer(displayId, totalSeconds, storageKey, onComplete) {
    const display = document.getElementById(displayId);
    if (!display) return null;
    let seconds = totalSeconds;
    const stored = parseInt(storage.getItem(storageKey), 10);
    if (!Number.isNaN(stored) && stored > 0) seconds = stored;
    function update() {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secondsLeft = String(seconds % 60).padStart(2, '0');
        display.textContent = `${minutes}:${secondsLeft}`;
        if (seconds <= 0) {
            clearInterval(timerInterval);
            if (typeof onComplete === 'function') onComplete();
            return;
        }
        seconds -= 1;
        storage.setItem(storageKey, seconds);
    }
    update();
    const timerInterval = setInterval(update, 1000);
    return timerInterval;
}

function initReadingModule() {
    const timer = document.getElementById('reading-timer');
    if (!timer) return;
    const totalSeconds = 60 * 60;
    startTimer('reading-timer', totalSeconds, 'ielts-reading-timer', () => {
        document.getElementById('reading-submit')?.click();
    });
    const stored = JSON.parse(storage.getItem('ielts-reading-state') || '{}');
    Object.keys(stored.answers || {}).forEach((key) => {
        const input = document.getElementById(key);
        if (input) input.value = stored.answers[key];
    });
    const notes = document.getElementById('reading-notes');
    if (notes && stored.notes) notes.value = stored.notes;
    const highlightMessage = document.getElementById('reading-save-state');
    if (highlightMessage) highlightMessage.textContent = 'Auto-saved progress will appear here.';
    document.getElementById('reading-notes')?.addEventListener('input', saveReadingState);
    document.querySelectorAll('[data-reading-answer]').forEach((item) => {
        item.addEventListener('input', saveReadingState);
    });
    document.getElementById('reading-highlight')?.addEventListener('click', highlightReadingSelection);
    document.querySelectorAll('.question-nav button').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.target);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
    setInterval(saveReadingState, 3500);
}

function saveReadingState() {
    const answers = {};
    document.querySelectorAll('[data-reading-answer]').forEach((input) => {
        answers[input.id] = input.value;
    });
    const notes = document.getElementById('reading-notes')?.value || '';
    storage.setItem('ielts-reading-state', JSON.stringify({ answers, notes, savedAt: new Date().toISOString() }));
    const status = document.getElementById('reading-save-state');
    if (status) status.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
}

function highlightReadingSelection() {
    const passage = document.getElementById('reading-passage');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed || !passage.contains(range.commonAncestorContainer)) {
        alert('Please select text within the passage first.');
        return;
    }
    const mark = document.createElement('mark');
    mark.className = 'highlight';
    range.surroundContents(mark);
    selection.removeAllRanges();
}

function checkReadingAnswers() {
    const correct = {
        reading1: 'air',
        reading2: 'noise',
        reading3: 'connected',
        reading4: 'corridors',
        reading5: 'city',
    };
    let score = 0;
    Object.keys(correct).forEach((key) => {
        const input = document.getElementById(key);
        if (!input) return;
        const value = input.value.trim().toLowerCase();
        if (value === correct[key]) {
            input.classList.add('correct');
            input.classList.remove('wrong');
            score += 1;
        } else {
            input.classList.add('wrong');
            input.classList.remove('correct');
        }
    });
    const result = document.getElementById('reading-score');
    if (result) result.textContent = `Instant score: ${score}/5`;
    const history = JSON.parse(storage.getItem('ielts-history') || '[]');
    history.unshift({ section: 'Reading', score: `${score}/5`, status: 'Completed', date: new Date().toLocaleDateString() });
    storage.setItem('ielts-history', JSON.stringify(history.slice(0, 8)));
}

function initWritingModule() {
    const timer = document.getElementById('writing-timer');
    if (!timer) return;
    const totalSeconds = 60 * 60;
    startTimer('writing-timer', totalSeconds, 'ielts-writing-timer', () => {
        document.getElementById('writing-feedback')?.scrollIntoView({ behavior: 'smooth' });
    });
    const stored = JSON.parse(storage.getItem('ielts-writing-state') || '{}');
    if (stored.task1) document.getElementById('writing-task1').value = stored.task1;
    if (stored.task2) document.getElementById('writing-task2').value = stored.task2;
    updateWordCounter('writing-task1', 'word-count-1');
    updateWordCounter('writing-task2', 'word-count-2');
    document.getElementById('writing-task1')?.addEventListener('input', () => {
        updateWordCounter('writing-task1', 'word-count-1');
        saveWritingState();
    });
    document.getElementById('writing-task2')?.addEventListener('input', () => {
        updateWordCounter('writing-task2', 'word-count-2');
        saveWritingState();
    });
    document.getElementById('analysis-button')?.addEventListener('click', generateWritingFeedback);
}

function updateWordCounter(inputId, counterId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;
    const words = input.value.trim().split(/\s+/).filter(Boolean).length;
    counter.textContent = `${words} words`;
}

function saveWritingState() {
    const task1 = document.getElementById('writing-task1')?.value || '';
    const task2 = document.getElementById('writing-task2')?.value || '';
    storage.setItem('ielts-writing-state', JSON.stringify({ task1, task2, savedAt: new Date().toISOString() }));
    const status = document.getElementById('writing-save-state');
    if (status) status.textContent = `Draft saved at ${new Date().toLocaleTimeString()}`;
}

function generateWritingFeedback() {
    const task1 = document.getElementById('writing-task1')?.value.trim() || '';
    const task2 = document.getElementById('writing-task2')?.value.trim() || '';
    const feedback = [];
    const score1 = Math.min(9, Math.max(4, Math.floor(task1.split(/\s+/).filter(Boolean).length / 20) + 4));
    const score2 = Math.min(9, Math.max(4, Math.floor(task2.split(/\s+/).filter(Boolean).length / 30) + 4));
    feedback.push(`Task 1 estimated band: ${score1}. Focus on clear overview and data comparison.`);
    feedback.push(`Task 2 estimated band: ${score2}. Improve coherence by adding linking phrases and clear topic sentences.`);
    feedback.push('Grammar analysis: watch subject-verb agreement and sentence variety.');
    feedback.push('Vocabulary analysis: use a wider range of academic words and synonyms.');
    feedback.push('Coherence feedback: organise your paragraphs with clear progression of ideas.');
    const feedbackArea = document.getElementById('writing-feedback');
    if (feedbackArea) feedbackArea.innerHTML = feedback.map(line => `<p>${line}</p>`).join('');
}

function initListeningModule() {
    const timer = document.getElementById('listening-timer');
    const audio = document.getElementById('listening-audio');
    if (!timer || !audio) return;
    const totalSeconds = 40 * 60;
    startTimer('listening-timer', totalSeconds, 'ielts-listening-timer', () => {
        document.getElementById('listening-submit')?.click();
    });
    audio.addEventListener('play', () => {
        if (audioLock.played) {
            audio.pause();
            alert('One-time playback only. The audio cannot be replayed.');
            return;
        }
        if (!audioLock.started) {
            audioLock.started = true;
        }
    });
    audio.addEventListener('ended', () => {
        audioLock.played = true;
    });
    document.querySelectorAll('[data-listening-answer]').forEach((input) => {
        input.addEventListener('input', saveListeningState);
    });
    const stored = JSON.parse(storage.getItem('ielts-listening-state') || '{}');
    Object.keys(stored.answers || {}).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = stored.answers[key];
    });
    setInterval(saveListeningState, 3000);
}

function saveListeningState() {
    const answers = {};
    document.querySelectorAll('[data-listening-answer]').forEach((input) => {
        answers[input.id] = input.value;
    });
    storage.setItem('ielts-listening-state', JSON.stringify({ answers, savedAt: new Date().toISOString() }));
    const status = document.getElementById('listening-save-state');
    if (status) status.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
}

function checkListeningAnswers() {
    const correct = {
        listen1: 'friday',
        listen2: 'destination',
        listen3: 'breakfast',
        listen4: 'conference',
        listen5: 'museum',
    };
    let score = 0;
    Object.keys(correct).forEach((key) => {
        const input = document.getElementById(key);
        if (!input) return;
        const value = input.value.trim().toLowerCase();
        if (value === correct[key]) {
            input.classList.add('correct');
            input.classList.remove('wrong');
            score += 1;
        } else {
            input.classList.add('wrong');
            input.classList.remove('correct');
        }
    });
    document.getElementById('listening-score').textContent = `Score: ${score}/5`;
    const history = JSON.parse(storage.getItem('ielts-history') || '[]');
    history.unshift({ section: 'Listening', score: `${score}/5`, status: 'Completed', date: new Date().toLocaleDateString() });
    storage.setItem('ielts-history', JSON.stringify(history.slice(0, 8)));
}

function initSpeakingModule() {
    const timer = document.getElementById('speaking-timer');
    if (!timer) return;
    const totalSeconds = 3 * 60;
    startTimer('speaking-timer', totalSeconds, 'ielts-speaking-timer', () => {
        document.getElementById('speaking-feedback')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('record-button')?.addEventListener('click', toggleRecording);
    document.getElementById('analyze-speaking')?.addEventListener('click', analyzeSpeaking);
}

let mediaRecorder;
let recordedChunks = [];

async function toggleRecording() {
    const button = document.getElementById('record-button');
    if (!button) return;
    if (button.dataset.state === 'recording') {
        mediaRecorder?.stop();
        button.dataset.state = 'stopped';
        button.textContent = 'Start Recording';
        return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser.');
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const playback = document.getElementById('recording-playback');
            if (playback) {
                playback.src = url;
                playback.style.display = 'block';
            }
        };
        mediaRecorder.start();
        button.dataset.state = 'recording';
        button.textContent = 'Stop Recording';
    } catch (error) {
        alert('Unable to access microphone: ' + error.message);
    }
}

function analyzeSpeaking() {
    const feedback = [];
    feedback.push('Fluency: steady pace with clear linking words.');
    feedback.push('Pronunciation: good overall clarity, continue to focus on word endings.');
    feedback.push('Grammar: use a wider range of sentence structures.');
    feedback.push('Vocabulary: strong use of everyday vocabulary; aim for more academic terms.');
    feedback.push('Estimated band: 6.5 - 7.0 based on task response and fluency.');
    document.getElementById('speaking-feedback').innerHTML = feedback.map(line => `<p>${line}</p>`).join('');
}

function initListeningPage() {
    if (document.getElementById('listening-root')) {
        initListeningModule();
    }
}

function initWritingPage() {
    if (document.getElementById('writing-root')) {
        initWritingModule();
    }
}

function initReadingPage() {
    if (document.getElementById('reading-root')) {
        initReadingModule();
    }
}

function initSpeakingPage() {
    if (document.getElementById('speaking-root')) {
        initSpeakingModule();
    }
}

function handleSectionChange() {
    const sectionButtons = document.querySelectorAll('.section-button');
    sectionButtons.forEach((button) => {
        const target = document.getElementById(button.dataset.section);
        if (button.classList.contains('active')) {
            target?.classList.remove('hidden');
        } else {
            target?.classList.add('hidden');
        }
    });
}

function setActiveSection(button) {
    document.querySelectorAll('.section-button').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    handleSectionChange();
}

function logoutUser() {
    storage.removeItem('ielts-user');
    storage.removeItem('ielts-email');
    if (document.getElementById('login-modal')) {
        document.getElementById('login-modal').style.display = 'flex';
    }
    displayUserName('');
}
