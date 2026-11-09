import type { Offer } from "./types";

// Valores fictícios para demonstrar a interface. Não são ofertas reais.
export const demoOffers: Offer[] = [
  { id:"demo-ps5", title:"PlayStation 5 Slim — edição com leitor", category:"Games", image_url:"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800", store:"Loja demonstrativa", seller:"Venda direta (exemplo)", price_cash:3499, price_card:3699, installments:10, installment_value:369.9, shipping:null, condition:"new", product_url:"#", verified_at:new Date().toISOString(), is_demo:true },
  { id:"demo-tv", title:"Smart TV 55” 4K — exemplo de catálogo", category:"TV e vídeo", image_url:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800", store:"Loja demonstrativa", seller:"Vendedor demonstrativo", price_cash:2199, price_card:2299, installments:10, installment_value:229.9, shipping:null, condition:"new", product_url:"#", verified_at:new Date().toISOString(), is_demo:true },
  { id:"demo-notebook", title:"Notebook — exemplo de catálogo", category:"Informática", image_url:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", store:"Loja demonstrativa", seller:"Venda direta (exemplo)", price_cash:2899, price_card:2999, installments:10, installment_value:299.9, shipping:null, condition:"new", product_url:"#", verified_at:new Date().toISOString(), is_demo:true }
];
