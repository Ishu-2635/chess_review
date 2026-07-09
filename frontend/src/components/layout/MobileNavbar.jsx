export default function MobileNavbar({ onOpenSidebar, title }) {
  return (
    <div className="mobile-navbar">
      {/* Hamburger */}
      <button
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        style={{
          display: 'flex', flexDirection: 'column', gap: '5px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '6px',
        }}
      >
        <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text)', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text)', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '14px', height: '2px', background: 'var(--text)', borderRadius: '2px' }} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>♞</span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Chess<span style={{ color: 'var(--accent)' }}>IQ</span>
        </span>
      </div>

      {/* Page title or spacer */}
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
        {title || ''}
      </div>
    </div>
  )
}