import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('Building Vue app...');
    
    // Remove old dist
    try {
      await execAsync('rmdir /s /q dist');
    } catch (e) {
      // Ignore if dist doesn't exist
    }
    
    // Create dist directory
    await execAsync('mkdir dist');
    
    // Copy index.html with modifications
    const fs = await import('fs');
    const path = await import('path');
    
    let html = fs.readFileSync('src/index.html', 'utf8');
    html = html.replace('<script type="module" src="/main.js"></script>', '<script type="module" src="./main.js"></script>');
    
    fs.writeFileSync('dist/index.html', html);
    
    // Build with esbuild (simpler than vite)
    await execAsync('npx esbuild src/main.js --bundle --outfile=dist/main.js --format=esm --loader:.vue=text');
    
    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error.message);
  }
}

build();
