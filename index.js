const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-extensions']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  //await page.goto('https://swisstxt.ch'); // Replace with your target URL
  await page.goto(process.env.SITE_TO_STREAM)

  // Define the selector of the element you want to capture
  const elementSelector = '.mantine-Paper-root'; // Replace with your target element's selector

  // Wait for the element to appear
  await page.waitForSelector(elementSelector);

  // Get the bounding box of the element
  const elementHandle = await page.$(elementSelector);
  console.log('elementHandle', elementHandle);
  const boundingBox = await elementHandle.boundingBox();
  console.log('boundingBox', boundingBox);

  const adjustedBoundingBox = {
    x: Math.floor(boundingBox.x),
    y: Math.floor(boundingBox.y),
    width: Math.floor(boundingBox.width) % 2 === 0 ? Math.floor(boundingBox.width) : Math.floor(boundingBox.width) - 1,
    height: Math.floor(boundingBox.height) % 2 === 0 ? Math.floor(boundingBox.height) : Math.floor(boundingBox.height) - 1
  };

  // Start capturing the screen
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'image2pipe',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', '3000k',
    '-maxrate', '3000k',
    '-bufsize', '6000k',
    '-f', 'mpegts',
    process.env.STREAM_DEST
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    browser.close();
  });

  const captureFrame = async () => {
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      clip: {
        x: adjustedBoundingBox.x,
        y: adjustedBoundingBox.y,
        width: adjustedBoundingBox.width,
        height: adjustedBoundingBox.height
      }
    });
    ffmpeg.stdin.write(screenshot);
  };

  const interval = setInterval(captureFrame, 500)
  console.log(`started interval '${interval}' of captureFrame`)
})();
