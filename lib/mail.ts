// Resend APIを使って確認メールを送信する
interface BookingEmailParams {
  to: string;
  name: string;
  date: string;
  timeSlot: string;
  purpose: string;
}

export async function sendConfirmationEmail(params: BookingEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEYが設定されていません");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "スケジュール予約 <onboarding@resend.dev>",
      to: params.to,
      subject: "【予約確認】スケジュール申し込みを受け付けました",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A;">予約確認</h2>
          <p>${params.name} 様</p>
          <p>以下の内容で申し込みを受け付けました。</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">希望日時</td><td style="padding: 8px; border: 1px solid #E5E7EB;">${params.date} ${params.timeSlot}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">用件</td><td style="padding: 8px; border: 1px solid #E5E7EB;">${params.purpose}</td></tr>
          </table>
          <p style="color: #6B7280; font-size: 14px;">このメールは自動送信されています。</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("メール送信失敗:", errorText);
  }
}
