<script lang="ts">
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import '../app.css';

  let { children }: { children: Snippet } = $props();

  const voci: { href: string; label: string }[] = [
    { href: '/', label: 'Mappa' },
    { href: '/dati', label: 'Dati aggiornati' },
  ];

  const corrente = $derived(
    voci.find((v) =>
      v.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(v.href)
    )
  );
</script>

<header>
  <div class="titolo">
    <h1>Idrogramma Italia</h1>
    <p>lo stato dei fiumi italiani — livello di oggi vs storia dello stesso periodo</p>
  </div>
  <details class="menu">
    <summary aria-label="menu">☰</summary>
    <nav>
      {#each voci as v (v.href)}
        <a href={v.href} aria-current={corrente?.href === v.href ? 'page' : undefined}>{v.label}</a>
      {/each}
    </nav>
  </details>
</header>

{@render children()}
