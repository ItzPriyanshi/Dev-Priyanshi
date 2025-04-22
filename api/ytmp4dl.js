const axios = require("axios");

module.exports = {
  meta: {
    name: "YouTube Mp4 Downloader",
    version: "1.0.0",
    author: "rtm",
    method: "get",
    description: "Télécharger des vidéos YouTube en MP4 (choix qualité)",
    path: "/ytmp4dl?url=&format=",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const youtubeUrl = req.query.url;
    const format = req.query.format || "1080"; // Valeur par défaut

    if (!youtubeUrl) {
      return res.status(400).json({ error: "URL YouTube requise" });
    }

    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      Referer: "https://v4.mp3paw.link/",
    };

    try {
      const apiKey = "30de256ad09118bd6b60a13de631ae2cea6e5f9d";
      const downloadUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp4&url=${encodeURIComponent(youtubeUrl)}&q=${format}&api=${apiKey}`;

      const { data: downloadData } = await axios.get(downloadUrl, { headers });

      if (downloadData.success && downloadData.id) {
        const progressUrl = `https://p.oceansaver.in/ajax/progress.php?id=${downloadData.id}`;
        const { data: progressData } = await axios.get(progressUrl, { headers });

        if (progressData.progress === 1000 && progressData.url) {
          return res.json({
            operator: "AjiroDesu",
            success: 1,
            progress: 1000,
            download_url: progressData.url,
            text: "Finished",
            message: "If you want your application to use our API contact us: sp_golubev@protonmail.com or visit https://video-download-api.com/"
          });
        } else {
          return res.status(400).json({ error: "Conversion non terminée" });
        }
      } else {
        return res.status(400).json({ error: "Erreur de téléchargement" });
      }
    } catch (error) {
      console.error("Erreur dans le downloader :", error.message);
      return res.status(500).json({ error: "Erreur interne", message: error.message });
    }
  }
};