// Socle commun de Shoot'n'Look.
// Première étape de modularisation : fonctions utilitaires isolées.

export const $ = id => document.getElementById(id);

export const euro = value =>
  `${Number(value || 0).toFixed(2)} EUR`;

export const toLocalISO = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const dateNow = () =>
  toLocalISO(new Date());

export const safe = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
