/**
 * Bangla message templates for Friends Online ISP
 */
require('dotenv').config();

const BUSINESS = {};

// Re-reads the contact/payment fields from process.env; called at load and after /config updates.
function refreshBusiness() {
  const support1 = process.env.SUPPORT_NUMBER_1 || process.env.SUPPORT_NUMBER || '01XXXXXXXXX';
  const support2 = process.env.SUPPORT_NUMBER_2 || '';
  Object.assign(BUSINESS, {
    name: process.env.BUSINESS_NAME || 'Friends Online',
    support: support2 ? `${support1} / ${support2}` : support1,
    website: process.env.WEBSITE_URL || 'https://friendsonline.com.bd',
    address: process.env.OFFICE_ADDRESS || 'Kallyanpur, Mirpur, Dhaka',
    hours: process.env.OFFICE_HOURS || 'সকাল ১০টা - রাত ১০টা',
    bkash: process.env.BKASH_NUMBER || '01XXXXXXXXX',
    nagad: process.env.NAGAD_NUMBER || '01XXXXXXXXX',
  });
}
refreshBusiness();

const templates = {
  paymentConfirmation: (data) => `✅ *পেমেন্ট নিশ্চিত হয়েছে!*

প্রিয় *${data.customerName}*,

আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ!

📄 *Invoice বিবরণ:*
▪️ Invoice নং: ${data.invoiceNo}
▪️ পরিমাণ: ৳${data.amount}
▪️ তারিখ: ${data.paymentDate || new Date().toLocaleDateString('bn-BD')}
▪️ পরবর্তী বিল: ${data.dueDate}
▪️ মাস: ${data.month || ''}

🌐 পোর্টাল: ${BUSINESS.website}/login
📞 সাপোর্ট: ${BUSINESS.support}

— ${BUSINESS.name} টিম 🙏`,

  welcome: (data) => `🎉 *স্বাগতম ${BUSINESS.name} পরিবারে!*

প্রিয় *${data.customerName}*,

আপনার ইন্টারনেট সংযোগ সক্রিয় হয়েছে! 🚀

🔐 *আপনার লগইন তথ্য:*
▪️ Username: \`${data.username}\`
▪️ Password: \`${data.password}\`
▪️ Customer ID: ${data.customerId || 'N/A'}

📦 *প্যাকেজ:* ${data.package || 'Standard'}
📅 *মেয়াদ:* ${data.expiryDate || ''}

🌐 *কাস্টমার পোর্টাল:* ${BUSINESS.website}/login
📞 *সাপোর্ট:* ${BUSINESS.support}
🏢 *অফিস:* ${BUSINESS.address}
🕐 *সময়:* ${BUSINESS.hours}

⚠️ নিরাপত্তার জন্য প্রথম লগইনে পাসওয়ার্ড পরিবর্তন করুন।

আমাদের সাথে থাকুন! 💙
— ${BUSINESS.name} টিম`,

  invoice: (data) => `📋 *মাসিক Invoice*

প্রিয় *${data.customerName}*,

আপনার এই মাসের বিল তৈরি হয়েছে।

💰 *বিল বিবরণ:*
▪️ Invoice নং: ${data.invoiceNo}
▪️ মাস: ${data.month}
▪️ পরিমাণ: ৳${data.amount}
▪️ শেষ তারিখ: ${data.dueDate}

💳 *পেমেন্ট করুন:*
▪️ bKash: ${BUSINESS.bkash}
▪️ Nagad: ${BUSINESS.nagad}
▪️ অফিসে: ${BUSINESS.address}

🌐 অনলাইন পেমেন্ট: ${BUSINESS.website}/payment
📞 সাহায্য: ${BUSINESS.support}

সময়মতো পেমেন্ট করুন, সংযোগ চালু রাখুন! 🙏
— ${BUSINESS.name} টিম`,

  notice: (data) => `📢 *${data.title || 'গুরুত্বপূর্ণ নোটিশ'}*

${data.message}

📅 তারিখ: ${data.date || new Date().toLocaleDateString('bn-BD')}

📞 যোগাযোগ: ${BUSINESS.support}
🌐 ${BUSINESS.website}

— ${BUSINESS.name} টিম 🙏`,

  maintenance: (data) => `⚠️ *রক্ষণাবেক্ষণ নোটিশ*

প্রিয় গ্রাহক,

আগামী *${data.startTime}* থেকে *${data.endTime}* পর্যন্ত নেটওয়ার্ক রক্ষণাবেক্ষণ কাজ চলবে।

🔧 কারণ: ${data.reason || 'নিয়মিত রক্ষণাবেক্ষণ'}
📍 এলাকা: ${data.area || 'সকল এলাকা'}

এই সময়ে ইন্টারনেট সংযোগ সাময়িক বন্ধ থাকতে পারে।
অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।

📞 জরুরি: ${BUSINESS.support}
— ${BUSINESS.name} টিম`,

  autoReply: {
    bill: `💳 *বিল পেমেন্ট তথ্য*

আপনার বিল পরিশোধ করুন:
▪️ bKash: ${BUSINESS.bkash}
▪️ Nagad: ${BUSINESS.nagad}
▪️ অনলাইন: ${BUSINESS.website}/payment
▪️ অফিসে: ${BUSINESS.address}

📞 সাহায্য: ${BUSINESS.support}`,

    speed: `⚡ *ইন্টারনেট স্পিড সমস্যা?*

অনুগ্রহ করে এই পদক্ষেপগুলো নিন:
1️⃣ Router বন্ধ করুন, ৩০ সেকেন্ড অপেক্ষা করুন, আবার চালু করুন
2️⃣ speedtest.net এ স্পিড চেক করুন
3️⃣ সমস্যা থাকলে কল করুন: ${BUSINESS.support}

স্বাভাবিক সময়ের মধ্যে সমাধান না হলে টিকেট করুন:
🌐 ${BUSINESS.website}/support`,

    package: `📦 *আমাদের প্যাকেজসমূহ*

সকল প্যাকেজ দেখুন:
🌐 ${BUSINESS.website}/packages

বিস্তারিত জানতে:
📞 ${BUSINESS.support}
🏢 ${BUSINESS.address}`,

    office: `🏢 *অফিস তথ্য*

📍 ঠিকানা: ${BUSINESS.address}
🕐 সময়: ${BUSINESS.hours}
📞 ফোন: ${BUSINESS.support}
🌐 ওয়েবসাইট: ${BUSINESS.website}`,

    default: `আপনার বার্তা পেয়েছি। আমাদের টিম শীঘ্রই যোগাযোগ করবে।

📞 জরুরি সাহায্য: ${BUSINESS.support}
🌐 ${BUSINESS.website}

— ${BUSINESS.name} টিম 🙏`
  }
};

module.exports = { templates, BUSINESS, refreshBusiness };
