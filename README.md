# Sistema de Montagem de Propostas Comerciais

Aplicativo Electron para montar propostas técnicas e comerciais de engenharia,
com exportação em PDF no formato A4. Reaproveita a base visual do Sistema de
Relatórios NR12 (mesma paleta, cabeçalho/rodapé A4 e sistema de impressão),
mas é **totalmente independente** — não altera o projeto NR12.

## Como abrir
- Dê dois cliques em **`Abrir Propostas.bat`** (instala as dependências na 1ª vez), ou
- No terminal: `npm install` e depois `npm start`.

## Funcionalidades
- Cadastro de dados do cliente e da proposta (número, data, validade).
- Seleção do tipo de serviço com escopo pré-definido e editável:
  - **NR12** — Laudo de Análise de Risco
  - **NR13** — Inspeção de Vasos de Pressão e Caldeiras
  - **Estruturas Metálicas**
  - **Pontos de Ancoragem e Linha de Vida**
  - **Outro serviço** (em branco)
- Cada serviço aceita vários e seus itens têm **checkbox** para incluir/excluir do PDF.
- Valor por serviço, desconto e **total automático**.
- Condições comerciais (prazo, pagamento, garantia, validade, observações).
- Visualização prévia em A4 e exportação em **PDF**.
- Salvar / abrir proposta em arquivo **`.proposta`**.
- Configurações da empresa (logo, dados do responsável técnico, cores, textos padrão),
  salvas localmente e aplicadas em todas as propostas.

## Estrutura
```
main.js              processo principal Electron (janela, salvar/abrir, PDF)
preload.js           ponte segura renderer <-> main
renderer/index.html  toda a interface e lógica do app
```

## Arquivos gerados
- `.proposta` — projeto editável (JSON).
- `.pdf` — proposta final para envio ao cliente.
