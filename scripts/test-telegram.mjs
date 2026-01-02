#!/usr/bin/env node

/**
 * Test Telegram notification
 */

const botToken = '8523957385:AAFwkfzJiu_hFGHOvbTEjmm8-V6JsDW0Y_c';
const chatId = '1854386230';

console.log('📱 Sending test Telegram message...\n');

try {
  const message = `✅ *JusticeHub Telegram Test*\n\n` +
    `This is a test notification from your JusticeHub automation system.\n\n` +
    `If you're seeing this, Telegram notifications are working! 🎉\n\n` +
    `Next steps:\n` +
    `• Configure Empathy Ledger secrets\n` +
    `• Test profile sync\n` +
    `• Deploy workflows`;

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    }
  );

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Telegram message sent successfully!');
    console.log('📱 Check your Telegram app - you should see the message!\n');
  } else {
    const error = await response.json();
    console.error('❌ Failed to send message:', error.description);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
