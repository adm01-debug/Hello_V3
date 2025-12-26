const critical = require('critical');
const fs = require('fs');
const path = require('path');

async function extractCriticalCSS() {
  const pages = [
    { url: 'http://localhost:3000/', output: 'critical-home.css' },
    { url: 'http://localhost:3000/dashboard', output: 'critical-dashboard.css' },
    { url: 'http://localhost:3000/login', output: 'critical-login.css' },
  ];

  for (const page of pages) {
    try {
      const { css } = await critical.generate({
        base: 'dist/',
        src: page.url,
        target: {
          css: page.output,
        },
        width: 1300,
        height: 900,
        inline: false,
        extract: true,
        dimensions: [
          {
            height: 900,
            width: 1300,
          },
          {
            height: 640,
            width: 360,
          },
        ],
      });

      // Save critical CSS
      const outputPath = path.join(__dirname, '../../public/css', page.output);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, css);

      console.log(`✅ Generated ${page.output}`);
    } catch (error) {
      console.error(`❌ Failed to generate critical CSS for ${page.url}:`, error);
    }
  }
}

extractCriticalCSS().catch(console.error);
