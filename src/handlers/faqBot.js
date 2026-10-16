/**
 * FAQ Auto-Reply Bot Handler
 */
const { templates } = require('../config/messages');

const FAQ_KEYWORDS = {
  bill: ['bill', 'বিল', 'payment', 'পেমেন্ট', 'pay', 'টাকা', 'due'],
  speed: ['speed', 'স্পিড', 'slow', 'ধীর', 'internet', 'ইন্টারনেট', 'connection', 'কানেকশন', 'disconnect'],
  package: ['package', 'প্যাকেজ', 'plan', 'প্ল্যান', 'mbps', 'price', 'দাম'],
  office: ['office', 'অফিস', 'address', 'ঠিকানা', 'location', 'কোথায়', 'time', 'সময়'],
};

function matchKeyword(text) {
  const lower = text.toLowerCase();
  for (const [key, keywords] of Object.entries(FAQ_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

async function handleFaqMessage(client, msg) {
  // Skip group messages
  if (msg.from.endsWith('@g.us')) return false;
  // Skip status
  if (msg.from === 'status@broadcast') return false;
  // Skip our own messages
  if (msg.fromMe) return false;

  const matched = matchKeyword(msg.body);

  if (matched) {
    const reply = templates.autoReply[matched];
    await msg.reply(reply);
    console.log(`🤖 FAQ replied [${matched}] to: ${msg.from}`);
    return true;
  }

  // Default reply for unrecognized messages
  await msg.reply(templates.autoReply.default);
  console.log(`🤖 Default reply to: ${msg.from}`);
  return true;
}

module.exports = { handleFaqMessage };
