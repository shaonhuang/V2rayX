// import jsQR from 'jsqr';
// import fs from 'fs';
// import { app, BrowserWindow, desktopCapturer, ipcMain, nativeImage } from 'electron';
//
// function writeImageToFile(pngData, filePath) {
//   fs.writeFile(filePath, pngData, (err) => {
//     if (err) {
//       console.error('Error writing image to file:', err);
//     } else {
//       console.log(`Image successfully written to ${filePath}`);
//     }
//   });
// }
// function captureScreenshot() {
//   desktopCapturer
//     .getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } })
//     .then((sources) => {
//       if (sources.length > 0) {
//         const source = sources[0];
//         console.log('source', source);
//         const size = source.thumbnail.getSize();
//         source.thumbnail.toBitmap();
//         const data = source.thumbnail.toPNG();
//         console.log('data', data);
//         const code = jsQR(source.thumbnail.getBitmap() as any, size.width, size.height);
//         const outputPath = '/tmp/qr-code.png';
//         const pngData = source.thumbnail.toPNG();
//         writeImageToFile(pngData, outputPath);
//         console.log(size.width, size.height);
//         if (code) {
//           console.log('Found QR code', code);
//         }
//       }
//     })
//     .catch((error) => {
//       console.error('Error capturing screenshot:', error);
//     });
//   // const screenSize = robot.getScreenSize();
//   // const screenCapture = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
//   // // const code = jsQR(screenCapture.image, screenSize.width, screenSize.height);
//   // // console.log('code', code, source.thumbnail.toDataURL());
//   // // console.log('code', code);
//   const outputPath = '/tmp/qr-code.png';
//   // const pngData = screenCapture.image;
//
//   // writeImageToFile(pngData, outputPath);
//   // if (code) {
//   //   console.log('Found QR code', code);
//   // }
// }
//
// export const getQrCodeFromScreenResources = async () => {
//   try {
//     const screenshot = await captureScreenshot();
//     console.log('screenshot', screenshot);
//   } catch (error) {
//     console.error('Error capturing screenshot:', error);
//   }
// };
