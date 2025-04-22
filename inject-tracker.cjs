const fs = require('fs');
const path = require('path');

const insertHTML = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Moirai+One&family=Montserrat+Underline:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
`;

function addLinksToHTML(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(insertHTML.trim())) {
    console.log(`✔️ Already added in: ${filePath}`);
    return;
  }

  const updated = content.replace(/<head[^>]*>/i, match => `${match}\n${insertHTML}`);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ Updated: ${filePath}`);
}

function walkDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (path.extname(fullPath).toLowerCase() === '.html') {
      addLinksToHTML(fullPath);
    }
  });
}

// Run
walkDirectory(process.cwd());