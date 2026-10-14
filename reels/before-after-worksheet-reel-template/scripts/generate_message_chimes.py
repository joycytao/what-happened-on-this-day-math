import math
import wave
from array import array


SAMPLE_RATE = 44100
DURATION = 37.5
EVENTS = [0.3, 2.75, 5.15, 12.8, 16.05]


def add_tone(buffer, start, frequency, length, amplitude):
    start_frame = int(start * SAMPLE_RATE)
    end_frame = min(len(buffer), int((start + length) * SAMPLE_RATE))
    for frame in range(start_frame, end_frame):
        elapsed = (frame - start_frame) / SAMPLE_RATE
        attack = min(1.0, elapsed / 0.012)
        release = min(1.0, max(0.0, (length - elapsed) / 0.16))
        envelope = attack * release * math.exp(-elapsed * 4.8)
        buffer[frame] += amplitude * envelope * math.sin(2.0 * math.pi * frequency * elapsed)


mono = [0.0] * int(DURATION * SAMPLE_RATE)
for event in EVENTS:
    # A gentle two-note notification, kept intentionally shorter and softer than music.
    add_tone(mono, event, 659.25, 0.20, 0.18)
    add_tone(mono, event + 0.075, 987.77, 0.24, 0.12)

peak = max(max(abs(value) for value in mono), 0.001)
gain = 0.42 / peak
pcm = array("h")
for sample in mono:
    value = int(max(-1.0, min(1.0, sample * gain)) * 32767)
    pcm.append(value)
    pcm.append(value)

with wave.open("message-chimes.wav", "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SAMPLE_RATE)
    output.writeframes(pcm.tobytes())
