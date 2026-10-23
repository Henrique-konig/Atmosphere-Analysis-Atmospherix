# Atmospherix

Previsão do tempo detalhada e elegante, inspirada no app Tempo do iPhone. Abre direto na sua
localização (ou na cidade que você escolher) e mostra tudo o que importa numa tela só, no celular
ou no computador, e pode ser instalado como app.

**Acesse:** <https://atmosphere-analysis-atmospherix.vercel.app>

## Funcionalidades

- **Agora**: temperatura, condição, máxima e mínima do dia, com o fundo mudando conforme o tempo e a
  hora (dia, noite, nublado, chuva, tempestade, neblina).
- **Riscos nas próximas 48 horas**: tempestades, chuva forte, ventos fortes, calor, frio e geada,
  índice UV muito alto e neblina, estimados a partir da previsão.
- **Previsão por hora** (24 h) com nascer e pôr do sol, vento, chuva, índice UV e qualidade do ar
  de cada hora, e **previsão para 10 dias** com barras de
  temperatura coloridas.
- **Detalhes de cada dia**: toque em um dia da previsão de 10 dias para ver o gráfico de temperatura
  ao longo do dia com a chance de chuva por hora, a previsão hora a hora (com vento), chuva total,
  sensação térmica, vento e rajadas, índice UV, qualidade do ar (pior e melhor momento, nos
  próximos 5 dias), umidade, pressão e nascer/pôr do sol. Dá para trocar
  de dia pela faixa de datas, deslizando para o lado ou com as setas do teclado.
- **Mapa de precipitação** da região com a chuva prevista para as próximas 12 horas, animado (é
  previsão do modelo, não radar observado).
- **Detalhes**: índice UV, qualidade do ar (índice americano com PM2,5, PM10, ozônio e NO₂), nascer/pôr do sol com a trajetória do sol, vento com bússola, precipitação,
  sensação térmica, umidade e ponto de orvalho, visibilidade, pressão com tendência, fase da lua
  (com iluminação e próxima lua cheia) e comparação com a **média histórica** de temperatura.
- **Cidades**: busca com autocompletar e lista de cidades no estilo do Tempo do iPhone. Toda cidade
  buscada fica salva automaticamente no aparelho e aparece num cartão com hora local, condição,
  temperatura atual, máxima e mínima. "Minha localização" fica sempre no topo.
- **Instalável (PWA)**: botão "Instalar app" no Chrome, Edge e Android; no iPhone, pelo menu
  Compartilhar → "Adicionar à Tela de Início". Abre em tela cheia, com ícone próprio, e mostra a
  última previsão carregada quando está sem internet.
- **Dados ausentes** aparecem como "—", nunca como 0.

## Stack

| Camada    | Tecnologia                                         |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript    |
| Mapa      | Leaflet + Esri Dark Gray Canvas (sem chave de API) |
| Dados     | [Open-Meteo](https://open-meteo.com) (sem chave)   |
| Ícones    | Lucide                                             |
| App       | PWA: Web App Manifest + service worker próprio     |
| Qualidade | ESLint, Prettier, Vitest, GitHub Actions           |

## Como rodar

Requer Node.js 20.9+ (recomendado: a versão em `.nvmrc`).

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. Nenhuma variável de ambiente é obrigatória; veja `.env.example`.

O service worker só é registrado no build de produção (`npm run build && npm start`); em `npm run dev`
o app funciona normalmente, mas não fica instalável nem offline.

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
  api/forecast/route.ts  GET /api/forecast → previsão completa + média histórica
  api/rain/route.ts      GET /api/rain     → grade de chuva da região (mapa)
  api/geocode/route.ts   GET /api/geocode  → busca de cidades
  api/summary/route.ts   GET /api/summary  → temperatura e condição das cidades salvas
  manifest.ts            Manifesto do PWA (nome, cores, ícones)
  layout.tsx, page.tsx, icon.svg, apple-icon.png
components/              Tela, cartões, blocos de detalhe (tiles/), mapa e seletor de cidades
hooks/                   Busca de dados no cliente
public/sw.js             Service worker: cache do app e da última previsão (offline)
public/icons/            Ícones do PWA (192, 512 e maskable)
lib/                     Lógica pura: cliente Open-Meteo, riscos, lua, médias, condições, formatação
tests/                   Testes unitários
```

- `/api/forecast?lat=&lon=` faz três chamadas em paralelo ao Open-Meteo: a qualidade do ar (modelo
  CAMS, 5 dias por hora; opcional como a média), a previsão (atual, 48 h
  por hora e 10 dias) e o arquivo histórico (reanálise ERA5) dos últimos 10 anos, de onde sai a
  média de máxima e mínima para a data de hoje (±3 dias), com cache de 24 h. Se a média falhar, a previsão é entregue sem ela.
- Os riscos (`lib/risks.ts`), a fase da lua (`lib/moon.ts`) e os textos dos blocos
  (`lib/conditions.ts`) são calculados no cliente, a partir da previsão.
- Os horários são mostrados no fuso da cidade (`timezone` do Open-Meteo), não no do aparelho.
- A localização usa a API de geolocalização do navegador; o nome da cidade vem da geocodificação
  reversa gratuita da BigDataCloud. Cidades salvas ficam no `localStorage`.
- O mapa usa Leaflet com o mapa base escuro da Esri; a chuva é uma grade de 16 × 16 pontos ao redor
  da cidade, interpolada num `<canvas>`. O radar vem em blocos da RainViewer, um por quadro, todos
  carregados de antemão para a animação fluir (`lib/radar.ts`).
- O service worker (`public/sw.js`) busca sempre dados novos quando há rede e cai para a última cópia
  salva quando não há; os arquivos do build vêm do cache. Os blocos do mapa não passam por ele.

## Deploy

O app roda na [Vercel](https://vercel.com). A produção é
<https://atmosphere-analysis-atmospherix.vercel.app>, publicada a cada merge na `main`; cada pull
request ganha uma prévia própria antes do merge.

## Roadmap

- [x] Radar meteorológico observado no mapa (RainViewer)
- [ ] Alertas oficiais da Defesa Civil / INMET
- [x] Qualidade do ar
- [ ] Pólen
- [x] Instalar como app (PWA)
- [ ] Notificações de chuva

## Dados e licenças

- Código: [MIT](LICENSE) © 2026 Henrique Gustavo König.
- Previsão, busca de cidades e médias históricas: [Open-Meteo](https://open-meteo.com), gratuito para **uso não comercial**. Uso comercial
  exige plano pago. Cada ponto da grade conta como uma chamada na cota diária.
- Nomes de cidades pela localização: BigDataCloud (gratuito, sem chave).
- Radar: [RainViewer](https://www.rainviewer.com/api.html), gratuito para uso pessoal e educacional.
  Desde 2026 a API grátis só tem as últimas 2 horas (sem previsão do radar), zoom até 7 e 100
  pedidos por minuto por IP; por isso as próximas horas vêm do modelo.
- Mapa base: © Esri, HERE, Garmin, © OpenStreetMap contributors. O provedor fica em
  `lib/basemap.ts`.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de branches, commits e pull requests.
