# Worker de coleta

Este diretório receberá coletores por fonte. Cada coletor deve:
- priorizar APIs e feeds autorizados;
- respeitar termos, robots e limites de requisição aplicáveis;
- normalizar preço à vista e preço parcelado;
- validar vendedor, condição, variante, estoque, URL e frete;
- enviar registros ao endpoint `/api/ingest` com `x-ingestion-key`;
- evitar duplicatas por `source_key`.

Não coloque credenciais no repositório. Configure-as em variáveis de ambiente.
