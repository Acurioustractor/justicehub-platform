#!/usr/bin/env node

/**
 * Get Telegram Chat ID
 *
 * This script helps you find your Telegram chat ID after sending a message to your bot.
 */

const botToken = process.argv[2] || '8523957385:AAFwkfzJiu_hFGHOvbTEjmm8-V6JsDW0Y_c';

console.log('🤖 Getting Telegram updates...\n');

try {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  const data = await response.json();

  if (!data.ok) {
    console.error('❌ Error:', data.description);
    process.exit(1);
  }

  if (!data.result || data.result.length === 0) {
    console.log('⚠️  No messages found!');
    console.log('\n📱 To get your chat ID:');
    console.log('1. Open Telegram');
    console.log('2. Search for your bot');
    console.log('3. Send it any message (like "hello")');
    console.log('4. Run this script again\n');
    process.exit(0);
  }

  console.log('✅ Found messages!\n');
  console.log('Your chat IDs:\n');

  const uniqueChats = new Map();

  data.result.forEach(update => {
    if (update.message?.chat) {
      const chat = update.message.chat;
      if (!uniqueChats.has(chat.id)) {
        uniqueChats.set(chat.id, {
          id: chat.id,
          type: chat.type,
          title: chat.title,
          username: chat.username,
          first_name: chat.first_name,
          last_name: chat.last_name
        });
      }
    }
  });

  uniqueChats.forEach((chat, id) => {
    console.log(`Chat ID: ${id}`);
    console.log(`  Type: ${chat.type}`);
    if (chat.type === 'private') {
      console.log(`  Name: ${chat.first_name || ''} ${chat.last_name || ''}`);
      if (chat.username) console.log(`  Username: @${chat.username}`);
    } else {
      console.log(`  Title: ${chat.title}`);
    }
    console.log('');
  });

  console.log('🔐 To configure GitHub secrets:');
  console.log(`\ngh secret set TELEGRAM_BOT_TOKEN`);
  console.log(`# Paste: ${botToken}`);
  console.log(`\ngh secret set TELEGRAM_CHAT_ID`);
  console.log(`# Paste: ${Array.from(uniqueChats.keys())[0]}\n`);

} catch (error) {
  console.error('❌ Failed to get updates:', error.message);
  process.exit(1);
}
