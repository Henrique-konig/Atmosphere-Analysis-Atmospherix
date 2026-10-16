# Contribuindo

## Fluxo de branches

O projeto segue um Git Flow simplificado:

| Branch              | Uso                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------- |
| `main`              | Produção. Sempre estável e implantável. Só recebe merges de `develop` ou de `hotfix/*`. |
| `develop`           | Integração. Base para novas funcionalidades.                                            |
| `feature/*`         | Nova funcionalidade, criada a partir de `develop` (ex.: `feature/camada-nuvens`).       |
| `fix/*`             | Correção não urgente, a partir de `develop`.                                            |
| `hotfix/*`          | Correção urgente em produção, a partir de `main`; volta para `main` e `develop`.        |
| `chore/*`, `docs/*` | Manutenção, dependências e documentação.                                                |

Toda mudança entra por **pull request**, com a CI verde e pelo menos uma revisão. Proteja `main`
e `develop` em _Settings → Branches_ exigindo o check **CI**.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
feat(map): adiciona camada de nuvens
fix(api): trata resposta vazia do Open-Meteo
docs: explica variáveis de ambiente
chore(deps): atualiza next para 16.x
```

Tipos comuns: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`.

## Antes de abrir o PR

```bash
npm run check   # formatação, lint, tipos e testes
npm run build
```

- Adicione testes em `tests/` para lógica nova em `lib/`.
- Anexe capturas de tela para mudanças visuais.
- Mantenha o PR focado em uma única mudança.
