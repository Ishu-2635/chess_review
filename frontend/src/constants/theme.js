export const CLASSIFICATION_META = {
  book:        { label: 'Book',        symbol: '',   color: '#808080' },
  brilliant:   { label: 'Brilliant',   symbol: '!!', color: '#FF9800' },
  best:        { label: 'Best',        symbol: '!',  color: '#2196F3' },
  great:       { label: 'Great',       symbol: '!',  color: '#27AE60' },
  excellent:   { label: 'Excellent',   symbol: '',   color: '#3498DB' },
  good:        { label: 'Good',        symbol: '',   color: '#95A5A6' },
  inaccuracy:  { label: 'Inaccuracy',  symbol: '?!', color: '#F39C12' },
  mistake:     { label: 'Mistake',     symbol: '?',  color: '#E67E22' },
  blunder:     { label: 'Blunder',     symbol: '??', color: '#E74C3C' },
  miss:        { label: 'Miss',        symbol: '',   color: '#9B59B6' },
}

// Nav items shown in the sidebar
export const NAV_ITEMS = [
  { id: 'home',     label: 'Home',      icon: '⌂',  path: '/' },
  { id: 'analysis', label: 'Analysis',  icon: '◈',  path: '/analysis' },
]