import * as Tone from 'tone';

class AudioManager {
    constructor() {
        this.player = null;
        this.sounds = {};
    }

    async loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const buffer = new Tone.Buffer(url, () => {
                this.sounds[name] = buffer;
                resolve();
            }, reject);
        });
    }

    async loadAssets() {
        await Promise.all([
            this.loadSound('hit', './hit.mp3'),
            this.loadSound('miss', './miss.mp3'),
        ]);

        this.player = new Tone.Player({
            url: "./song.mp3",
            autostart: false,
        }).toDestination();
        await Tone.loaded();
    }

    playSound(name) {
        if (!this.sounds[name]) return;
        const source = new Tone.BufferSource(this.sounds[name]).toDestination();
        source.start(Tone.now());
    }



    async playMusic() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (this.player.state !== 'started') {
            this.player.start(Tone.now());
        }
    }

    stopMusic() {
        if (this.player) {
            this.player.stop();
        }
    }

    getCurrentTime() {
        if (this.player && this.player.state === 'started') {
            // Get the player's current position in the buffer
            const elapsed = this.player.context.currentTime - this.player.scheduledTime;
            return Math.max(0, elapsed);
        }
        return 0;
    }
}

export default AudioManager;