import fs from 'fs'
import path from 'path'

export interface LoopMetadata {
  loopStart: number
  loopEnd: number
  crossfadeMs: number
  isLoopable: boolean
  confidence: number
  duration: number
}

export interface AudioBuffer {
  sampleRate: number
  length: number
  numberOfChannels: number
  getChannelData(channel: number): Float32Array
}

// Mock Web Audio API for Node.js environment
class NodeAudioBuffer implements AudioBuffer {
  sampleRate: number
  length: number
  numberOfChannels: number
  private channelData: Float32Array[]

  constructor(sampleRate: number, length: number, numberOfChannels: number) {
    this.sampleRate = sampleRate
    this.length = length
    this.numberOfChannels = numberOfChannels
    this.channelData = new Array(numberOfChannels).fill(null).map(() => new Float32Array(length))
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel]
  }

  setChannelData(channel: number, data: Float32Array) {
    this.channelData[channel] = data
  }
}

// Simple WAV parser for Node.js
function parseWavFile(filePath: string): Promise<NodeAudioBuffer> {
  return new Promise((resolve, reject) => {
    const buffer = fs.readFileSync(filePath)
    
    // Basic WAV header parsing
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') {
      reject(new Error('Not a valid WAV file'))
      return
    }

    const sampleRate = buffer.readUInt32LE(24)
    const channels = buffer.readUInt16LE(22)
    const bitsPerSample = buffer.readUInt16LE(34)
    const dataSize = buffer.readUInt32LE(40)
    const samples = dataSize / (channels * bitsPerSample / 8)
    
    const audioBuffer = new NodeAudioBuffer(sampleRate, samples, channels)
    
    // Convert PCM data to float32
    const bytesPerSample = bitsPerSample / 8
    const maxValue = Math.pow(2, bitsPerSample - 1)
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = new Float32Array(samples)
      for (let i = 0; i < samples; i++) {
        const offset = 44 + (i * channels + channel) * bytesPerSample
        let sample: number
        
        if (bitsPerSample === 16) {
          sample = buffer.readInt16LE(offset) / maxValue
        } else if (bitsPerSample === 32) {
          sample = buffer.readInt32LE(offset) / maxValue
        } else {
          sample = 0
        }
        
        channelData[i] = sample
      }
      audioBuffer.setChannelData(channel, channelData)
    }
    
    resolve(audioBuffer)
  })
}

// Simple OGG parser (basic implementation)
function parseOggFile(filePath: string): Promise<NodeAudioBuffer> {
  // For now, return a mock buffer - in a real implementation,
  // you'd use a library like node-ogg or node-vorbis
  return Promise.resolve(new NodeAudioBuffer(44100, 44100, 1))
}

export class LoopAnalyzer {
  private static readonly ANALYSIS_SAMPLE_RATE = 11025
  private static readonly CORRELATION_THRESHOLD = 0.8
  private static readonly MIN_LOOP_LENGTH = 0.5 // seconds
  private static readonly MAX_LOOP_LENGTH = 10.0 // seconds
  private static readonly FADE_SAMPLES = 1000

  /**
   * Analyze an audio file to detect optimal loop points
   */
  static async analyzeLoop(filePath: string): Promise<LoopMetadata> {
    try {
      const ext = path.extname(filePath).toLowerCase()
      let audioBuffer: NodeAudioBuffer

      if (ext === '.wav') {
        audioBuffer = await parseWavFile(filePath)
      } else if (ext === '.ogg') {
        audioBuffer = await parseOggFile(filePath)
      } else {
        throw new Error(`Unsupported audio format: ${ext}`)
      }

      return this.detectLoopPoints(audioBuffer, path.basename(filePath))
    } catch (error) {
      console.warn(`Failed to analyze loop for ${filePath}:`, error)
      return this.getFallbackMetadata()
    }
  }

