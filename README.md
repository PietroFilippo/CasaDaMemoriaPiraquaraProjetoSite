# 🏛️ Casa da Memória de Piraquara - Site Oficial

Site institucional da **Casa da Memória Manoel Alves Pereira**, dedicado à preservação e divulgação da história e cultura de Piraquara.

## Estrutura do Projeto

```
CasaDaMemóriaPiraquara/
├── index.html                  # Página principal
├── acervo.html                 # Página do acervo (fotografias e documentos)
├── programacao.html            # Página de boletins e atividades
├── admin.html                  # Painel administrativo
├── js/
│   ├── admin.js                # Lógica do painel admin
│   ├── programacao-firebase.js # Integração programacao.html
│   ├── acervo-firebase.js      # Integração acervo.html
│   ├── firebase-config.js      # Credenciais Firebase (não commitar)
│   └── firebase-config.example.js # Template de configuração
├── logo/                       # Logotipos da instituição
├── imagens_index/              # Imagens da página principal
├── README.md                   # Este arquivo
└── FIREBASE_SETUP.md           # Guia de configuração do Firebase
```

## Início Rápido

### Para Visualizar o Site

1. **Clone o repositório em um editor de texto:**
   ```bash
   git clone [url-do-repositorio]
   cd CasaDaMemoriaPiraquara
   ```

2. **Abra no navegador:**
   - Abra `index.html` em qualquer navegador moderno
   - Ou use um servidor local pelo terminal:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (npx)
     npx serve
     ```
   - Ou hospede temporariamente (sem terminal): use Netlify Drop ou Vercel (upload da pasta) e acesse a URL gerada. No Firebase, adicione o domínio em Authentication > Authorized domains.

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

### Opção 1: Hospedagem Estática + Firebase (Opção Temporária para Testes)

**Frontend (Site Público):**
- **Vercel**: Arraste a pasta para [vercel.com](https://vercel.com)
- **Netlify**: Arraste a pasta para [netlify.com](https://netlify.com)
- **GitHub Pages**: Push para GitHub e ative Pages
- **Firebase Hosting**: `firebase deploy`

**Backend (Firebase):**
- Já configurado se seguiu FIREBASE_SETUP.md
- Escalabilidade automática

### Opção 2: Hospedagem Governamental (Opção Recomendada)
- **Frontend**: Upload para servidor do governo
- **Domínio**: `.gov.br` deve ser requisitado oficialmente via [https://www.gov.br/pt-br/servicos/registrar-endereco-de-sitio-eletronico-gov.br](https://www.gov.br/pt-br/servicos/registrar-endereco-de-sitio-eletronico-gov.br) pela Prefeitura de Piraquara. Enquanto isso, o site pode operar com um domínio temporário (.org, .vercel.app, etc.) e migrar posteriormente
- **Firebase**: Continua funcionando via APIs
- **Vantagens**: Controle total, conformidade LGPD, custo zero

**Situação Específica de Piraquara:**

O município de Piraquara já possui o domínio institucional `piraquara.pr.gov.br`, utilizado pela Prefeitura Municipal. A Casa da Memória Manoel Alves Pereira poderá solicitar um subdomínio oficial (ex.: `casadamemoria.piraquara.pr.gov.br` ou `acervo.piraquara.pr.gov.br`) garantindo conformidade com o padrão adotado pelo Estado do Paraná e pelo TCE-PR.

### Opção 3: Domínio Próprio
- **Registro**: Registro.br (~R$ 40/ano para .com.br ou .org.br)
- **Hospedagem**: Netlify/Vercel (grátis) ou servidor próprio
- **DNS**: Configure CNAME/A record apontando para o serviço de hospedagem
- **Vantagens**: Identidade própria, profissionalismo, independência

⚠️ **Para instituições públicas municipais**, o uso de domínios `.pr.gov.br` é o mais adequado e recomendado pelo Tribunal de Contas do Estado do Paraná (TCE-PR). Domínios privados devem ser considerados apenas em caráter temporário.

### Recomendação de Domínio Institucional para Piraquara

**Domínio principal do município:** https://piraquara.pr.gov.br

**Subdomínios recomendados para a Casa da Memória:**
- `casadamemoria.piraquara.pr.gov.br` → site principal
- `acervo.piraquara.pr.gov.br` → instalação do Tainacan (se adotado no modelo separado)

**Como solicitar:** Contate a equipe de TI ou Comunicação da Prefeitura de Piraquara para requisitar o subdomínio oficial.

## Integração com Tainacan

O [Tainacan](https://tainacan.org) é um plugin de código aberto para WordPress utilizado por instituições culturais para gestão e difusão de acervos digitais. Pode complementar o Firebase como backend especializado em acervos.

### Quando Considerar
- Acervo grande/complexo com necessidade de catalogação profissional
- Requisitos de padrões (Dublin Core, OAI-PMH, IIIF)
- Busca avançada, taxonomias e filtros facetados
- Importação/exportação em lote e interoperabilidade com repositórios

### Modelo Híbrido - Integração API
- **Tainacan**: Gerenciamento do acervo via WordPress (backend/admin, sem página pública do Tainacan)
- **Firebase**: Boletins, atividades e autenticação do painel admin
- **Integração**: API REST do Tainacan consumida pelo front estático (acervo.html permanece, troca acervo-firebase.js por acervo-tainacan.js)
- **Resultado**: acervo.html continua funcionando igual visualmente, mas dados vêm do Tainacan
- **Admin**: Backoffices separados (Firebase para programação/boletins, Tainacan WordPress para acervo)
- **Vantagens**: Mantém layout/navegação atuais de acervo.html
- **Desvantagem**: Requer desenvolvimento de integração API

### Modelo Híbrido - Tainacan Separado
- **Tainacan**: WordPress instalado em subdomínio/subpasta (ex.: `acervo.casadamemoria.gov.br`)
- **Firebase**: Site principal (index.html, programação) permanece estático
- **Integração**: Link direto no menu "Acervo" aponta para o Tainacan (substitui acervo.html)
- **Resultado**: Página pública do Tainacan com interface própria (grid/filtros/busca facetada)
- **Admin**: Mesmo local do Tainacan (painel WordPress, apenas para o acervo)
- **Vantagens**: Zero código adicional, interface pronta, separação total de responsabilidades
- **Desvantagem**: Layout diferente de acervo.html (requer customizar tema do Tainacan para manter identidade visual)

### Comparação dos Modelos

| Aspecto | Integração API | Tainacan Separado |
|---------|---------------|-------------------|
| **Página pública** | acervo.html (layout atual) | Interface do Tainacan |
| **Esforço técnico** | Médio (desenvolvimento API) | Baixo (configuração) |
| **Manutenção** | Front + API | Tema Tainacan |
| **Identidade visual** | Mantida automaticamente | Requer customização tema |
| **Admin acervo** | Tainacan WordPress | Tainacan WordPress |

### Vantagens
- Metadados ricos e padronizados
- Preservação digital e versionamento
- Workflows editoriais e permissões
- Comunidade ativa e adequado para instituições públicas

### Hospedagem e Compatibilidade

**Hospedagem do Tainacan (Modelo Separado):**  
Recomenda-se hospedar o Tainacan sob o subdomínio governamental oficial `acervo.piraquara.pr.gov.br` (e não em domínios privados), assegurando autenticidade e preservação institucional do acervo.

**Compatibilidade Futura:**  
Ambos os modelos são compatíveis com o domínio oficial .pr.gov.br e podem ser migrados sem perda de dados quando o subdomínio governamental for obtido.

## Custos e Infraestrutura

### Plano Temporário (Gratuito)
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
- Não recomendada para agora — custo, complexidade e manutenção não se justificam frente ao Firebase (serverless, gratuito e suficiente). Torna-se viável com exigências de compliance específicas, integrações complexas, regras de negócio críticas ou escala que ultrapasse limites do Firebase.

## Segurança e Privacidade

### Segurança Técnica
- **Autenticação segura** com Firebase
- **Validação de arquivos** (tipo e tamanho)
- **Regras de segurança** no Firebase
- **Proteção contra XSS** e injection
- **HTTPS obrigatório** em produção

### LGPD e Privacidade

**Dados Coletados:**
- **Autenticação admin**: E-mail e senha dos administradores (Firebase Authentication)
- **Logs**: Firebase registra IPs de acesso e timestamps de operações (retenção: 180 dias)
- **Site público**: Não coleta dados pessoais de visitantes (sem cookies de rastreamento ou analytics)

**Tratamento de Dados:**
- Dados de admin ficam armazenados no Firebase (servidores Google, conformidade GDPR/LGPD)
- Acesso ao painel admin restrito por autenticação
- Arquivos do acervo (PDFs, imagens) são públicos por natureza institucional

**Retenção e Exclusão:**
- Logs automáticos: 180 dias (Firebase)
- Contas de admin: podem ser removidas a qualquer momento via Firebase Console
- Acervo: backup e exportação recomendados (ver seção Backup)

**Conformidade:**
- Não há necessidade de banner de cookies (site não usa cookies de rastreamento)
- Para conformidade total LGPD, recomenda-se política de privacidade acessível no rodapé

## Backup e Exportação de Dados

### Firebase (Boletins, Atividades, Acervo)

**Exportação via Firebase Console:**
1. Acesse Firebase Console → Firestore Database
2. Vá em "Import/Export" → "Export data"
3. Escolha coleções (`boletins`, `atividades`, `acervo`)
4. Exporte para Google Cloud Storage (formato JSON)
5. Baixe os arquivos JSON localmente

**Exportação via Script:**
```javascript
// Exemplo de script para exportar coleção
const admin = require('firebase-admin');
const fs = require('fs');

