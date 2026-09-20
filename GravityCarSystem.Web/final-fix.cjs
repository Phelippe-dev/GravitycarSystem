const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('Ã')) {
    try {
      // Decode the double-encoded UTF-8
      let decoded = Buffer.from(content, 'latin1').toString('utf8');
      
      // Safety check: if decoding resulted in valid text, save it.
      // If the file wasn't double-encoded, toString('utf8') might just produce garbage 
      // but usually the target files are exactly what we want.
      // Let's replace only the matched words to be 100% safe.
      
      const wordsWithA = content.match(/[a-zA-Z]*Ã[a-zA-Z0-9_¡-ÿœšŸ]*[a-zA-Z0-9]*/g) || [];
      const uniqueWords = [...new Set(wordsWithA)];
      
      let changed = false;
      let newContent = content;
      
      for (let word of uniqueWords) {
          let fixedWord = Buffer.from(word, 'latin1').toString('utf8');
          // If the fixed word contains the replacement character (), it was invalid latin1
          if (!fixedWord.includes('')) {
              newContent = newContent.split(word).join(fixedWord);
              changed = true;
          }
      }
      
      // Also fix standalone characters
      newContent = newContent.split('Ã³').join('ó');
      newContent = newContent.split('Ãª').join('ê');
      newContent = newContent.split('Ã­').join('í');
      newContent = newContent.split('Ã¢').join('â');
      newContent = newContent.split('Ã¡').join('á');
      newContent = newContent.split('Ã§Ã£o').join('ção');
      newContent = newContent.split('Ã§Ãµes').join('ções');
      newContent = newContent.split('Ã£').join('ã');
      newContent = newContent.split('Ã§').join('ç');
      newContent = newContent.split('â€”').join('—');
      
      if (changed || newContent !== content) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log('Fixed Encoding:', filePath);
      }
    } catch(e) { }
  }
}

function walkDir(dir) {
  if (dir.includes('node_modules') || dir.includes('bin') || dir.includes('obj') || dir.includes('.git')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.cs') || fullPath.endsWith('.json')) {
      fixFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '..'));
console.log('Final encoding fix done.');
