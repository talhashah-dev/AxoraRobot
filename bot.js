require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("Axora Downloader is online...");

// --- HELPERS ---

// function calls the Cobalt API to get a direct video link
async function downloadMedia(url) {
    try {
        const response = await axios.post('http://localhost:9000/', {
            url: url,
            videoQuality: "720",
            filenameStyle: "basic"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Local Docker Error:", error.message);
        return null;
    }
}

// --- COMMANDS ---

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        "👋 **Welcome to Axora Downloader**\n\n" +
        "I am currently specialized in **Instagram Reels**.\n\n" +
        "📌 **How to use:**\n" +
        "Simply paste an Instagram Reel link here, and I will send you the video file!", 
        { parse_mode: "Markdown" }
    );
});

// --- MAIN MESSAGE HANDLER ---

bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (!text || text.startsWith("/")) return;

    // Detect Instagram Links
    const isInstagram = /(https?:\/\/(?:www\.)?instagram\.com\/(?:reels|reel|p)\/([^/?#&]+))/gi.test(text);

    if (isInstagram) {
        const processingMsg = await bot.sendMessage(chatId, "⏳ *Processing your Reel...*", { parse_mode: "Markdown" });

        const result = await downloadMedia(text);

        if (result && result.url) {
            try {
                // Send the video file
                await bot.sendVideo(chatId, result.url, {
                    caption: "✅ Downloaded via @AxoraRobot",
                });
                
                // Delete the "Processing" message to keep chat clean
                bot.deleteMessage(chatId, processingMsg.message_id);
            } catch (err) {
                bot.editMessageText("❌ Error: Telegram couldn't process the video file.", {
                    chat_id: chatId,
                    message_id: processingMsg.message_id
                });
            }
        } else {
            bot.editMessageText("❌ Failed to fetch the video. The Reel might be private or deleted.", {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }
    }
});