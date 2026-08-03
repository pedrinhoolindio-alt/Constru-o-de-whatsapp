/**
 * Utility functions for time formatting and WhatsApp markdown rendering
 */

export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function parseWhatsAppMarkdown(text: string): string {
  if (!text) return '';
  
  // Escape HTML characters
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Formatting rules:
  // *bold* -> <strong>bold</strong>
  escaped = escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // _italic_ -> <em>italic</em>
  escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // ~strike~ -> <del>strike</del>
  escaped = escaped.replace(/~([^~]+)~/g, '<del>$1</del>');

  // Line breaks
  escaped = escaped.replace(/\n/g, '<br/>');

  return escaped;
}
