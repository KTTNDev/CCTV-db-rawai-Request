import { NextResponse } from 'next/server';

// ✅ ดึงค่าจาก Environment Variables (เดี๋ยวไปตั้งค่าใน Vercel Dashboard)
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

const EVENT_COLORS: Record<string, string> = {
  'อุบัติเหตุ': '#EF4444',
  'อาชญากรรม': '#EF4444',
  'ทะเลาะวิวาท': '#F97316',
  'ของหาย': '#3B82F6',
  'default': '#06C755'
};

export async function POST(request: Request) {
  try {
    if (!LINE_ACCESS_TOKEN || !LINE_USER_ID) {
      return NextResponse.json({ success: false, error: 'Config Missing' }, { status: 500 });
    }

    const body = await request.json();
    const { trackingId, name, location, eventType, date, time } = body;

    const eventKey = Object.keys(EVENT_COLORS).find(k => eventType.includes(k)) || 'default';
    const headerColor = EVENT_COLORS[eventKey] || EVENT_COLORS['default'];

    const flexMessage = {
      type: "flex",
      altText: `🔔 แจ้งเหตุใหม่: ${eventType}`,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "คำร้องขอ CCTV ใหม่", weight: "bold", size: "lg", color: headerColor },
            { type: "text", text: eventType, weight: "bold", size: "xl", margin: "xs", color: "#1F2937" },
            { type: "separator", margin: "lg" },
            {
              type: "box", layout: "vertical", margin: "lg", spacing: "sm",
              contents: [
                { type: "box", layout: "baseline", spacing: "sm", contents: [
                  { type: "text", text: "ID", color: "#9CA3AF", size: "sm", flex: 1 },
                  { type: "text", text: trackingId, wrap: true, color: "#4B5563", size: "sm", flex: 4, weight: "bold" }
                ]},
                { type: "box", layout: "baseline", spacing: "sm", contents: [
                  { type: "text", text: "ผู้แจ้ง", color: "#9CA3AF", size: "sm", flex: 1 },
                  { type: "text", text: name, wrap: true, color: "#4B5563", size: "sm", flex: 4 }
                ]},
                { type: "box", layout: "baseline", spacing: "sm", contents: [
                  { type: "text", text: "สถานที่", color: "#9CA3AF", size: "sm", flex: 1 },
                  { type: "text", text: location, wrap: true, color: "#4B5563", size: "sm", flex: 4 }
                ]},
                { type: "box", layout: "baseline", spacing: "sm", contents: [
                  { type: "text", text: "เวลา", color: "#9CA3AF", size: "sm", flex: 1 },
                  { type: "text", text: `${date} (${time})`, wrap: true, color: "#4B5563", size: "sm", flex: 4 }
                ]}
              ]
            }
          ]
        },
        footer: {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [{
            type: "button", style: "primary", color: headerColor, height: "sm",
            action: { type: "uri", label: "ตรวจสอบคำร้อง", uri: "https://db-rawaicctv.web.app/" }
          }]
        }
      }
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: LINE_USER_ID, messages: [flexMessage] }),
    });

    return NextResponse.json({ success: response.ok });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}