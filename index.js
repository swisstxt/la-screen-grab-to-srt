const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  //await page.goto('https://swisstxt.ch'); // Replace with your target URL
  await page.goto('https://stage.liveaccess.online/p/f4hnpr?language=de')

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
    //'-f', 'alsa', '-i', 'default', // Adjust audio input as needed
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', '3000k',
    '-maxrate', '3000k',
    '-bufsize', '6000k',
    //'-c:a', 'aac',
    //'-b:a', '128k',
    '-f', 'mpegts',
    'udp://127.0.0.1:1234?pkt_size=1316'
    //'srt://listener_ip:port?pkt_size=1316' // Replace with your SRT listener details
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
    setTimeout(captureFrame, 33); // Capture at ~30fps
  };


  captureFrame();
})();
