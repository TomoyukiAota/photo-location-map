const fs = require('fs');
const logger = require('../util/logger');

class PackageTestUtil {
  printItemsInDirectory(directory) {
    const fileNames = fs.readdirSync(directory);
    if (fileNames.length === 0) {
      logger.info(`Searched and no item is found in "${directory}".`);
      return;
    }

    logger.info('-----------------------------------------------');
    logger.info(`Following items are found in "${directory}":`);
    fileNames.forEach(file => {
      logger.info(`  ${file}`);
    });
    logger.info('-----------------------------------------------');
  }
}

module.exports = new PackageTestUtil();
