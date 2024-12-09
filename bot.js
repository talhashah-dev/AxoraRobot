require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("Axora is running..");

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "there";

    const welcomeMessage = `
Hello dear ${userName} 👋

🔰 **AxoraRobot** is a powerful bot for managing Telegram groups.  
Here’s what I can do for you:
✅ **Quick response to commands**  
✅ **Protection against spam and unwanted content**  
✅ **Advanced filtering of words and phrases**  
✅ **Precise user access control**  
✅ **Regular updates and top-notch reliability**

**Steps to Get Started:**
1️⃣ Add me to your group: [Click here](https://t.me/AxoraRobot?startgroup=new)  
2️⃣ Grant me admin permissions.  
3️⃣ I’ll start managing your group automatically!

💡 **Pro Tip**: Ensure your group is a supergroup for the best experience.

Need help? Use the buttons below to explore the bot's features or contact support!
    `;

    const mainMenu = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📚 Bot Guide", callback_data: "bot_guide" },
                    { text: "🌐 Change Language", callback_data: "change_language" }
                ],
                [
                    { text: "➕ Add Bot to Group", url: "https://t.me/AxoraRobot?startgroup=new" }
                ],
                [
                    { text: "💬 Contact Support", url: "https://t.me/AxoraSupport" }
                ]
            ]
        },
        parse_mode: "Markdown"
    };

    bot.sendMessage(chatId, welcomeMessage, mainMenu);
});

bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    bot.answerCallbackQuery(query.id).catch((error) => {
        console.error("Callback query error:", error);
    });

    if (query.data === "bot_guide") {
        const guideMessage = `
📚 **Bot Guide**

Here are some commands to get you started:
- '/help' - View all commands
- '/settings' - Configure your group
- '/ban <user>' - Ban a user
- '/unban <user>' - Unban a user
- '/crypto <coin>' - Get crypto prices

Use the buttons below to learn more about specific features!
        `;

        const guideButtons = {
            inline_keyboard: [
                // [
                //     { text: "📖 Learn Commands", callback_data: "learn_commands" },
                //     { text: "🔧 Advanced Features", callback_data: "advanced_features" }
                // ],
                [{ text: "⬅️ Back", callback_data: "main_menu" }]
            ]
        };

        bot.editMessageText(guideMessage, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: guideButtons,
            parse_mode: "Markdown"
        }).catch((error) => {
            console.log("error", error)
        })
    }

    if (query.data === "change_language") {
        const languageMessage = "🌐 **Select your preferred language:**";
        const languageButtons = {
            inline_keyboard: [
                [
                    { text: "English", callback_data: "language_en" },
                    { text: "فارسی", callback_data: "language_fa" }
                ],
                [{ text: "⬅️ Back", callback_data: "main_menu" }]
            ]
        };

        bot.editMessageText(languageMessage, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: languageButtons,
            parse_mode: "Markdown"
        });
    }

    if (query.data === "main_menu") {
        const welcomeMessage = `
Hello dear 👋

🔰 **AxoraRobot** is a powerful bot for managing Telegram groups.  
Here’s what I can do for you:
✅ **Quick response to commands**  
✅ **Protection against spam and unwanted content**  
✅ **Advanced filtering of words and phrases**  
✅ **Precise user access control**  
✅ **Regular updates and top-notch reliability**

Need help? Use the buttons below to explore the bot's features or contact support!
        `;

        const mainMenu = {
            inline_keyboard: [
                [
                    { text: "📚 Bot Guide", callback_data: "bot_guide" },
                    { text: "🌐 Change Language", callback_data: "change_language" }
                ],
                [
                    { text: "➕ Add Bot to Group", url: "https://t.me/AxoraRobot?startgroup=new" }
                ],
                [
                    { text: "💬 Contact Support", url: "https://t.me/AxoraSupport" }
                ]
            ]
        };

        bot.editMessageText(welcomeMessage, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: mainMenu,
            parse_mode: "Markdown"
        });
    }

    bot.answerCallbackQuery(query.id);
});


// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   if(msg.text != "/start") {
//       bot.sendMessage(chatId, msg.text);
//   } else {
//     null
//   }
// });


// Tagging Members
let groupMembers = new Set();

bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // Only store group chat members
    if (msg.chat.type === "supergroup" || msg.chat.type === "group") {
        const username = msg.from.username;
        const name = username ? `@${username}` : msg.from.first_name;

        groupMembers.add(name);
    }
});

bot.onText(/\/tagall/, (msg) => {
    const chatId = msg.chat.id;

    if (groupMembers.size > 0) {
        const mentionList = Array.from(groupMembers).join(" ");

        bot.sendMessage(chatId, `📢 **Attention Everyone!**\n\n${mentionList}`, {
            parse_mode: "Markdown",
        });
    } else {
        bot.sendMessage(chatId, "No members to tag yet! Let them interact with the bot first.");
    }
});

// Spam Blocker
const bannedWords = ["spam", "http", "www", "ad"];

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase();

    if (text) {
        const containsBannedWord = bannedWords.some((word) => text.includes(word));

        if (containsBannedWord) {
            bot.deleteMessage(chatId, msg.message_id)
                .then(() => console.log("Spam message deleted."))
                .catch((error) => console.error("Failed to delete message:", error));
        }
    }
});


bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && (text.includes("http") || text.includes("www"))) {
        // Check if the sender is an admin
        bot.getChatAdministrators(chatId)
            .then((admins) => {
                const isAdmin = admins.some((admin) => admin.user.id === msg.from.id);

                if (!isAdmin) {
                    bot.deleteMessage(chatId, msg.message_id)
                        .then(() => console.log("Link deleted."))
                        .catch((error) => console.error("Failed to delete link:", error));
                }
            })
            .catch((error) => console.error("Error checking admin status:", error));
    }
});
