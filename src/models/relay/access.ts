// Qui peut agir sur le bot (boutons, codes de suivi, /afaire).
// Le bot écrit dans UNE conversation (TELEGRAM_ADMIN_CHAT_ID) : le compte de Jean Paul, ou un groupe d'équipe.
// Dans un groupe, seuls les comptes listés dans TELEGRAM_ALLOWED_USERS peuvent agir : quelqu'un ajouté
// au groupe par erreur voit les messages mais ne peut rien enregistrer.
// Pur : aucune base, aucun réseau (testé dans relay.test.ts).

/** Un identifiant de conversation négatif est un groupe ; positif, une conversation privée. */
export const isGroupChat = (chatId: number) => chatId < 0;

/**
 * Comptes autorisés : la liste « 111, 222 » (espaces, virgules ou points-virgules).
 * Sans liste, en conversation privée : le compte de cette conversation seulement. En groupe : personne.
 */
export function parseAllowedUsers(raw: string | undefined, chatId: number): number[] {
  const ids = (raw ?? "")
    .split(/[\s,;]+/)
    .filter((s) => /^\d{3,}$/.test(s))
    .map(Number);
  if (ids.length) return [...new Set(ids)];
  return isGroupChat(chatId) ? [] : [chatId];
}

/** Commande Telegram sans le « @NomDuBot » ajouté dans les groupes : « /afaire@FraulservicesBot » → « /afaire ». */
export const commandOf = (text: string) => (text.startsWith("/") ? text.split(/\s/)[0].split("@")[0].toLowerCase() : null);
