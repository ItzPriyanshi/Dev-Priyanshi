import ytdl from '@distube/ytdl-core';
import fs from 'fs/promises';
import path from 'path';
import { Client } from 'undici';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class YTDL {
  constructor() {
    this.client = null;
  }

  async getCookies() {
    const cookiesPath = path.resolve(__dirname, '../public/cookies.json');
    try {
      const data = await fs.readFile(cookiesPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Failed to read cookies file: ' + error.message);
    }
  }

  async createClient() {
    try {
      const cookies = await this.getCookies();
      const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
      this.client = new Client('https://www.youtube.com', {
        headers: {
          Cookie: cookieHeader,
        },
      });
    } catch (error) {
      throw new Error('Failed to create client: ' + error.message);
    }
  }

  async getInfo(url) {
    try {
      if (!this.client) {
        await this.createClient();
      }
      
      const yt = await ytdl.getInfo(url, {
        requestOptions: { client: this.client }
      });
      
      const videoFormat = ytdl.chooseFormat(yt.formats, {
        quality: 'highest',
        filter: 'audioandvideo'
      });
      
      const audioFormat = ytdl.chooseFormat(yt.formats, {
        quality: 'highestaudio'
      });

      return {
        creator: 'Guru sensei',
        title: yt.videoDetails.title,
        author: yt.videoDetails.author.name,
        thumbnail: yt.videoDetails.thumbnails[0].url,
        duration: yt.videoDetails.lengthSeconds,
        video_url: videoFormat.url,
        audio_url: audioFormat.url,
        description: yt.videoDetails.description,
        views: yt.videoDetails.viewCount,
        upload_date: yt.videoDetails.uploadDate
      };
    } catch (error) {
      console.error('An error occurred while fetching info:', error);
      throw error;
    }
  }
}

export default YTDL;