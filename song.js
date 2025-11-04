import { Midi } from '@tonejs/midi';

export async function loadSong() {
    const midi = await Midi.fromUrl('./beethoven_fifth_op67.mid');
    const notes = [];
    let idCounter = 0;

    // Merge notes from all tracks, but filter for tracks that are likely melodic
    midi.tracks.forEach(track => {
        // Simple heuristic: if a track has a lot of notes, it's probably important.
        // We could also check for track names like "melody", "piano", etc. if available.
        if (track.notes.length > 20) {
            track.notes.forEach(note => {
                notes.push({
                    id: idCounter++,
                    time: note.time,
                    column: note.midi % 4,
                    duration: note.duration,
                    velocity: note.velocity,
                    pitch: note.midi
                });
            });
        }
    });

    // Sort all notes by time, then by pitch to have a consistent order for chords
    notes.sort((a, b) => {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        if (a.pitch < b.pitch) return -1;
        if (a.pitch > b.pitch) return 1;
        return 0;
    });

    // Advanced filtering: prioritize prominent notes and simplify dense sections.
    const filteredNotes = [];
    if (notes.length > 0) {
        const timeThreshold = 0.12; // Minimum time between distinct notes/chords (120ms)
        let lastNoteTime = -1;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            
            // Is this note part of a chord with the previous one?
            const isChord = Math.abs(note.time - lastNoteTime) < 0.02;

            if (isChord) {
                // Check if this column is already used in this chord
                 const isColumnUsed = filteredNotes.some(n => n.time === note.time && n.column === note.column);
                 if (!isColumnUsed) {
                     filteredNotes.push(note);
                 }
            } else if (note.time - lastNoteTime > timeThreshold) {
                // It's a new note/chord, add it.
                filteredNotes.push(note);
                lastNoteTime = note.time;
            }
            // else: note is too close to the previous one, so we skip it to simplify the chart
        }
    }

    // A final pass to ensure no two notes in a chord share a column
    // This can happen if the original filtering wasn't perfect
    const finalNotes = [];
    const notesByTime = new Map();
    for (const note of filteredNotes) {
        if (!notesByTime.has(note.time)) {
            notesByTime.set(note.time, []);
        }
        notesByTime.get(note.time).push(note);
    }
    
    const sortedTimes = Array.from(notesByTime.keys()).sort();
    for (const time of sortedTimes) {
        const chord = notesByTime.get(time);
        const usedColumns = new Set();
        chord.sort((a, b) => b.velocity - a.velocity); // Prioritize louder notes
        for (const note of chord) {
            if (!usedColumns.has(note.column)) {
                finalNotes.push(note);
                usedColumns.add(note.column);
            }
        }
    }

    return finalNotes;
}