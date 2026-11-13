interface HeaderProps {
  attiva: 'mappa' | 'dati';
}

export default function Header({ attiva }: HeaderProps) {
  const voci = [
    { href: '/', label: 'Mappa', chiave: 'mappa' as const },
    { href: '/dati', label: 'Dati aggiornati', chiave: 'dati' as const },
  ];
  return (
    <header>
      <div className="titolo">
        <h1>Idrogramma Italia</h1>
        <p>lo stato dei fiumi italiani — livello di oggi vs storia dello stesso periodo</p>
      </div>
      <details className="menu">
        <summary aria-label="menu">☰</summary>
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
