import { Search, Bell, Radar, TrendingDown, ShieldCheck, SlidersHorizontal, ArrowUpRight, Zap } from "lucide-react";
import { demoOffers } from "@/lib/demo-offers";
import type { Offer } from "@/lib/types";

const money = (n:number) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

async function getOffers(): Promise<Offer[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) return demoOffers;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, anon);
    const { data, error } = await db.from("offers").select("*").eq("condition","new").order("verified_at",{ascending:false}).limit(24);
    if (error || !data?.length) return demoOffers;
    return data as Offer[];
  } catch { return demoOffers; }
}

export default async function Home() {
  const offers = await getOffers();
  return <main className="min-h-screen">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="/" className="flex items-center gap-3"><span className="rounded-xl bg-blue-500/15 p-2 text-blue-300"><Radar size={25}/></span><span><b className="text-lg tracking-tight">RADAR <span className="text-blue-400">OFERTAS</span></b><small className="block text-[10px] tracking-[.22em] text-slate-500">PREÇO BOM NÃO PASSA BATIDO</small></span></a>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex"><a href="#ofertas" className="hover:text-white">Ofertas</a><a href="#como-funciona" className="hover:text-white">Como funciona</a><a href="#alertas" className="hover:text-white">Meus alertas</a></nav>
        <a href="#alertas" className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"><Bell size={16}/> Criar alerta</a>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-white/5">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]"/>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_.8fr] md:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-200"><Zap size={14}/> Monitoramento inteligente de preços</div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">A oferta certa.<br/><span className="text-blue-400">Na hora certa.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Acompanhe preços, compare lojas e receba alertas quando um produto atingir o valor que você procura.</p>
          <div className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-2">
            <Search className="ml-2 text-slate-500" size={20}/><input aria-label="Buscar produto" placeholder="O que você está procurando?" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-600"/><button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold">Buscar</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400"/> Preços verificados</span><span className="flex items-center gap-1"><TrendingDown size={14} className="text-emerald-400"/> Histórico de valores</span></div>
        </div>
        <div className="hidden items-center justify-center md:flex"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-[#17243b] to-[#101727] p-6 shadow-2xl shadow-blue-950/40"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Radar de preços</span><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">AO VIVO*</span></div><div className="mt-8 text-xs text-slate-400">Seu próximo achado pode estar aqui</div><div className="mt-2 text-4xl font-black">-35%</div><div className="mt-1 text-xs text-slate-500">Exemplo ilustrativo de economia</div><div className="mt-8 flex h-24 items-end gap-2">{[35,48,39,62,52,78,57,92,72,100,82,115].map((h,i)=><div key={i} style={{height:`${h/1.2}%`}} className="flex-1 rounded-t bg-blue-500/70"/>)}</div><p className="mt-3 text-[10px] text-slate-600">*Visual demonstrativo; monitoramento real será ativado na integração das fontes.</p></div></div>
      </div>
    </section>

    <section id="ofertas" className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">Garimpo do Radar</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Ofertas em destaque</h2><p className="mt-2 text-sm text-slate-500">Produtos novos e oportunidades para acompanhar.</p></div><button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300"><SlidersHorizontal size={16}/> Filtros</button></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o)=> <article key={o.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] transition hover:-translate-y-1 hover:border-blue-400/40">
          <div className="relative flex h-52 items-center justify-center bg-white/[.03] p-5">{o.image_url ? <img src={o.image_url} alt={o.title} className="h-full w-full object-contain"/> : <div className="text-slate-600">Imagem indisponível</div>}<span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] text-slate-300">{o.category}</span></div>
          <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="min-h-12 font-semibold leading-6">{o.title}</h3><span className="rounded-lg bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">{o.is_demo ? "DEMO" : "NOVO"}</span></div>
          <p className="mt-2 text-xs text-slate-500">{o.store} · {o.seller}</p>
          <div className="mt-5"><p className="text-xs text-slate-500">{o.store === "Mercado Livre" ? "Preço anunciado" : "Preço no cartão"}</p><p className="mt-1 text-2xl font-black text-emerald-300">{money(o.price_card)}</p>{o.installments && o.installment_value && <p className="mt-1 text-xs text-slate-400">{o.installments}x de {money(o.installment_value)}</p>}</div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500"><span>Verificação: {new Date(o.verified_at).toLocaleDateString("pt-BR")}</span><a href={o.product_url} className="flex items-center gap-1 font-semibold text-blue-300 hover:text-blue-200">Ver oferta <ArrowUpRight size={14}/></a></div></div>
        </article>)}
      </div>
      {offers.every(o=>o.is_demo) && <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-5 text-amber-200/80">Modo de demonstração: os cards acima são fictícios e não representam preços disponíveis. Conecte o Supabase e fontes autorizadas para publicar ofertas reais.</p>}
    </section>

    <section id="como-funciona" className="border-y border-white/5 bg-white/[.02]"><div className="mx-auto max-w-7xl px-5 py-14"><h2 className="text-2xl font-bold">Como funciona</h2><div className="mt-7 grid gap-6 md:grid-cols-3">{[{n:"01",t:"Encontre",d:"Pesquise produtos ou explore categorias."},{n:"02",t:"Compare",d:"Confira preço no cartão, vendedor, frete e histórico."},{n:"03",t:"Seja avisado",d:"Configure alertas para não perder o preço desejado."}].map(x=><div key={x.n} className="rounded-2xl border border-white/10 bg-[#101827] p-5"><span className="text-sm font-bold text-blue-400">{x.n}</span><h3 className="mt-4 text-lg font-bold">{x.t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{x.d}</p></div>)}</div></div></section>
    <section id="alertas" className="mx-auto max-w-7xl px-5 py-14"><div className="rounded-3xl border border-blue-400/20 bg-gradient-to-r from-blue-950/70 to-[#111827] p-7 md:p-10"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Seu radar pessoal</p><h2 className="mt-2 text-2xl font-bold">Não perca a próxima oportunidade.</h2><p className="mt-2 max-w-xl text-sm text-slate-400">Crie uma conta para salvar produtos, definir preços-alvo e receber notificações.</p></div><button className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Em breve: criar conta</button></div></div></section>
    <footer className="border-t border-white/5 px-5 py-8 text-center text-xs text-slate-600">Radar Ofertas © {new Date().getFullYear()} · Projeto em desenvolvimento</footer>
  </main>;
}
