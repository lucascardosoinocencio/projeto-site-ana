# Ana Julia Pires — Massoterapia

Landing page institucional para a massoterapeuta Ana Julia Pires, com foco em conversão via WhatsApp e apresentação de técnicas com ênfase em cuidado para lipedema.

**🔗 Site:** _adicionar link de produção após o deploy_

## Sobre o projeto

Site estático de página única (single page), sem framework e sem etapa de build para servir — HTML, CSS e JavaScript puros direto no navegador. O único passo de build do repositório é a otimização de imagens, feita localmente antes do commit.

### Seções da página

| Seção | Descrição |
|---|---|
| Hero | Apresentação com efeito de digitação e foto de destaque |
| Técnicas | Repertório de tratamentos oferecidos |
| Atendimento | Como funciona o processo, com progresso animado |
| Resultados | Carrossel de fotos de antes/depois |
| Galeria | Fotos do ambiente de atendimento |
| Depoimentos | Carrossel de avaliações de clientes |
| FAQ | Perguntas frequentes antes do agendamento |
| Contato | Chamada para ação com link direto para WhatsApp |

## Stack

- **HTML5 + CSS3 + JavaScript** vanilla, sem dependências de runtime no navegador
- **[sharp](https://sharp.pixelplumbing.com/)** — usado apenas em tempo de build para gerar as imagens responsivas

## Estrutura do repositório

```
.
├── index.html                  # Página única do site
├── favicon.svg
├── assents/                    # Imagens originais (fonte), não otimizadas
├── assets-otimizadas/          # Saída da otimização, servida pelo site
│   ├── mobile/
│   ├── tablet/
│   └── desktop/
└── scripts/
    └── optimize-images.js      # Gera as versões responsivas em .webp + .jpg
```

## Pipeline de imagens

As fotos originais ficam em `assents/`. O script `scripts/optimize-images.js` lê tudo dessa pasta e gera, para cada imagem, três larguras (mobile, tablet, desktop) em `.webp` com fallback `.jpg`, ajustando a qualidade automaticamente até atingir a meta de peso definida por categoria (hero, depoimento, galeria). O resultado vai para `assets-otimizadas/`, que é o que o `index.html` efetivamente referencia.

```bash
# Reprocessa todas as imagens
npm run optimize-images

# Reprocessa apenas arquivos cujo nome contém "depoimento"
npm run optimize-images -- depoimento
```

## Rodando localmente

Não há servidor de aplicação — qualquer servidor estático funciona:

```bash
npx serve .
```

Depois acesse `http://localhost:3000` (ou a porta indicada no terminal).

## Instalação

```bash
npm install
```

Necessário apenas para rodar o pipeline de otimização de imagens (`sharp` é a única dependência).

## Licença

Uso privado — todos os direitos reservados a Ana Julia Pires.
