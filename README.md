# Atmospherix

Mapa meteorológico interativo em Next.js, inspirado no [Windy](https://www.windy.com) e no
[Ventusky](https://www.ventusky.com): partículas de vento animadas, camadas coloridas de
temperatura e chuva, linha do tempo da previsão e previsão detalhada de qualquer ponto do mapa.

## Funcionalidades

- **Partículas de vento** animadas (via [`leaflet-velocity`](https://github.com/onaci/leaflet-velocity)).
- **Camadas de temperatura e chuva**, com interpolação bilinear e escala de cores com legenda.
- **Linha do tempo** com controle deslizante e animação das próximas 72 horas.
- **Previsão por ponto**: clique no mapa para ver condições atuais, gráfico de 48h e resumo de 7 dias.
- **Carregar esta área**: busca a grade de previsão para a região visível no mapa.
- Layout responsivo (desktop e celular).

## Stack

| Camada    | Tecnologia                                       |
| --------- | ------------------------------------------------ |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript  |
| Mapa      | Leaflet + tiles CARTO (dados OpenStreetMap)      |
| Dados     | [Open-Meteo](https://open-meteo.com) (sem chave) |
| Qualidade | ESLint, Prettier, Vitest, GitHub Actions         |

## Como rodar

Requer Node.js 20.9+ (recomendado: a versão em `.nvmrc`).

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. Nenhuma variável de ambiente é obrigatória; veja `.env.example`.

### Scripts

| Script              | O que faz                           |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento         |
| `npm run build`     | Build de produção                   |
| `npm start`         | Sobe o build de produção            |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | Checagem de tipos do TypeScript     |
| `npm test`          | Testes unitários (Vitest)           |
| `npm run format`    | Formata o código com Prettier       |
| `npm run check`     | Tudo que a CI roda (exceto o build) |

## Arquitetura

```
app/
  api/grid/route.ts    GET /api/grid   → grade de previsão (temperatura, chuva, vento u/v)
  api/point/route.ts   GET /api/point  → previsão horária de 7 dias de um ponto
  layout.tsx, page.tsx
components/            UI (mapa, controles, linha do tempo, painel do ponto)
hooks/                 Busca de dados no cliente
lib/                   Lógica pura: grade, cores, rasterização, cliente Open-Meteo
tests/                 Testes unitários
```

**Fluxo de dados**

1. O cliente chama `/api/grid` com a área visível (`north`, `south`, `west`, `east`, `size`).
2. A rota monta uma grade regular de `size × size` pontos (máx. 20 × 20) e faz **uma única**
   requisição multi-local ao Open-Meteo. A resposta fica em cache por 30 minutos.
3. A direção/velocidade do vento é convertida em componentes `u`/`v`; o cliente monta o JSON no
   formato GRIB que o `leaflet-velocity` espera.
4. Temperatura e chuva são rasterizadas num `<canvas>` com interpolação bilinear e sobrepostas ao
   mapa como imagem.

O mapa é um client component carregado com `dynamic(..., { ssr: false })`, pois o Leaflet depende
de `window`.

### API

`GET /api/grid?north=-22&south=-34&west=-58&east=-47&size=14`

Sem parâmetros, usa a região Sul do Brasil. Resposta: `{ grid, times, temperature, precipitation,
windU, windV, generatedAt }`, onde cada campo é um array por hora com `nx × ny` valores ordenados
de noroeste para sudeste.

`GET /api/point?lat=-30.03&lon=-51.23`

Previsão horária de 7 dias de um ponto (temperatura, sensação, chuva, probabilidade, vento,
rajadas, direção e código de tempo WMO).

## Roadmap

- [ ] Dados próprios a partir do GFS (NOAA) em GRIB2, processados por um job agendado
- [ ] Partículas de vento em WebGL (técnica do `webgl-wind`) para grades globais
- [ ] Mais camadas: nuvens, pressão, rajadas, umidade
- [ ] Busca de cidades e geolocalização
- [ ] Testes end-to-end com Playwright

## Dados e licenças

- Previsão: [Open-Meteo](https://open-meteo.com), gratuito para **uso não comercial**. Uso comercial
  exige plano pago. Cada ponto da grade conta como uma chamada na cota diária.
- Mapa base: © OpenStreetMap contributors, © CARTO.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de branches, commits e pull requests.
