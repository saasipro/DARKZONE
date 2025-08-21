const config = require('../config');
const { cmd } = require('../command');
const { getBuffer } = require('../util/fetcher');

// YouTube Data API setup
const YOUTUBE_API_KEY = 'AIzaSyDUb3ViZJBT0x5lzLjB9bGjikvp-_KnPl4';
const DOWNLOADER_BASE = 'https://yt.david-cyril.net.ng';

// MP4 video download
cmd({ 
    pattern: "mp4", 
    alias: ["video"], 
    react: "🎥", 
    desc: "Download YouTube video", 
    category: "main", 
    use: '.mp4 <YT url or video name>', 
    filename: __filename 
}, async (conn, mek, m, { from, prefix, quoted, q, reply }) => { 
    try { 
        if (!q) return await reply("Please provide a YouTube URL or video name.");
        
        // Search YouTube using Google API
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
        let searchResponse = await fetch(searchUrl);
        let searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
            return reply("No results found!");
        }
        
        let videoId = searchData.items[0].id.videoId;
        let videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        let videoInfo = searchData.items[0].snippet;
        
        // Use your downloader website
        let downloadUrl = `${DOWNLOADER_BASE}/download/mp4?url=${encodeURIComponent(videoUrl)}`;
        
        let ytmsg = `📹 *Video Downloader*
🎬 *Title:* ${videoInfo.title}
👤 *Channel:* ${videoInfo.channelTitle}
📅 *Published:* ${new Date(videoInfo.publishedAt).toLocaleDateString()}
🔗 *YouTube Link:* ${videoUrl}
> 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 ❤️`;

        // Send video
        await conn.sendMessage(
            from, 
            { 
                video: { url: downloadUrl }, 
                caption: ytmsg,
                mimetype: "video/mp4",
                fileName: `${videoInfo.title}.mp4`
            }, 
            { quoted: mek }
        );

    } catch (e) {
        console.log('MP4 Error:', e);
        reply("An error occurred. Please try again later.");
    }
});

// MP3 song download 
cmd({ 
    pattern: "song", 
    alias: ["play", "mp3"], 
    react: "🎶", 
    desc: "Download YouTube song", 
    category: "main", 
    use: '.song <song name>', 
    filename: __filename 
}, async (conn, mek, m, { from, sender, reply, q }) => { 
    try {
        if (!q) return reply("Please provide a song name or YouTube link.");

        // Search YouTube using Google API
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
        let searchResponse = await fetch(searchUrl);
        let searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
            return reply("No results found!");
        }
        
        let videoId = searchData.items[0].id.videoId;
        let videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        let videoInfo = searchData.items[0].snippet;
        
        // Use your downloader website for audio
        let downloadUrl = `${DOWNLOADER_BASE}/download/mp3?url=${encodeURIComponent(videoUrl)}`;

    await conn.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${videoInfo.title}.mp3`,
        contextInfo: {
            externalAdReply: {
                title: videoInfo.title.length > 25 ? `${videoInfo.title.substring(0, 22)}...` : videoInfo.title,
                body: "Join our WhatsApp Channel",
                mediaType: 1,
                thumbnailUrl: videoInfo.thumbnails.high.url,
                sourceUrl: 'https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J',
                mediaUrl: 'https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J',
                showAdAttribution: true,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: mek });

    } catch (error) {
        console.error('Song Error:', error);
        reply("An error occurred. Please try again.");
    }
});

// Additional utility command to check API status
cmd({
    pattern: "ytstatus",
    desc: "Check YouTube API status",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        let testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=test&key=${YOUTUBE_API_KEY}`;
        let response = await fetch(testUrl);
        
        if (response.ok) {
            reply("✅ YouTube API is working perfectly!");
        } else {
            reply("❌ YouTube API connection failed");
        }
    } catch (e) {
        reply("❌ YouTube API connection error");
    }
});