const db = admin.firestore();
const snapshot = await db.collection('boletins').get();
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
fs.writeFileSync('boletins-backup.json', JSON.stringify(data, null, 2));
```

**Arquivos (Storage):**
1. Firebase Console → Storage
2. Baixe pastas `boletins/` e `acervo/` manualmente
3. Ou use Firebase CLI: `firebase storage:get /path/to/folder`

### Tainacan (se adotado)

**Exportação nativa:**
1. Painel Tainacan → Coleção → Exportar
2. Formatos: CSV, JSON, XML (metadados + arquivos)
3. Download automático do pacote ZIP

**Backup WordPress:**
- Use plugin como UpdraftPlus ou All-in-One WP Migration
- Backup inclui: banco de dados MySQL + arquivos (tema, uploads)

### Restauração

**Firebase:**
- Importe JSON via Firestore Console ou script
- Faça upload de arquivos para Storage manualmente ou via CLI

**Tainacan:**
- Restaure WordPress (banco + arquivos)
- Ou reimporte coleções via CSV/JSON no Tainacan

### Frequência Recomendada
- **Mensal**: backup completo (Firestore + Storage)
- **Após eventos importantes**: backup incremental
- **Antes de atualizações**: backup preventivo

## Governança e Sustentabilidade

O projeto segue princípios de software livre, interoperabilidade e sustentabilidade digital, garantindo que a Casa da Memória possa manter seu acervo e conteúdo de forma independente e de longo prazo.

## Responsividade

O site é totalmente responsivo e testado em:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

---

**Desenvolvido para a Casa da Memória Manoel Alves Pereira - Piraquara/PR**
