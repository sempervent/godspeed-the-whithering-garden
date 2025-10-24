import fs from 'fs'
import path from 'path'
import { LoopAnalyzer } from '../src/audio/loopAnalyzer'

interface LoopMetadataMap {
  [filename: string]: {
    loopStart: number
    loopEnd: number
    crossfadeMs: number
    isLoopable: boolean
    confidence: number
    duration: number
  }
}

async function generateLoopMetadata(): Promise<void> {
  const assetsDir = path.resolve('src/audio/cues/assets')
  const outputPath = path.resolve('dist/loop_meta.json')
  
  console.log('🔍 Analyzing audio assets for loop metadata...')
  
  // Ensure dist directory exists
  const distDir = path.dirname(outputPath)
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  
  const results: LoopMetadataMap = {}
  
  try {
    // Check if assets directory exists
    if (!fs.existsSync(assetsDir)) {
      console.log('⚠️  Assets directory not found, creating placeholder metadata...')
      const placeholderMetadata = {
        'drone_low.ogg': {
          loopStart: 0,
          loopEnd: 441000, // 10 seconds at 44.1kHz
          crossfadeMs: 400,
          isLoopable: true,
          confidence: 0.8,
          duration: 10.0
        },
        'drone_mid.ogg': {
          loopStart: 0,
          loopEnd: 441000,
          crossfadeMs: 400,
          isLoopable: true,
          confidence: 0.8,
          duration: 10.0
        },
        'hiss_static.ogg': {
          loopStart: 0,
          loopEnd: 441000,
          crossfadeMs: 300,
          isLoopable: true,
          confidence: 0.9,
          duration: 10.0
        },
        'pulse_heart.ogg': {
          loopStart: 0,
          loopEnd: 44100, // 1 second
          crossfadeMs: 0,
          isLoopable: false,
          confidence: 1.0,
          duration: 1.0
        },
        'chime_glass.ogg': {
          loopStart: 0,
          loopEnd: 22050, // 0.5 seconds
          crossfadeMs: 0,
          isLoopable: false,
          confidence: 1.0,
          duration: 0.5
        },
        'bell_far.ogg': {
          loopStart: 0,
          loopEnd: 88200, // 2 seconds
          crossfadeMs: 0,
          isLoopable: false,
          confidence: 1.0,
          duration: 2.0
        }
      }
      
      fs.writeFileSync(outputPath, JSON.stringify(placeholderMetadata, null, 2))
      console.log('✅ Placeholder loop_meta.json generated')
      return
    }
    
    // Get all audio files
    const files = fs.readdirSync(assetsDir)
    const audioFiles = files.filter(file => /\.(wav|ogg)$/i.test(file))
    
    if (audioFiles.length === 0) {
      console.log('⚠️  No audio files found in assets directory')
      return
    }
    
    console.log(`📁 Found ${audioFiles.length} audio files to analyze`)
    
    // Analyze each file
    for (const file of audioFiles) {
      const filePath = path.join(assetsDir, file)
      console.log(`🎵 Analyzing ${file}...`)
      
      try {
        const metadata = await LoopAnalyzer.analyzeLoop(filePath)
        results[file] = {
          loopStart: metadata.loopStart,
          loopEnd: metadata.loopEnd,
          crossfadeMs: metadata.crossfadeMs,
          isLoopable: metadata.isLoopable,
          confidence: metadata.confidence,
          duration: metadata.duration
        }
        
        console.log(`  ✅ ${file}: ${metadata.isLoopable ? 'loopable' : 'one-shot'} (confidence: ${metadata.confidence.toFixed(2)})`)
      } catch (error) {
        console.warn(`  ⚠️  Failed to analyze ${file}:`, error)
        
        // Add fallback metadata
        results[file] = {
          loopStart: 0,
          loopEnd: 44100,
          crossfadeMs: 400,
          isLoopable: true,
          confidence: 0.3,
          duration: 1.0
        }
      }
    }
    
    // Write results
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`✅ Loop metadata generated: ${outputPath}`)
    
    // Print summary
    const loopableCount = Object.values(results).filter(r => r.isLoopable).length
    const oneShotCount = Object.values(results).filter(r => !r.isLoopable).length
    
    console.log(`📊 Summary:`)
    console.log(`  🔄 Loopable: ${loopableCount}`)
    console.log(`  🎯 One-shot: ${oneShotCount}`)
    
  } catch (error) {
    console.error('❌ Failed to generate loop metadata:', error)
    process.exit(1)
  }
}

// CLI tool for analyzing individual files
async function analyzeSingleFile(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }
  
  console.log(`🔍 Analyzing ${filePath}...`)
  
  try {
    const metadata = await LoopAnalyzer.analyzeLoop(filePath)
    
    console.log('\n📊 Analysis Results:')
    console.log(`  Loop Start: ${metadata.loopStart} samples`)
    console.log(`  Loop End: ${metadata.loopEnd} samples`)
    console.log(`  Crossfade: ${metadata.crossfadeMs}ms`)
    console.log(`  Loopable: ${metadata.isLoopable}`)
    console.log(`  Confidence: ${metadata.confidence.toFixed(3)}`)
    console.log(`  Duration: ${metadata.duration.toFixed(2)}s`)
    
    // Output as JSON
    console.log('\n📄 JSON Output:')
    console.log(JSON.stringify(metadata, null, 2))
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length > 0 && args[0] !== '--all') {
    // Analyze single file
    await analyzeSingleFile(args[0])
  } else {
    // Generate all loop metadata
    await generateLoopMetadata()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { generateLoopMetadata, analyzeSingleFile }
