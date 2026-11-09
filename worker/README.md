# Worker de coleta

Este diretório receberá coletores por fonte. Cada coletor deve:
- priorizar APIs e feeds autorizados;
- respeitar termos, robots e limites de requisição aplicáveis;
- normalizar preço à vista e preço parcelado;
- validar vendedor, condição, variante, estoque, URL e frete;
- enviar registros ao endpoint `/api/ingest` com `x-ingestion-key`;
- evitar duplicatas por `source_key`.

## Integração inicial Mercado Livre
A primeira integração está disponível em `POST /api/collect/mercadolivre`. Envie um JSON com `queries` (1 a 5 termos de busca) e o header `x-ingestion-key`. O backend usa `MELI_ACCESS_TOKEN` no header Bearer ao consultar `https://api.mercadolibre.com/sites/MLB/search`. A API oficial exige autenticação; não use tokens no navegador, no repositório ou em logs. O preço da API é tratado como preço anunciado, não como preço no cartão. O token é temporário; até existir renovação OAuth automática, será necessário atualizá-lo quando expirar.

Não coloque credenciais no repositório. Configure-as em variáveis de ambiente.
