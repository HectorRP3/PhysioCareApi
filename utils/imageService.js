export function saveImage(dir, photo) {
  const data = photo.split(",")[1] || photo;
  const file = `${Date.now()}.jpg`;
  return new Promise((resolve, reject) => {
    const filePath = path.join("img", dir, file);
    fs.writeFile(filePath, data, { encoding: "base64" }, (err) => {
      if (err) {
        reject(err);
      }
      resolve(`img/${dir}/${file}`);
    });
  });
}
export async function downloadImage(dir, url) {
  const file = `${Date.now()}.jpg`;
  const filePath = path.join(path.resolve("./"), "img", dir, file);
  await download.image({
    url,
    dest: filePath,
  });
  return `img/${dir}/${file}`;
}

export function removeImage(path) {
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
