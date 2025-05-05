// Import necessary modules
const { ytmp3 } = require('@vreden/youtube_scraper');
const youtubesearchapi = require("youtube-search-api"); // Import the search API
const { InputFile } = require('grammy');
const axios = require('axios');
const path = require('path');
// Assuming helpers are injected via ctx, otherwise require it:
// const { formatFileSize } = require('../../utils/helpers'); // Adjust path

const meta = {
    name: "music",
    version: "1.1.0", // Incremented version
    description: "Downloads audio from a YouTube video link or search query.",
    author: "Priyanshi Kaur",
    role: 0,
    category: "downloader",
    usage: "{prefix}music <youtube_url | search_query>",
    cooldown: 30,
    aliases: ["ytmp3", "ytaudio", "song", "ytsearchdl"] // Added search alias
};

// Keep the URL validator
function isValidYoutubeUrl(url) {
    if (typeof url !== 'string') return false;
    // More robust regex to match various YouTube URL formats
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    return youtubeRegex.test(url);
}

// --- Refactored Download and Send Logic ---
async function downloadAndSendAudio(ctx, bot, videoUrl, title, thumbnailUrl, processingMessage) {
    const quality = "128"; // Keep quality fixed or allow as arg later
    const logger = ctx.logger; // Use context logger
    const config = bot.config;
    const helpers = ctx.helpers; // Use context helpers

    try {
        await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id,
            `✅ Found: *${title}*\n⏳ Preparing audio download (Quality: ${quality}kbps)...`,
            { parse_mode: 'Markdown' }
        );

        const result = await ytmp3(videoUrl, quality);

        if (!result || !result.status || !result.download) {
            logger.warn(`ytmp3 failed for URL: ${videoUrl}, Quality: ${quality}, Result:`, result);
            const errorMessage = result?.result || "Could not retrieve audio download link.";
            await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, `❌ Error: ${errorMessage}`);
            return;
        }

        const metadata = result.metadata || {};
        const downloadUrl = result.download;
        const actualTitle = metadata.title || title || 'Unknown Title'; // Prefer metadata title
        const duration = metadata.duration?.label || 'N/A';
        const artist = metadata.artist || 'Unknown Artist';

        await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id,
            `✅ Found: *${actualTitle}*\n📥 Downloading & Uploading...`,
            { parse_mode: 'Markdown' }
        );
        await ctx.replyWithChatAction('upload_audio');

        // Check file size
        let fileSize = 0;
        let fileSizeFormatted = 'N/A';
        try {
            const head = await axios.head(downloadUrl, { timeout: 10000 }); // Add timeout
             if (head.headers['content-length']) {
                fileSize = parseInt(head.headers['content-length'], 10);
                // Use helper from context if available
                fileSizeFormatted = helpers?.formatFileSize ? helpers.formatFileSize(fileSize) : `${(fileSize / (1024*1024)).toFixed(2)} MB`;
             }
        } catch (headErr) {
             logger.warn(`Could not get file size for ${downloadUrl}: ${headErr.message}`);
        }

        // Use bot's max file size setting or Telegram's general limit (50MB for bots via URL)
        const maxSizeMb = config.maxFileSize || 50;
        if (fileSize > maxSizeMb * 1024 * 1024) {
             await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id,
               `❌ File is too large (${fileSizeFormatted}). Max limit is ${maxSizeMb}MB.\n` +
               `Manual Download: [Click Here](${downloadUrl})`,
               { parse_mode: 'Markdown', disable_web_page_preview: true }
             );
             return;
        }

        // Prepare options for replyWithAudio
        const audioOptions = {
             caption: `🎧 *${actualTitle}*\n\nSize: ${fileSizeFormatted}\nDuration: ${duration}\n\nSent via @${ctx.me.username}`,
             parse_mode: 'Markdown',
             title: actualTitle.substring(0, 60), // Limit title length
             performer: artist,
             // duration: metadata.duration?.seconds // This is often unreliable
        };

        // Attempt to add thumbnail if available
        if (thumbnailUrl) {
            try {
                audioOptions.thumb = new InputFile({ url: thumbnailUrl });
            } catch (thumbErr) {
                logger.warn(`Failed to create InputFile for thumbnail URL ${thumbnailUrl}: ${thumbErr.message}`);
            }
        }

        // Send the audio
        await ctx.replyWithAudio(new InputFile({ url: downloadUrl }), audioOptions);

        // Delete the "Processing..." message on success
        await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id).catch(delErr => {
            logger.warn(`Failed to delete processing message ${processingMessage.message_id}: ${delErr.message}`);
        }); // Ignore error if message was already deleted


    } catch (error) {
        logger.error(`Error in downloadAndSendAudio for ${videoUrl}:`, error);
        const errorMsg = config?.ui?.errorMessage || "❌ An unexpected error occurred during download/upload.";
        await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, errorMsg).catch(e => {});
    }
}


