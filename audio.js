import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.musicSource = null;
        this.startTime = 0;
        this.startOffset = 0;
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = audioBuffer;
    }

    async loadAssets() {
        await Promise.all([
            this.loadSound('hit', './hit.mp3'),
            this.loadSound('miss', './miss.mp3'),
            this.loadSound('music', './song.mp3')
        ]);
    }

    playSound(name) {
        if (!this.sounds[name] || this.audioContext.state === 'suspended') return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    async playMusic() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        if (this.musicSource) {
            this.stopMusic();
        }
        this.musicSource = this.audioContext.createBufferSource();
        this.musicSource.buffer = this.sounds.music;
        this.musicSource.connect(this.audioContext.destination);
        
        this.startTime = this.audioContext.currentTime;
        this.startOffset = 0;
        this.musicSource.start(0);
    }

    stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource.disconnect();
            this.musicSource = null;
        }
        this.startOffset = this.getCurrentTime();
    }

    getCurrentTime() {
        if (!this.musicSource) {
            return this.startOffset;
        }
        return this.startOffset + (this.audioContext.currentTime - this.startTime);
    }
}

export default AudioManager;