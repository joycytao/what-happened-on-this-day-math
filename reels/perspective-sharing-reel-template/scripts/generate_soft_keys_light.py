import math
import wave
from array import array


SAMPLE_RATE = 44100
DURATION = 23.0
BPM = 78.0
BEAT = 60.0 / BPM


def midi_to_hz(note):
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def note_voice(note, start, length, velocity=0.2, decay=0.7):
    frequency = midi_to_hz(note)
    start_frame = int(start * SAMPLE_RATE)
    end_frame = min(len(left), int((start + length) * SAMPLE_RATE))
    for frame in range(start_frame, end_frame):
        elapsed = (frame - start_frame) / SAMPLE_RATE
        progress = elapsed / max(length, 0.001)
        attack = min(1.0, elapsed / 0.028)
        release = min(1.0, max(0.0, (1.0 - progress) / 0.16))
        envelope = attack * release * math.exp(-elapsed * decay)
        # Keep the upper partials restrained so the keys stay piano-like,
        # avoiding a bright flute/bell character in the high melody.
        tone = (
            math.sin(2.0 * math.pi * frequency * elapsed)
            + 0.12 * math.sin(2.0 * math.pi * frequency * 2.0 * elapsed)
            + 0.025 * math.sin(2.0 * math.pi * frequency * 3.0 * elapsed)
        )
        sample = velocity * envelope * tone
        left[frame] += sample * 0.99
        right[frame] += sample * 1.01


left = [0.0] * int(DURATION * SAMPLE_RATE)
right = [0.0] * int(DURATION * SAMPLE_RATE)

# Brighter original 3/4 progression: Cmaj7 → G6 → Am7 → Fmaj7.
chords = [
    ([48, 52, 55, 59], 0.0),
    ([43, 47, 50, 54], 3.0 * BEAT),
    ([45, 48, 52, 55], 6.0 * BEAT),
    ([41, 45, 48, 52], 9.0 * BEAT),
    ([48, 52, 55, 59], 12.0 * BEAT),
    ([43, 47, 50, 54], 15.0 * BEAT),
    ([41, 45, 48, 52], 18.0 * BEAT),
    ([43, 47, 50, 54], 21.0 * BEAT),
    ([48, 52, 55, 59], 24.0 * BEAT),
    ([43, 47, 50, 54], 27.0 * BEAT),
]

for chord, start in chords:
    # Beat 1: soft bass anchor; beats 2 and 3: light chord response.
    note_voice(chord[0] - 12, start, 1.45 * BEAT, 0.115, 0.92)
    for index, note in enumerate(chord):
        note_voice(note, start + index * 0.014, 2.55 * BEAT, 0.082, 0.86)
    for accent in (1.0, 2.0):
        for note in chord[1:3]:
            note_voice(note, start + accent * BEAT, 0.34 * BEAT, 0.038, 1.2)

# Light, original upper-line phrases with a little forward motion.
melody = [
    (76, 0.55, 0.42), (79, 1.42, 0.5), (81, 2.32, 0.62),
    (79, 3.55, 0.46), (76, 4.45, 0.55), (79, 5.35, 0.5),
    (83, 6.55, 0.62), (81, 7.4, 0.48), (79, 8.3, 0.54),
    (81, 9.6, 0.5), (84, 10.45, 0.68), (81, 11.35, 0.48),
    (79, 12.55, 0.56), (81, 13.45, 0.48), (84, 14.3, 0.64),
    (83, 15.55, 0.5), (81, 16.45, 0.56), (79, 17.35, 0.48),
    (76, 18.6, 0.58), (79, 19.45, 0.52), (81, 20.35, 0.65),
    (79, 21.55, 0.5), (81, 22.4, 0.6), (84, 23.3, 0.7),
    (81, 25.0, 0.54), (79, 26.0, 0.62), (76, 27.5, 0.7),
]
for note, beat_position, length in melody:
    # Keep the melody in a warmer piano register.
    note_voice(note - 12, beat_position * BEAT, length * BEAT, 0.16, 1.35)

# Quiet stereo room echo; no percussion or recognizable borrowed melody.
delay = int(0.19 * SAMPLE_RATE)
for index in range(delay, len(left)):
    left[index] += right[index - delay] * 0.055
    right[index] += left[index - delay] * 0.045

peak = max(max(abs(value) for value in left), max(abs(value) for value in right), 0.001)
gain = 0.70 / peak
pcm = array("h")
for left_sample, right_sample in zip(left, right):
    pcm.append(int(max(-1.0, min(1.0, left_sample * gain)) * 32767))
    pcm.append(int(max(-1.0, min(1.0, right_sample * gain)) * 32767))

with wave.open("original-soft-keys-light.wav", "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SAMPLE_RATE)
    output.writeframes(pcm.tobytes())