// --- Main Command Execution ---
async function execute(ctx, bot, args) {
    const logger = ctx.logger;
    const config = bot.config;
    const helpers = ctx.helpers;

    // Determine effective prefix for usage message
    let effectivePrefix = config.prefix;
    if (ctx.chat?.type !== 'private' && ctx.db.isReady()) {
        const customPrefix = await ctx.db.getPrefix(ctx.chat.id).catch(() => null);
        if (customPrefix !== null && customPrefix !== undefined) effectivePrefix = customPrefix;
    }
    if (ctx.message?.text?.startsWith('/')) effectivePrefix = '/';


    if (args.length === 0) {
        const usage = meta.usage.replace(/{prefix}/g, effectivePrefix);
        return ctx.reply(`❓ Please provide a YouTube video URL or search query.\nUsage: \`${usage}\``, { parse_mode: 'Markdown' });
    }

    const queryOrUrl = args.join(" "); // Join all args to form query or use URL
    let processingMessage;

    try {
        // Send initial feedback message
        processingMessage = await ctx.reply(`⏳ Processing your request...`);
        await ctx.replyWithChatAction('typing');

        let videoUrl = null;
        let videoTitle = "Unknown Title";
        let videoThumbnail = null;

        // Check if it's a valid URL first
        if (isValidYoutubeUrl(queryOrUrl)) {
            logger.debug(`Input recognized as URL: ${queryOrUrl}`);
            videoUrl = queryOrUrl;
            // Title and thumb will be fetched during download stage by ytmp3 metadata
             await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, `⏳ Valid URL detected. Fetching audio info...`);
             // Don't set title/thumb here, let downloadAndSendAudio handle it via ytmp3 metadata
             await downloadAndSendAudio(ctx, bot, videoUrl, videoTitle, videoThumbnail, processingMessage);

        } else {
            // --- It's a search query ---
            logger.debug(`Input recognized as search query: ${queryOrUrl}`);
            await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, `🔍 Searching YouTube for: "${queryOrUrl}"...`);

            const searchResults = await youtubesearchapi.GetListByKeyword(queryOrUrl, false, 3); // Get top 3 results

            if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
                logger.warn(`No YouTube results found for query: ${queryOrUrl}`);
                await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, `❌ No results found for "${queryOrUrl}". Try different keywords.`);
                return;
            }

            // Take the first result
            const firstResult = searchResults.items[0];
            videoUrl = `https://www.youtube.com/watch?v=${firstResult.id}`;
            videoTitle = firstResult.title;
            // Try to get the best available thumbnail URL
            videoThumbnail = firstResult.thumbnail?.thumbnails?.pop()?.url || null;

            logger.info(`YouTube search found: "${videoTitle}" (${videoUrl}) for query "${queryOrUrl}"`);

            // Call the download function with the found video details
            await downloadAndSendAudio(ctx, bot, videoUrl, videoTitle, videoThumbnail, processingMessage);
        }

    } catch (error) {
        logger.error(`Music command failed for query/URL "${queryOrUrl}":`, error);
        const errorMsg = config?.ui?.errorMessage || "❌ An unexpected error occurred.";
        if (processingMessage) {
            await ctx.api.editMessageText(ctx.chat.id, processingMessage.message_id, errorMsg).catch(e => {});
        } else {
            // If error happened before processingMessage was defined
            await ctx.reply(errorMsg);
        }
    }
}

module.exports = { meta, execute };