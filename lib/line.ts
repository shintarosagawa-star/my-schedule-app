// LINE Messaging API を使ってプッシュメッセージを送信する
export async function sendLineMessage(message: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!token || !userId) {
    console.error("LINE環境変数が設定されていません");
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("LINE通知失敗:", errorText);
    // リトライはしないが、エラーをログに記録
    throw new Error(`LINE通知失敗: ${res.status}`);
  }
}
