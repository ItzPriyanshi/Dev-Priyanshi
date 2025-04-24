const got = require('got');

const meta = {
  name: "YTDL",
  version: "1.0.0",
  description: "YouTube downloader from ssyoutube (MP3, MP4, etc.)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

function toFormat(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function time2Number(timeStr) {
  const parts = timeStr.split(':').map(Number).reverse();
  return parts.reduce((acc, val, idx) => acc + val * Math.pow(60, idx), 0);
}

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  const form = {
    url,
    ajax: 1
  };

  try {
    const data = await got.post('https://api.ssyoutube.com/api/convert', {
      headers: {
        'origin': 'https://ssyoutube.com',
        'content-type': 'application/json'
      },
      json: form
    }).json();

    const video = {}, audio = {}, other = {};

    for (const item of data.url) {
      const type = item.ext;
      const quality = item.quality;
      const fileSize = item.filesize || item.contentLength || 0;
      const fileSizeH = toFormat(fileSize);

      const formatObj = {
        quality,
        type,
        fileSize,
        fileSizeH,
        download: item.url
      };

      if (type === 'mp4') {
        video[quality.toLowerCase()] = formatObj;
      } else if (['mp3', 'opus'].includes(type)) {
        audio[quality.toLowerCase()] = formatObj;
      } else {
        other[quality.toLowerCase()] = formatObj;
      }
    }

    const duration = time2Number(data.meta.duration);

    return res.json({
      status: true,
      result: {
        id: data.id,
        title: data.meta.title,
        thumbnail: `https://i.ytimg.com/vi/${data.id}/0.jpg`,
        duration,
        video,
        audio,
        other
      },
      query: url,
      powered_by: "ssyoutube",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("ytdl API error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

module.exports = { meta, onStart };