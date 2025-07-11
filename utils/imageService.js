const path = require("path");
const fs = require("fs");
const download = require("image-downloader");

function saveImage(dir, photo) {
  const data = photo.split(",")[1] || photo;
  const file = `${Date.now()}.jpg`;
  return new Promise((resolve, reject) => {
    const filePath = path.join("public/img", dir, file);
    fs.writeFile(filePath, data, { encoding: "base64" }, (err) => {
      if (err) {
        reject(err);
      }
      resolve(`https://hectorrp.com/api/img/${dir}/${file}`);
    });
  });
}
async function downloadImage(dir, url) {
  const file = `${Date.now()}.jpg`;
  const filePath = path.join(path.resolve("./public"), "img", dir, file);
  await download.image({
    url,
    dest: filePath,
  });
  return `https://hectorrp.com/api/img/${dir}/${file}`;
}
function removeImage(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports = { saveImage, downloadImage, removeImage };
