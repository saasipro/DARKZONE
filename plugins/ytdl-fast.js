const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

// Alternative API endpoints
const VIDEO_API = 'https://apis.davidcyriltech.my.id/download/ytmp4';
const AUDIO_API = 'https://api.princetechn.com/api/download/ytmp3';

// Alternative APIs if primary ones fail
const BACKUP_APIS = {
  video: [
    'https://youtube-downloader-api1.p.rapidapi.com/api/video',
    'https://yt-downloader-api.p.rapidapi.com/api/mp4'
  ],
  audio: [
    'https://youtube-downloader-api1.p.rapidapi.com/api/mp3',
    'https://yt-downloader-api.p.rapidapi.com/api/mp3'
  ]
};

// MP4 video download
cmd({ 
    pattern: "mp4", 
    alias: ["video"], 
    react: "🎥", 
    desc: "Download YouTube video", 
    category: "main", 
    use: '.mp4 < Yt url or Name >', 
    filename: __filename 
}, async (conn, mek, m, { from, prefix, quoted, q, reply }) => { 
    try { 
        if (!q) return await reply("Please provide a YouTube URL or video name.");
        
        const yt = await ytsearch(q);
        if (yt.results.length < 1) return reply("No results found!");
        
        let yts = yt.results[0];  
        
        // Try multiple API endpoints
        let videoData = null;
        let lastError = null;
        
        // Try primary API
        try {
            let response = await fetch(`${VIDEO_API}?url=${encodeURIComponent(yts.url)}`);
            let data = await response.json();
            
            if (data.status === 200 && data.success && data.result.download_url) {
                videoData = data;
            }
        } catch (e) {
            lastError = e;
            console.log("Primary video API failed:", e.message);
        }
        
        // If primary API failed, try backup APIs
        if (!videoData) {
            for (let apiUrl of BACKUP_APIS.video) {
                try {
                    let response = await fetch(`${apiUrl}?url=${encodeURIComponent(yts.url)}`);
                    let data = await response.json();
                    
                    // Different APIs have different response formats
                    if (data.downloadUrl || data.url || (data.result && data.result.download_url)) {
                        videoData = data;
                        break;
                    }
                } catch (e) {
                    lastError = e;
                    console.log(`Backup API ${apiUrl} failed:`, e.message);
                }
            }
        }
        
        if (!videoData) {
            return reply("All download services are currently unavailable. Please try again later.");
        }

        // Extract download URL based on different API response formats
        let downloadUrl = videoData.result?.download_url || 
                         videoData.downloadUrl || 
                         videoData.url ||
                         (videoData.links && videoData.links[0] && videoData.links[0].url);
        
        if (!downloadUrl) {
            return reply("Could not extract download URL from API response.");
        }

        let ytmsg = `📹 *Video Downloader*
🎬 *Title:* ${yts.title}
⏳ *Duration:* ${yts.timestamp}
👀 *Views:* ${yts.views}
👤 *Author:* ${yts.author.name}
🔗 *Link:* ${yts.url}
> 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 ❤️`;

        // Send video with timeout
        await conn.sendMessage(
            from, 
            { 
                video: { url: downloadUrl }, 
                caption: ytmsg,
                mimetype: "video/mp4"
            }, 
            { quoted: mek, timeout: 60000 } // 60 second timeout
        );

    } catch (e) {
        console.error("MP4 Download Error:", e);
        reply("An error occurred while processing your request. Please try again later.");
    }
});

// MP3 song download 
cmd({ 
    pattern: "song", 
    alias: ["play", "mp3"], 
    react: "🎶", 
    desc: "Download YouTube song", 
    category: "main", 
    use: '.song <query>', 
    filename: __filename 
}, async (conn, mek, m, { from, sender, reply, q }) => { 
    try {
        if (!q) return reply("Please provide a song name or YouTube link.");

        const yt = await ytsearch(q);
        if (!yt.results.length) return reply("No results found!");

        const song = yt.results[0];
        
        // Try multiple API endpoints
        let audioData = null;
        let lastError = null;
        
        // Try primary API
        try {
            const res = await fetch(`${AUDIO_API}?url=${encodeURIComponent(song.url)}`);
            const data = await res.json();
            
            if (data.result?.downloadUrl) {
                audioData = data;
            }
        } catch (e) {
            lastError = e;
            console.log("Primary audio API failed:", e.message);
        }
        
        // If primary API failed, try backup APIs
        if (!audioData) {
            for (let apiUrl of BACKUP_APIS.audio) {
                try {
                    let response = await fetch(`${apiUrl}?url=${encodeURIComponent(song.url)}`);
                    let data = await response.json();
                    
                    if (data.downloadUrl || data.url || (data.result && data.result.downloadUrl)) {
                        audioData = data;
                        break;
                    }
                } catch (e) {
                    lastError = e;
                    console.log(`Backup API ${apiUrl} failed:`, e.message);
                }
            }
        }
        
        if (!audioData) {
            return reply("All audio download services are currently unavailable. Please try again later.");
        }

        // Extract download URL based on different API response formats
        const downloadUrl = audioData.result?.downloadUrl || 
                           audioData.downloadUrl || 
                           audioData.url;

        if (!downloadUrl) {
            return reply("Could not extract audio download URL from API response.");
        }

        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${song.title.substring(0, 50)}.mp3`, // Limit filename length
            contextInfo: {
                externalAdReply: {
                    title: song.title.length > 25 ? `${song.title.substring(0, 22)}...` : song.title,
                    body: "Join our WhatsApp Channel",
                    mediaType: 1,
                    thumbnailUrl: song.thumbnail.replace('default.jpg', 'hqdefault.jpg'),
                    sourceUrl: 'https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J',
                    mediaUrl: 'https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J',
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek, timeout: 60000 }); // 60 second timeout

    } catch (error) {
        console.error("Song Download Error:", error);
        reply("An error occurred while processing your request. Please try again.");
    }
});
