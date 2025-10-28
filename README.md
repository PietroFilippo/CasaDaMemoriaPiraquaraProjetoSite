# 🏛️ Casa da Memória de Piraquara - Site Oficial

Site institucional da **Casa da Memória Manoel Alves Pereira**, dedicado à preservação e divulgação da história e cultura de Piraquara.

## Estrutura do Projeto

```
piraquara/
├── index.html                  # Página principal
├── acervo.html                 # Página do acervo (fotografias e documentos)
├── programacao.html            # Página de boletins e atividades
├── admin.html                  # Painel administrativo
├── js/
│   ├── admin.js                # Lógica do painel admin
│   ├── programacao-firebase.js # Integração programacao.html
│   ├── acervo-firebase.js      # Integração acervo.html
├── README.md                   # Este arquivo
├── FIREBASE_SETUP.md           # Configuração do Firebase
```

## Início Rápido

### Para Visualizar o Site

1. **Clone o repositório em um editor de texto:**
   ```bash
   git clone [url-do-repositorio]
   cd piraquara
   ```

2. **Abra no navegador:**
   - Abra `index.html` em qualquer navegador moderno
   - Ou use um servidor local:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (npx)
     npx serve
     ```

3. **Navegue pelo site:**
   - **Página Principal** → Informações institucionais
   - **Programação** → Boletins e atividades
   - **Acervo** → Fotografias e documentos

### Para Administradores

1. **Configure o Firebase** (apenas primeira vez):
   - Siga o guia completo em **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**
   - Copie `js/firebase-config.example.js` para `js/firebase-config.js`
   - Preencha suas credenciais do Firebase
   - Tempo estimado: 10-15 minutos

2. **Acesse o painel:**
   - Abra `admin.html` no navegador
   - Faça login com suas credenciais
   - Comece a adicionar conteúdo

> **⚠️ Importante**: O arquivo `js/firebase-config.js` contém credenciais sensíveis e não deve ser aberto ao público.

## Características do Site

### Design e UX
- **Design moderno e responsivo** (mobile-first)
- **Paleta de cores Cultural e Local** (tons escuros e elegantes)
- **Tipografia Clarendon Text** (elegante e histórica)
- **Animações suaves** com hover effects

### Paleta de Cores - Cultural & Local

O site utiliza uma paleta de cores que conecta com a natureza e cultura regional de Piraquara, que tem forte relação com a Serra e recursos naturais:

| Cor | Hex | Uso |
|----|-----|-----|
| **Verde Profundo** | `#1A2E1A` | Cores principais, botões, destaques |
| **Areia Suave** | `#D4C4A8` | Fundos suaves, elementos neutros |
| **Verde Musgo Escuro** | `#2D3A2A` | Elementos secundários, ícones |
| **Cinza Verde Escuro** | `#2A3A2E` | Textos secundários, bordas |
| **Preto Suave** | `#1A1A1A` | Textos principais, títulos |

### Tipografia
- **Fonte Principal**: Clarendon Text (Google Fonts)
- **Estilo**: Serifada elegante e histórica
- **Pesos**: Regular (400) e Bold (700)
- **Características**: Legível, sofisticada, adequada para instituições culturais

### Funcionalidades Técnicas
- **Lazy loading** de imagens
- **Lightbox** para visualização ampliada
- **Paginação dinâmica** (carregar mais)
- **Sistema de filtros** interativos
- **Mapa interativo** com Leaflet
- **Campos condicionais** no painel administrativo
- **Edição inline** com substituição de arquivos
- **Seleção múltipla** para operações em lote
- **PWA-ready** (pode ser instalado como app)

## Páginas e Funcionalidades

### 🏠 Página Principal (`index.html`)
- Informações institucionais completas
- Histórico do edifício (1925-1928)
- Missão e valores (4 pilares)
- Galeria de imagens
- Horários de funcionamento
- **Mapa interativo** com localização
- Contatos: (41) 3590-3605

### 📰 Página de Programação (`programacao.html`)
- **Boletins da Memória**: Download de PDFs
- **Atividades e Eventos**: Sistema de filtros e cards visuais
- Modal com detalhes completos
- Informações: data, horário, local, classificação, custo de entrada
- Exibição de valores: atividades gratuitas ou com preço definido

### 📚 Página de Acervo (`acervo.html`)
- Arquivo fotográfico com filtros por categoria
- Documentos históricos organizados
- Sistema de paginação (carregar mais)
- Lightbox para visualização ampliada

### 🎛️ Painel Administrativo (`admin.html`)
- **Login seguro** com Firebase Authentication
- Interface com 3 abas (Boletins, Atividades, Acervo)
- Upload de PDFs com barra de progresso
- Formulários intuitivos para cada tipo de conteúdo
- Campo de custo de entrada para atividades (gratuita/paga)
- Edição completa de itens existentes
- Substituição de arquivos sem deletar itens
- Seleção múltipla e exclusão em lote
- Visualização e exclusão de itens cadastrados

## Tecnologias

### Frontend
- **HTML5** - Estrutura
- **Tailwind CSS** (via CDN) - Estilização
- **JavaScript Vanilla** - Interatividade
- **PDF.js** - Visualização de PDFs
- **Leaflet** - Mapas interativos

### Backend
- **Firebase Authentication** - Sistema de login
- **Firebase Firestore** - Banco de dados
- **Firebase Storage** - Armazenamento de arquivos

## Deploy e Hospedagem

### Opção 1: Hospedagem Estática + Firebase (Recomendado)

**Frontend (Site Público):**
- **Vercel**: Arraste a pasta para [vercel.com](https://vercel.com)
- **Netlify**: Arraste a pasta para [netlify.com](https://netlify.com)
- **GitHub Pages**: Push para GitHub e ative Pages
- **Firebase Hosting**: `firebase deploy`

**Backend (Firebase):**
- Já configurado se seguiu FIREBASE_SETUP.md
- Escalabilidade automática

### Opção 2: Hospedagem Governamental
- **Frontend**: Upload para servidor do governo
- **Domínio**: `.gov.br` (geralmente gratuito)
- **Firebase**: Continua funcionando via APIs
- **Vantagens**: Controle total, conformidade LGPD, custo zero

## Custos e Infraestrutura

### Plano Atual (Gratuito)
- **Frontend**: R$ 0/mês (Vercel/Netlify/GitHub Pages)
- **Backend (Firebase)**: R$ 0/mês
  - Authentication: Gratuito (usuários ilimitados)
  - Firestore: Gratuito até 50.000 leituras/dia
  - Storage: Gratuito até 5GB

### Hospedagem Governamental (Geralmente Gratuito)
- **Frontend**: R$ 0/mês (servidor do governo)
- **Backend (Firebase)**: R$ 0/mês
- **Total**: R$ 0/mês

### Backend Próprio (Alternativa)
- **Custos**: R$ 450-1200/mês
- **Desenvolvimento**: Semanas de trabalho
- **Manutenção**: Equipe técnica dedicada

## Segurança
- **Autenticação segura** com Firebase
- **Validação de arquivos** (tipo e tamanho)
- **Regras de segurança** no Firebase
- **Proteção contra XSS** e injection
- **HTTPS obrigatório** em produção

## Responsividade
O site é totalmente responsivo e testado em:
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

---