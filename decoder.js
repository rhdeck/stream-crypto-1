const fs = require("fs");
const crypto = require("crypto");
const { Readable, Writable } = require("stream");
function decryptStream(readStream, writeStream, key) {
  return new Promise((resolve, reject) => {
    const algorithm = "aes-256-ctr";
    let decipher;
    let iv;
    readStream.on("data", data => {
      if (!decipher) {
        iv = data.slice(0, 16);
        data = data.slice(16);
        decipher = crypto.createDecipheriv(algorithm, key, iv);
      }
      writeStream.write(decipher.update(data));
    });
    readStream.on("close", () => {
      writeStream.end(decipher.final(), function() {
        resolve();
      });
    });
    readStream.on("error", () => {
      reject();
    });
  });
}
async function decryptFile(path, dest, key) {
  const readStream = fs.createReadStream(path);
  const writeStream = fs.createWriteStream(dest);
  return await decryptStream(readStream, writeStream, key);
}
async function decryptText(buffer, key, encoding = "utf8") {
  const readStream = new Readable();
  const writeStream = new Writable();
  readStream._read = () => {
    readStream.destroy();
  };
  readStream.push(buffer);
  let buffers = [];
  writeStream._write = (chunk, encoding, done) => {
    buffers.push(chunk);
    done();
  };
  await decryptStream(readStream, writeStream, key);
  return Buffer.concat(buffers).toString(encoding);
}

module.exports = {
  decryptText,
  decryptFile
};
