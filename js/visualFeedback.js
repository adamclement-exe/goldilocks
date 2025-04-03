// --- START OF FILE visualFeedback.js ---

import * as GameState from './gameState.js';

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return oscillator;
}

const sounds = {
    achievement: () => {
        const sound = createSound(880, 0.5, 'sine');
        sound.start();
        sound.stop(audioContext.currentTime + 0.5);
    },
    celebration: () => {
        const frequencies = [440, 523.25, 659.25, 783.99];
        frequencies.forEach((freq, i) => {
            const sound = createSound(freq, 0.3, 'sine');
            sound.start(audioContext.currentTime + (i * 0.1));
            sound.stop(audioContext.currentTime + 0.3 + (i * 0.1));
        });
    },
    storyComplete: () => {
        const sound = createSound(659.25, 0.3, 'triangle');
        sound.start();
        sound.stop(audioContext.currentTime + 0.3);
    },
    workerAssigned: () => {
        const sound = createSound(523.25, 0.2, 'square');
        sound.start();
        sound.stop(audioContext.currentTime + 0.2);
    }
};

// Sound control
let soundEnabled = true;

export function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
    }
}

// Create sound controls
export function createSoundControls() {
    const controls = document.createElement('div');
    controls.className = 'sound-controls';
    controls.innerHTML = `
        <button id="sound-toggle" class="sound-toggle" onclick="window.visualFeedback.toggleSound()">
            🔊 Sound On
        </button>
    `;
    document.body.appendChild(controls);
}

// Play sound effect
function playSound(soundName) {
    if (!soundEnabled) return;
    const sound = sounds[soundName];
    if (sound) {
        sound();
    }
}

// Create celebration effect
export function createCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    
    // Create particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        celebration.appendChild(particle);
    }
    
    document.body.appendChild(celebration);
    playSound('celebration');
    
    // Remove after animation
    setTimeout(() => celebration.remove(), 1000);
}

// Show achievement indicator
export function showAchievementIndicator(achievement) {
    const indicator = document.createElement('div');
    indicator.className = 'achievement-indicator';
    indicator.textContent = `Achievement Unlocked: ${achievement.name} (+${achievement.points} points)`;
    
    document.body.appendChild(indicator);
    playSound('achievement');
    
    // Remove after animation
    setTimeout(() => indicator.remove(), 3000);
}

// Show streak indicator
export function showStreakIndicator(streakCount) {
    const indicator = document.createElement('div');
    indicator.className = 'streak-indicator';
    indicator.textContent = `🔥 ${streakCount} Story Streak!`;
    
    document.body.appendChild(indicator);
    
    // Remove after animation
    setTimeout(() => indicator.remove(), 3000);
}

// Create team morale indicator
export function createTeamMoraleIndicator() {
    const container = document.createElement('div');
    container.className = 'team-morale-container';
    container.innerHTML = `
        <div class="team-morale-title">Team Morale</div>
        <div class="progress-container">
            <div class="progress-bar" id="team-morale-bar" style="width: 0%">0%</div>
        </div>
    `;
    document.body.appendChild(container);
    return container;
}

// Create story quality indicator
export function createStoryQualityIndicator() {
    const container = document.createElement('div');
    container.className = 'story-quality-container';
    container.innerHTML = `
        <div class="story-quality-title">Story Quality</div>
        <div class="progress-container">
            <div class="progress-bar" id="story-quality-bar" style="width: 0%">0%</div>
        </div>
    `;
    document.body.appendChild(container);
    return container;
}

// Update team morale indicator
export function updateTeamMoraleIndicator(morale) {
    const bar = document.getElementById('team-morale-bar');
    if (bar) {
        bar.style.width = `${morale}%`;
        bar.textContent = `${Math.round(morale)}%`;
    }
}

// Update story quality indicator
export function updateStoryQualityIndicator(quality) {
    const bar = document.getElementById('story-quality-bar');
    if (bar) {
        bar.style.width = `${quality}%`;
        bar.textContent = `${Math.round(quality)}%`;
    }
}

// Add achievement badge to story card
export function addAchievementBadge(storyCard, achievement) {
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.textContent = '🏆';
    badge.title = `Achievement: ${achievement.name}`;
    storyCard.appendChild(badge);
}

// Initialize visual feedback system
export function initializeVisualFeedback() {
    createSoundControls();
    createTeamMoraleIndicator();
    createStoryQualityIndicator();
    
    // Initial values
    updateTeamMoraleIndicator(50);
    updateStoryQualityIndicator(50);
}

// --- END OF FILE visualFeedback.js --- 