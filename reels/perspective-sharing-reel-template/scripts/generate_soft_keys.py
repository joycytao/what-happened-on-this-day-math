import math
import wave
from array import array


SAMPLE_RATE = 44100
DURATION = 23.0
BPM = 72.0
BEAT = 60.0 / BPM


def midi_to_hz(note):
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def note_voice(note, start, length, velocity=0.22):
    frequency = midi_to_hz(note)
    start_frame = int(start * SAMPLE_RATE)
    end_frame = min(len(left), int((start + length) * SAMPLE_RATE))
    for frame in range(start_frame, end_frame):
        elapsed = (frame - start_frame) / SAMPLE_RATE
        progress = elapsed / max(length, 0.001)
        attack = min(1.0, elapsed / 0.035)
        release = min(1.0, max(0.0, (1.0 - progress) / 0.18))
        envelope = attack * release * math.exp(-elapsed * 0.42)
        tone = (
            math.sin(2.0 * math.pi * frequency * elapsed)
            + 0.36 * math.sin(2.0 * math.pi * frequency * 2.0 * elapsed)
            + 0.12 * math.sin(2.0 * math.pi * frequency * 3.0 * elapsed)
        )
        sample = velocity * envelope * tone
        left[frame] += sample * 0.98
        right[frame] += sample * 1.02


left = [0.0] * int(DURATION * SAMPLE_RATE)
right = [0.0] * int(DURATION * SAMPLE_RATE)

# Original, gentle progression: Dmaj7 → Bm7 → Gmaj7 → Aadd9.
chords = [
    ([50, 54, 57, 61], 0.0),
    ([47, 50, 54, 57], 4.0 * BEAT),
    ([43, 47, 50, 54], 8.0 * BEAT),
    ([45, 49, 52, 59], 12.0 * BEAT),
    ([50, 54, 57, 61], 16.0 * BEAT),
    ([47, 50, 54, 57], 20.0 * BEAT),
]

for chord, start in chords:
    for index, note in enumerate(chord):
        note_voice(note, start + index * 0.018, 4.9 * BEAT, 0.115)

# A new, sparse top-line melody with lots of breathing room.
melody = [
    (74, 1.0, 0.72), (76, 2.0, 0.52), (78, 3.1, 0.8),
    (76, 5.1, 0.62), (73, 6.4, 0.78), (71, 8.0, 0.58),
    (74, 9.3, 0.82), (76, 11.0, 0.68), (78, 13.0, 0.9),
    (81, 14.8, 0.52), (78, 16.1, 0.76), (76, 18.0, 0.62),
    (74, 19.2, 0.82), (71, 21.0, 0.9),
]
for note, beat_position, length in melody:
    note_voice(note, beat_position * BEAT, length * BEAT, 0.18)

# Subtle stereo echo to create a soft room without adding percussion.
delay = int(0.23 * SAMPLE_RATE)
for index in range(delay, len(left)):
    left[index] += right[index - delay] * 0.085
    right[index] += left[index - delay] * 0.07

peak = max(max(abs(value) for value in left), max(abs(value) for value in right), 0.001)
gain = 0.72 / peak
pcm = array("h")
for left_sample, right_sample in zip(left, right):
    pcm.append(int(max(-1.0, min(1.0, left_sample * gain)) * 32767))
    pcm.append(int(max(-1.0, min(1.0, right_sample * gain)) * 32767))

with wave.open("original-soft-keys.wav", "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SAMPLE_RATE)
    output.writeframes(pcm.tobytes())
