import numpy as np
import scipy.signal as signal
import scipy.io.wavfile as wavfile
import os

SAMPLE_RATE = 48000

def ensure_stereo(audio):
    if audio.ndim == 1:
        return np.column_stack([audio, audio])
    return audio

def save_wav(filepath, audio):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    audio = ensure_stereo(audio)
    # Normalize to -1.0 .. 1.0 peak
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.95
    # Convert to 16-bit PCM
    pcm = (audio * 32767).astype(np.int16)
    wavfile.write(filepath, SAMPLE_RATE, pcm)
    print(f"Generated {filepath}: duration={len(audio)/SAMPLE_RATE:.2f}s, channels={audio.shape[1]}")

def generate_celestial_chime():
    # Warm bell chime with shimmering celestial harmonics
    duration = 3.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Frequencies: C6 (1046.5), E6 (1318.5), G6 (1568), B6 (1975.5), C7 (2093)
    freqs = [1046.5, 1318.5, 1568.0, 1975.5, 2093.0, 3136.0]
    weights = [0.4, 0.3, 0.25, 0.15, 0.1, 0.05]
    decays = [2.2, 1.8, 1.5, 1.2, 1.0, 0.7]
    
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    
    for i, (f, w, d) in enumerate(zip(freqs, weights, decays)):
        # subtle detune for stereo shimmer
        detune = (i % 2) * 1.5 - 0.75
        pan = 0.5 + 0.3 * np.sin(i * 1.7)
        env = np.exp(-t * d) * (1 - np.exp(-t * 80)) # fast attack
        
        sig_l = w * env * np.sin(2 * np.pi * (f - detune) * t)
        sig_r = w * env * np.sin(2 * np.pi * (f + detune) * t)
        
        left += sig_l * (1 - pan) * 2
        right += sig_r * pan * 2
        
    return np.column_stack([left, right])

