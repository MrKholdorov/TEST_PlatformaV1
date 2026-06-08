export async function sendTelegramNotification(telegramId: string | undefined, message: string) {
  if (!telegramId) return; // Silent return if user hasn't linked telegram
  try {
    await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, message })
    });
  } catch (e) {
    console.error("Failed to send telegram notification from client:", e);
  }
}

export async function sendAdminNotification(message: string) {
  try {
    await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  } catch (e) {
    console.error("Failed to send admin notification:", e);
  }
}

export function isTelegramMiniApp(): boolean {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    // Check if initData exists, indicating we are inside the WebApp
    return !!window.Telegram.WebApp.initData;
  }
  return false;
}

export function getTelegramUser(): any {
  if (isTelegramMiniApp()) {
    return window.Telegram!.WebApp.initDataUnsafe?.user;
  }
  return null;
}
