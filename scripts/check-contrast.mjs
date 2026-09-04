// Simplified WCAG contrast check script
import fs from 'node:fs/promises';
import path from 'node:path';

function getLuminance(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  
  [r, g, b] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (lightest + 0.05) / (darkest + 0.05);
}

async function checkContrast() {
  const base = path.join(process.cwd(), 'restaurants');
  const dirs = await fs.readdir(base, { withFileTypes: true });
  
  for (const dir of dirs) {
    if (!dir.isDirectory() || dir.name === '_template') continue;
    
    const configPath = path.join(base, dir.name, 'config.json');
    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const theme = config.theme;
      
      if (theme && theme.primaryColor && theme.secondaryColor) {
        const ratio = getContrast(theme.primaryColor, theme.secondaryColor);
        if (ratio < 4.5) {
          console.warn(\`⚠️ [WARNING] \${dir.name}: Contrast between primary (\${theme.primaryColor}) and secondary (\${theme.secondaryColor}) is \${ratio.toFixed(2)} (WCAG requires >= 4.5)\`);
        } else {
          console.log(\`✅ \${dir.name}: Contrast OK (\${ratio.toFixed(2)})\`);
        }
      }
    } catch (err) {
      // Ignore if parsing fails
    }
  }
}

checkContrast();
