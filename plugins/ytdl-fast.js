const { cmd } = require('../lib');
const ytdl = require('ytdl-core');
const fs = require('fs');

cmd({
    pattern: 'song',  // Command trigger, e.g., .song <YouTube URL>
    desc: 'Downloads YouTube song as audio',
    category: 'downloader',
    react: '🎵',  // Emoji reaction on command
    filename: __filename
}, async (Void, citel, text) => {
    if (!text) return citel.reply('*Please provide a YouTube link!* 😔');

    if (!ytdl.validateURL(text)) return citel.reply('*Invalid YouTube URL!* ❌');

    try {
        const info = await ytdl.getInfo(text);
        const audioStream = ytdl.downloadFromInfo(info, {
            filter: 'audioonly',
            quality: 'highestaudio'
        });

        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').trim();  // Clean title for filename
        const filePath = `./temp/${title}.mp3`;

        // Pipe the stream to a file
        const writeStream = audioStream.pipe(fs.createWriteStream(filePath));

        writeStream.on('finish', async () => {
            // Send the audio to the chat
            await Void.sendMessage(citel.chat, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: 'Downloaded by DARKZONE Bot',
                        thumbnail: await (await fetch(info.playerResponse.videoDetails.thumbnail.thumbnails.pop().url)).buffer(),
                        mediaType: 2,
                        mediaUrl: text
                    }
                }
            }, { quoted: citel });

            // Clean up temp file
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error(error);
        citel.reply(`*Error downloading song:* ${error.message} 😔`);
    }
});