  /**
   * Detect loop points using cross-correlation analysis
   */
  private static detectLoopPoints(buffer: NodeAudioBuffer, filename: string): LoopMetadata {
    const sampleRate = buffer.sampleRate
    const duration = buffer.length / sampleRate
    
    // Check if this is a percussive/short sound that shouldn't loop
    if (this.isPercussiveSound(filename, duration)) {
      return {
        loopStart: 0,
        loopEnd: buffer.length - this.FADE_SAMPLES,
        crossfadeMs: 0,
        isLoopable: false,
        confidence: 1.0,
        duration
      }
    }

    // Downsample to analysis rate
    const downsampled = this.downsample(buffer, this.ANALYSIS_SAMPLE_RATE)
    
    // Get analysis segments (last 1.5s and first 1.5s)
    const segmentLength = Math.min(1.5 * this.ANALYSIS_SAMPLE_RATE, downsampled.length / 2)
    const endSegment = downsampled.slice(-segmentLength)
    const startSegment = downsampled.slice(0, segmentLength)
    
    // Find best correlation
    const correlation = this.crossCorrelate(endSegment, startSegment)
    const maxCorrelation = Math.max(...correlation)
    const bestOffset = correlation.indexOf(maxCorrelation)
    
    if (maxCorrelation < this.CORRELATION_THRESHOLD) {
      // Fallback to full-length loop
      return {
        loopStart: 0,
        loopEnd: buffer.length - this.FADE_SAMPLES,
        crossfadeMs: 500,
        isLoopable: true,
        confidence: 0.5,
        duration
      }
    }

    // Convert analysis offset back to original sample rate
    const scaleFactor = sampleRate / this.ANALYSIS_SAMPLE_RATE
    const loopStart = Math.floor(bestOffset * scaleFactor)
    const loopEnd = buffer.length - this.FADE_SAMPLES
    
    // Calculate crossfade duration based on correlation width
    const correlationWidth = this.getCorrelationWidth(correlation, bestOffset)
    const crossfadeMs = Math.min(600, Math.max(200, correlationWidth * scaleFactor / sampleRate * 1000))

    return {
      loopStart,
      loopEnd,
      crossfadeMs,
      isLoopable: true,
      confidence: maxCorrelation,
      duration
    }
  }

  /**
   * Check if a file is likely a percussive sound that shouldn't loop
   */
  private static isPercussiveSound(filename: string, duration: number): boolean {
    const percussivePatterns = ['chime', 'bell', 'pulse', 'click', 'hit', 'snap']
    const isPercussive = percussivePatterns.some(pattern => 
      filename.toLowerCase().includes(pattern)
    )
    
    return isPercussive || duration < 2.0
  }

  /**
   * Downsample audio to analysis sample rate
   */
  private static downsample(buffer: NodeAudioBuffer, targetRate: number): Float32Array {
    const sourceRate = buffer.sampleRate
    const ratio = sourceRate / targetRate
    const targetLength = Math.floor(buffer.length / ratio)
    const downsampled = new Float32Array(targetLength)
    
    // Simple linear interpolation downsampling
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i * ratio
      const index = Math.floor(sourceIndex)
      const fraction = sourceIndex - index
      
      if (index < buffer.length - 1) {
        const sample1 = buffer.getChannelData(0)[index]
        const sample2 = buffer.getChannelData(0)[index + 1]
        downsampled[i] = sample1 + fraction * (sample2 - sample1)
      } else {
        downsampled[i] = buffer.getChannelData(0)[Math.min(index, buffer.length - 1)]
      }
    }
    
    return downsampled
  }

  /**
   * Cross-correlate two audio segments
   */
  private static crossCorrelate(segment1: Float32Array, segment2: Float32Array): number[] {
    const minLength = Math.min(segment1.length, segment2.length)
    const correlation = new Array(minLength).fill(0)
    
    for (let offset = 0; offset < minLength; offset++) {
      let sum = 0
      let count = 0
      
      for (let i = 0; i < minLength - offset; i++) {
        sum += segment1[i] * segment2[i + offset]
        count++
      }
      
      correlation[offset] = count > 0 ? sum / count : 0
    }
    
    return correlation
  }

  /**
   * Get the width of the correlation peak
   */
  private static getCorrelationWidth(correlation: number[], peakIndex: number): number {
    const threshold = correlation[peakIndex] * 0.8
    let width = 0
    
    // Find width at 80% of peak
    for (let i = peakIndex; i < correlation.length; i++) {
      if (correlation[i] < threshold) {
        width = i - peakIndex
        break
      }
    }
    
    return Math.max(100, width) // Minimum 100 samples
  }

  /**
   * Get fallback metadata for files that can't be analyzed
   */
  private static getFallbackMetadata(): LoopMetadata {
    return {
      loopStart: 0,
      loopEnd: 44100 - this.FADE_SAMPLES, // 1 second at 44.1kHz
      crossfadeMs: 400,
      isLoopable: true,
      confidence: 0.3,
      duration: 1.0
    }
  }
}
