const path = require('path');
const { rcedit } = require('rcedit');

exports.default = async function(context) {
  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.resolve('assets/icon.ico');
  
  console.log(`Setting icon: ${iconPath} -> ${exePath}`);
  await rcedit(exePath, { icon: iconPath });
  console.log('Icon set successfully');
};
