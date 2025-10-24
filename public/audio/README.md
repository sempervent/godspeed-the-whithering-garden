# Audio Assets

This directory contains the audio files for the atmosphere system. In a real implementation, you would place the following audio files here:

## Required Audio Files

- `drone_low.ogg` - Low frequency ambient drone (0-45 entropy)
- `drone_mid.ogg` - Mid frequency ambient drone (35-80 entropy)  
- `hiss_static.ogg` - Static noise for high entropy (60-100)
- `pulse_heart.ogg` - Heartbeat sound for [loud] corruption tags
- `chime_glass.ogg` - Glass chime for [soft] corruption tags and seed flags
- `bell_far.ogg` - Distant bell for awaken flags

## Audio Specifications

- **Format**: OGG Vorbis (for web compatibility)
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Duration**: 
  - Loops: 10-30 seconds (seamless)
  - One-shots: 0.5-3 seconds
- **Volume**: Normalized to -12dB peak

## Placeholder Implementation

For development and testing, the audio engine will gracefully handle missing files by logging warnings and continuing without audio. The visual effects will still work normally.

## Creating Audio Assets

1. **Ambient Drones**: Use synthesizers or field recordings, apply low-pass filtering
2. **Static**: White/pink noise with filtering and modulation
3. **Percussive**: Short, punchy sounds with reverb tails
4. **Chimes**: Glass or metal percussion with harmonic content

## License

Ensure all audio assets are either:
- Original compositions
- Public domain
- Properly licensed for commercial use
