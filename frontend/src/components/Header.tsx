interface HeaderProps {
  attiva: 'mappa' | 'dati' | 'fonti' | 'come-funziona';
}

export default function Header({ attiva }: HeaderProps) {
  const voci = [
    { href: '/', label: 'Mappa', chiave: 'mappa' as const },
    { href: '/dati', label: 'Dati aggiornati', chiave: 'dati' as const },
    { href: '/fonti', label: 'Fonti', chiave: 'fonti' as const },
    { href: '/come-funziona', label: 'Come funziona', chiave: 'come-funziona' as const },
  ];
  return (
    <header>
      <div className="titolo">
        <h1>Idrogramma Italia</h1>
        <p>lo stato dei fiumi italiani — livello di oggi vs storia dello stesso periodo</p>
      </div>
      <details className="menu">
        <summary aria-label="Menu">
          {/* tre tacche di lunghezza diversa, come un idrometro; aperto diventa una X */}
          <span className="burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </summary>
        <nav>
          {voci.map((v) => (
            <a key={v.chiave} href={v.href} aria-current={attiva === v.chiave ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      </details>
    </header>
  );
}