def generate_compass_click():
    # Tactile double-click of brass compass needle locking
    duration = 0.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    def single_click(start_time, freq, decay):
        sub_t = t - start_time
        mask = sub_t >= 0
        env = np.zeros_like(t)
        env[mask] = np.exp(-sub_t[mask] * decay)
        # Transient click + resonance
        click = np.sin(2 * np.pi * freq * sub_t) * env
        # add filtered noise transient
        noise = np.random.randn(len(t)) * env * 0.5
        return click + noise

    # Double click: primary contact at 0.02s, settle latch at 0.09s
    click1 = single_click(0.02, 2800, 150)
    click2 = single_click(0.09, 1400, 90) * 0.75
    
    combined = click1 + click2
    # Apply bandpass around 1200 - 4500 Hz
    sos = signal.butter(4, [1000, 5000], btype='bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, combined)
    
    # Slight stereo width
    left = filtered
    right = np.roll(filtered, 8)
    return np.column_stack([left, right])

def generate_ocean_waves():
    # Organic ocean surf swelling and receding
    duration = 6.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Pink noise base
    white = np.random.randn(len(t))
    # Filter white noise to pink noise
    b, a = signal.butter(1, 0.05)
    pink = signal.lfilter(b, a, white)
    
    # Modulate filter cutoff over time to simulate a wave breaking and washing back
    # Wave peaks at t = 2.4s
    swell_env = np.sin(np.pi * (t / duration)) ** 1.6
    
    # Apply lowpass filter
    sos = signal.butter(4, 800, btype='lowpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, pink * swell_env)
    
    # Stereo panning motion across wave
    pan = 0.5 + 0.25 * np.sin(2 * np.pi * 0.15 * t)
    left = filtered * (1 - pan) * 2
    right = filtered * pan * 2
    
    return np.column_stack([left, right])

def generate_sandglass_trickle():
    # Delicate trickle of sand grains in glass
    duration = 3.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # High frequency granulated noise
    noise = np.random.randn(len(t))
    sos = signal.butter(4, [2200, 6500], btype='bandpass', fs=SAMPLE_RATE, output='sos')
    sand = signal.sosfilt(sos, noise)
    
    # Rhythmic micro-variations
    mod = (0.7 + 0.3 * np.sin(2 * np.pi * 3.5 * t)) * (0.8 + 0.2 * np.sin(2 * np.pi * 8.0 * t))
    env = np.ones_like(t)
    env[:int(SAMPLE_RATE * 0.2)] = np.linspace(0, 1, int(SAMPLE_RATE * 0.2))
    env[-int(SAMPLE_RATE * 0.5):] = np.linspace(1, 0, int(SAMPLE_RATE * 0.5))
    
    sig = sand * mod * env
    left = sig
    right = np.roll(sig, 12)
    return np.column_stack([left, right])

def generate_whoosh_soft():
    # Subtle smooth transition whoosh
    duration = 0.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    noise = np.random.randn(len(t))
    # Bell envelope
    env = np.exp(-((t - 0.4) / 0.18) ** 2)
    
    # Frequency sweep lowpass
    sos = signal.butter(2, 600, btype='lowpass', fs=SAMPLE_RATE, output='sos')
    sig = signal.sosfilt(sos, noise * env)
    
    # Panning from left to right
    pan = np.linspace(0.2, 0.8, len(t))
    left = sig * (1 - pan) * 2
    right = sig * pan * 2
    return np.column_stack([left, right])

def generate_navigation_bgm(total_seconds=367.0):
    # Sophisticated, warm, melodic acoustic ambient music track
    # Chord progression: D - Bm - G - A (I - vi - IV - V), 8 bars per cycle (~16s per cycle)
    # Instruments:
    # 1. Warm acoustic piano arpeggios
    # 2. Resonant marimba / celesta pulses
    # 3. Soft warm synth pad chords with lowpass warmth
    # 4. Subtle sub-bass pulse
    
    num_samples = int(SAMPLE_RATE * total_seconds)
    t = np.linspace(0, total_seconds, num_samples, endpoint=False)
    
    left = np.zeros(num_samples)
    right = np.zeros(num_samples)
    
    bpm = 100.0
    beat_sec = 60.0 / bpm
    bar_sec = beat_sec * 4.0 # 2.4 seconds per bar
    
    # Chord cycle: 4 chords, 2 bars each = 8 bars = 19.2 seconds per cycle
    # D:   D3 (146.8), F#3 (185.0), A3 (220.0), D4 (293.7), F#4 (369.99), A4 (440.0)
    # Bm:  B2 (123.5), D3 (146.8),  F#3 (185.0), B3 (246.9), D4 (293.7),  F#4 (370.0)
    # G:   G2 (98.0),  B2 (123.5),  D3 (146.8),  G3 (196.0), B3 (246.9),  D4 (293.7)
    # A:   A2 (110.0), C#3 (138.6), E3 (164.8),  A3 (220.0), C#4 (277.2), E4 (329.6)
    
    chords = [
        # D
        {'root': 146.83, 'notes': [146.83, 220.0, 293.66, 369.99, 440.0, 587.33]},
        # Bm
        {'root': 123.47, 'notes': [123.47, 185.0, 246.94, 293.66, 370.0, 493.88]},
        # G
        {'root': 97.99,  'notes': [97.99, 146.83, 196.0, 246.94, 293.66, 392.0]},
        # A
        {'root': 110.0,  'notes': [110.0, 164.81, 220.0, 277.18, 329.63, 440.0]}
    ]
    
    chord_duration = bar_sec * 2 # 4.8s per chord
    cycle_duration = chord_duration * len(chords) # 19.2s per progression cycle
    
    print(f"Generating BGM ({total_seconds:.1f}s, ~{total_seconds/cycle_duration:.1f} progression cycles)...")
    
    # Generate notes along the timeline
    current_time = 0.0
    while current_time < total_seconds:
        cycle_pos = current_time % cycle_duration
        chord_idx = int(cycle_pos // chord_duration) % len(chords)
        chord = chords[chord_idx]
        
        # 1. Pad / sustained warmth (soft sine + 2nd harmonic, lowpassed)
        pad_t_end = min(total_seconds, current_time + chord_duration)
        pad_len = int((pad_t_end - current_time) * SAMPLE_RATE)
        if pad_len > 0:
            pt = np.linspace(0, pad_t_end - current_time, pad_len, endpoint=False)
            # Gentle envelope
            penv = np.sin(np.pi * (pt / (pad_t_end - current_time))) ** 1.2
            
            # Pad chord
            pad_sig = np.zeros(pad_len)
            for n in chord['notes'][:4]:
                pad_sig += 0.08 * np.sin(2 * np.pi * n * pt)
                pad_sig += 0.03 * np.sin(2 * np.pi * n * 2.0 * pt)
            
            # Root bass
            pad_sig += 0.12 * np.sin(2 * np.pi * (chord['root'] * 0.5) * pt)
            
            s_start = int(current_time * SAMPLE_RATE)
            s_end = s_start + pad_len
            left[s_start:s_end] += pad_sig * penv * 0.9
            right[s_start:s_end] += pad_sig * penv * 1.1
            
        # 2. Arpeggio notes (piano / marimba pluck on eighth notes)
        eighth_note = beat_sec / 2.0 # 0.3s
        sub_time = 0.0
        arp_pattern = [0, 2, 4, 3, 1, 3, 5, 2] # pattern indexing chord['notes']
        p_idx = 0
        
        while sub_time < chord_duration and (current_time + sub_time) < total_seconds:
            note_time = current_time + sub_time
            note_freq = chord['notes'][arp_pattern[p_idx % len(arp_pattern)]]
            
            note_dur = 1.2
            n_samples = min(int(note_dur * SAMPLE_RATE), num_samples - int(note_time * SAMPLE_RATE))
            if n_samples > 0:
                nt = np.linspace(0, note_dur, n_samples, endpoint=False)
                # Piano/marimba envelope: instant attack, exponential decay
                nenv = np.exp(-nt * 3.8) * 0.18
                
                # Harmonics of acoustic instrument
                pluck = (
                    np.sin(2 * np.pi * note_freq * nt) +
                    0.4 * np.sin(2 * np.pi * note_freq * 2.0 * nt) * np.exp(-nt * 5.0) +
                    0.2 * np.sin(2 * np.pi * note_freq * 3.0 * nt) * np.exp(-nt * 7.0)
                )
                
                pan = 0.5 + 0.3 * np.sin(p_idx * 1.3)
                ns_start = int(note_time * SAMPLE_RATE)
                ns_end = ns_start + n_samples
                
                left[ns_start:ns_end] += pluck * nenv * (1 - pan) * 2.0
                right[ns_start:ns_end] += pluck * nenv * pan * 2.0
                
            p_idx += 1
            sub_time += eighth_note
            
        current_time += chord_duration
        
    # Global EQ and mastering:
    # 1. High-pass at 40 Hz (remove sub-rumble)
    sos_hp = signal.butter(2, 40, btype='highpass', fs=SAMPLE_RATE, output='sos')
    left = signal.sosfilt(sos_hp, left)
    right = signal.sosfilt(sos_hp, right)
    
    # 2. Voice-presence notch (attenuate 1200 - 3200 Hz by ~4 dB to ensure voice intelligibility)
    # We can do this with a gentle bandstop filter
    sos_notch = signal.butter(1, [1200, 3200], btype='bandstop', fs=SAMPLE_RATE, output='sos')
    left = 0.7 * signal.sosfilt(sos_notch, left) + 0.3 * left
    right = 0.7 * signal.sosfilt(sos_notch, right) + 0.3 * right
    
    # 3. Master fade-in (0 - 3s) and fade-out (last 6s)
    fade_in_len = int(3.0 * SAMPLE_RATE)
    fade_out_len = int(6.0 * SAMPLE_RATE)
    
    left[:fade_in_len] *= np.linspace(0, 1, fade_in_len)
    right[:fade_in_len] *= np.linspace(0, 1, fade_in_len)
    
    left[-fade_out_len:] *= np.linspace(1, 0, fade_out_len)
    right[-fade_out_len:] *= np.linspace(1, 0, fade_out_len)
    
    return np.column_stack([left, right])

def master_bgm(left, right, fade_in_sec=1.5, fade_out_sec=2.5):
    sos_hp = signal.butter(2, 45, btype='highpass', fs=SAMPLE_RATE, output='sos')
    left = signal.sosfilt(sos_hp, left)
    right = signal.sosfilt(sos_hp, right)
    sos_notch = signal.butter(1, [1200, 3200], btype='bandstop', fs=SAMPLE_RATE, output='sos')
    left = 0.72 * signal.sosfilt(sos_notch, left) + 0.28 * left
    right = 0.72 * signal.sosfilt(sos_notch, right) + 0.28 * right
    fi = min(len(left), int(fade_in_sec * SAMPLE_RATE))
    fo = min(len(left), int(fade_out_sec * SAMPLE_RATE))
    left[:fi] *= np.linspace(0, 1, fi)
    right[:fi] *= np.linspace(0, 1, fi)
    left[-fo:] *= np.linspace(1, 0, fo)
    right[-fo:] *= np.linspace(1, 0, fo)
    return np.column_stack([left, right])

def generate_pop_highlight():
    duration = 0.22
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = 320.0 * np.exp(t * 9.0)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t * 28.0) * (1 - np.exp(-t * 240.0))
    sig = np.sin(phase) * env + 0.25 * np.sin(2 * phase) * np.exp(-t * 40.0)
    return np.column_stack([sig, np.roll(sig, 4)])

def generate_whoosh_fast():
    duration = 0.45
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.randn(len(t))
    env = np.sin(np.pi * (t / duration)) ** 1.6
    sos = signal.butter(2, [350, 2600], btype='bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, noise) * env
    return np.column_stack([filtered, np.roll(filtered, 12)])

def generate_boom_impact():
    duration = 1.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = 110.0 * np.exp(-t * 4.5) + 36.0
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sub_env = np.exp(-t * 3.8) * (1 - np.exp(-t * 120.0))
    punch_noise = signal.sosfilt(signal.butter(2, [120, 900], btype='bandpass', fs=SAMPLE_RATE, output='sos'), np.random.randn(len(t))) * np.exp(-t * 14.0)
    sig = np.sin(phase) * sub_env * 0.9 + punch_noise * 0.45
    return np.column_stack([sig, np.roll(sig, 6)])

def generate_bell_reveal():
    duration = 1.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freqs = [880.0, 1318.5, 1760.0]
    weights = [0.55, 0.30, 0.15]
    sig = sum(w * np.sin(2 * np.pi * f * t) * np.exp(-t * (2.6 + i * 0.9)) for i, (f, w) in enumerate(zip(freqs, weights)))
    sig *= (1 - np.exp(-t * 160.0))
    return np.column_stack([sig, np.roll(sig, 8)])

def generate_tick_tension():
    duration = 0.16
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    env = np.exp(-t * 75.0) * (1 - np.exp(-t * 400.0))
    sig = (np.sin(2 * np.pi * 1650.0 * t) * 0.7 + np.random.randn(len(t)) * 0.25) * env
    sos = signal.butter(2, [900, 4200], btype='bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, sig)
    return np.column_stack([filtered, np.roll(filtered, 3)])

def generate_history_mystery_bgm(duration=95.0):
    np.random.seed(42)
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    # Warm D-minor / Dorian progression: Dm - Bb - Gm - A
    chords = [
        [146.83, 220.00, 261.63, 349.23],
        [116.54, 174.61, 233.08, 293.66],
        [98.00, 146.83, 196.00, 233.08],
        [110.00, 164.81, 220.00, 277.18],
    ]
    beat = 0.55
    step = 0
    cur = 0.0
    while cur < duration - 1.0:
        chord = chords[(step // 8) % len(chords)]
        # Soft warm pad root every bar
        if step % 8 == 0:
            bar_dur = min(4.2, duration - cur)
            n = int(bar_dur * SAMPLE_RATE)
            bt = np.linspace(0, bar_dur, n, endpoint=False)
            pad_env = np.sin(np.pi * bt / bar_dur) ** 0.8 * 0.09
            pad = np.sin(2 * np.pi * chord[0] * bt) * pad_env
            s0 = int(cur * SAMPLE_RATE)
            left[s0:s0 + n] += pad
            right[s0:s0 + n] += pad
        # Gentle pizzicato pulse on each beat
        note_f = chord[step % len(chord)]
        nd = min(0.5, duration - cur)
        ns = int(nd * SAMPLE_RATE)
        nt = np.linspace(0, nd, ns, endpoint=False)
        env = np.exp(-nt * 6.5) * (1 - np.exp(-nt * 90.0)) * 0.14
        pluck = np.sin(2 * np.pi * note_f * nt) + 0.3 * np.sin(4 * np.pi * note_f * nt) * np.exp(-nt * 9.0)
        pan = 0.5 + 0.25 * np.sin(step * 0.9)
        s0 = int(cur * SAMPLE_RATE)
        left[s0:s0 + ns] += pluck * env * (1 - pan) * 1.8
        right[s0:s0 + ns] += pluck * env * pan * 1.8
        step += 1
        cur += beat
    return master_bgm(left, right, 1.5, 2.5)

def generate_short_energetic_bgm(duration=95.0):
    np.random.seed(99)
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    # Crisp rhythmic pulse in C minor: Cm - Ab - Eb - Bb
    bass_notes = [65.41, 103.83, 77.78, 116.54]
    arp_notes = [
        [261.63, 311.13, 392.00, 523.25],
        [207.65, 261.63, 311.13, 415.30],
        [155.56, 233.08, 311.13, 392.00],
        [233.08, 293.66, 349.23, 466.16],
    ]
    sixteenth = 0.22
    step = 0
    cur = 0.0
    while cur < duration - 0.5:
        bar = (step // 8) % 4
        if step % 2 == 0:
            bf = bass_notes[bar]
            bd = min(0.32, duration - cur)
            bn = int(bd * SAMPLE_RATE)
            bt = np.linspace(0, bd, bn, endpoint=False)
            benv = np.exp(-bt * 8.0) * (1 - np.exp(-bt * 120.0)) * 0.16
            bsig = np.sin(2 * np.pi * bf * bt) * benv
            s0 = int(cur * SAMPLE_RATE)
            left[s0:s0 + bn] += bsig
            right[s0:s0 + bn] += bsig
        af = arp_notes[bar][step % 4]
        ad = min(0.2, duration - cur)
        an = int(ad * SAMPLE_RATE)
        at = np.linspace(0, ad, an, endpoint=False)
        aenv = np.exp(-at * 11.0) * (1 - np.exp(-at * 140.0)) * 0.11
        asig = np.sin(2 * np.pi * af * at) * aenv
        pan = 0.5 + 0.28 * np.cos(step * 1.1)
        s0 = int(cur * SAMPLE_RATE)
        left[s0:s0 + an] += asig * (1 - pan) * 1.8
        right[s0:s0 + an] += asig * pan * 1.8
        step += 1
        cur += sixteenth
    return master_bgm(left, right, 0.8, 2.0)

if __name__ == '__main__':
    print("Generating Sound Effects...")
    save_wav("channel/audio/sfx/celestial-chime.wav", generate_celestial_chime())
    save_wav("channel/audio/sfx/compass-click.wav", generate_compass_click())
    save_wav("channel/audio/sfx/ocean-waves.wav", generate_ocean_waves())
    save_wav("channel/audio/sfx/sandglass-trickle.wav", generate_sandglass_trickle())
    save_wav("channel/audio/sfx/whoosh-soft.wav", generate_whoosh_soft())
    save_wav("channel/audio/sfx/pop-highlight.wav", generate_pop_highlight())
    save_wav("channel/audio/sfx/whoosh-fast.wav", generate_whoosh_fast())
    save_wav("channel/audio/sfx/boom-impact.wav", generate_boom_impact())
    save_wav("channel/audio/sfx/bell-reveal.wav", generate_bell_reveal())
    save_wav("channel/audio/sfx/tick-tension.wav", generate_tick_tension())

    print("\nGenerating Background Music Tracks...")
    save_wav("channel/audio/music/navigation-acoustic-bgm.wav", generate_navigation_bgm(367.0))
    save_wav("channel/audio/music/history-mystery-bgm.wav", generate_history_mystery_bgm(95.0))
    save_wav("channel/audio/music/short-energetic-bgm.wav", generate_short_energetic_bgm(95.0))
    print("All audio assets successfully synthesized!")
