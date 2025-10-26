# Configuração do Firebase - Sistema de Administração

Este guia explica passo a passo como configurar o Firebase para o sistema administrativo da Casa da Memória.

---

## 📋 Índice

1. [Por que Firebase?](#por-que-firebase)
2. [Criando o Projeto](#criando-o-projeto)
3. [Configurando Authentication](#configurando-authentication)
4. [Configurando Firestore](#configurando-firestore)
5. [Configurando Storage](#configurando-storage)
6. [Integrando ao Site](#integrando-ao-site)
7. [Criando o Primeiro Usuário](#criando-o-primeiro-usuário)
8. [Segurança e Regras](#segurança-e-regras)
9. [Custos e Limites](#custos-e-limites)
10. [Solução de Problemas](#solução-de-problemas)

---

## Por que Firebase?

### Vantagens
- **Gratuito** até 10GB de armazenamento
- **Sem servidor** - não precisa de backend
- **Autenticação pronta** - sistema de login integrado
- **Real-time** - atualizações automáticas
- **Fácil de usar** - documentação excelente
- **Escalável** - cresce conforme necessidade

### Ideal para
- Projetos pequenos e médios
- Equipes sem desenvolvedor backend
- Prototipagem rápida
- Órgãos públicos com orçamento limitado

---

## Criando o Projeto

### Passo 1: Criar Conta Google
Se ainda não tem, crie uma conta Google em [google.com](https://accounts.google.com/signup)

### Passo 2: Acessar Firebase Console
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** ou **"Create a project"**

### Passo 3: Configurar o Projeto
1. **Nome do projeto:** `casa-memoria-piraquara`
2. **Google Analytics:** Pode desabilitar (opcional para este projeto)
3. Clique em **"Criar projeto"**

![Criar Projeto Firebase](https://via.placeholder.com/800x200/8B5CF6/FFFFFF?text=Firebase+Console+%E2%86%92+Adicionar+projeto)

---

## 🔐 Configurando Authentication

### Passo 1: Ativar Authentication
1. No menu lateral, clique em **"Authentication"** (ou **"Autenticação"**)
2. Clique em **"Get started"** (ou **"Começar"**)

### Passo 2: Habilitar Email/Password
1. Vá na aba **"Sign-in method"** (ou **"Método de login"**)
2. Clique em **"Email/Password"**
3. Ative a primeira opção **"Email/Password"**
4. Clique em **"Save"** (ou **"Salvar"**)

![Authentication](https://via.placeholder.com/800x200/10B981/FFFFFF?text=Authentication+%E2%86%92+Email%2FPassword)

---

## 📦 Configurando Firestore

### Passo 1: Criar Banco de Dados
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Create database"** (ou **"Criar banco de dados"**)

### Passo 2: Escolher Modo
1. Selecione **"Start in test mode"** (por enquanto)
   - Vamos configurar regras de segurança depois
2. Clique em **"Next"**

### Passo 3: Escolher Localização
1. Escolha **"southamerica-east1"** (São Paulo, Brasil)
   - Isso reduz latência para usuários no Brasil
2. Clique em **"Enable"**

### Passo 4: Estrutura das Coleções
O Firebase criará automaticamente quando você adicionar o primeiro item.  
Estrutura que será criada:

```
firestore/
├── boletins/
│   └── {id-auto}/
│       ├── titulo: "Janeiro 2024"
│       ├── edicao: "Edição nº 1"
│       ├── descricao: "..."
│       ├── pdfUrl: "https://..."
│       ├── fileName: "boletins/123_arquivo.pdf"
│       └── createdAt: "2025-01-15T..."
│
├── atividades/
│   └── {id-auto}/
│       ├── titulo: "Ação Educativa"
│       ├── tipo: "educativa"
│       ├── status: "proximas"
│       ├── data: "22/09"
│       ├── horario: "09:00 às 17:00"
│       └── ...
│
└── acervo/
    └── {id-auto}/
        ├── tipo: "fotografia"
        ├── titulo: "Vista da Praça"
        ├── descricao: "..."
        ├── categoria: "arquitetura"
        ├── ano: "1980"
        ├── url: "https://..."
        └── ...
```

---

## 📁 Configurando Storage

### Passo 1: Ativar Storage
1. No menu lateral, clique em **"Storage"**
2. Clique em **"Get started"** (ou **"Começar"**)
3. Clique em **"Next"** (mantém modo teste)
4. Escolha **"southamerica-east1"** (São Paulo)
5. Clique em **"Done"**

### Passo 2: Estrutura de Pastas
O sistema criará automaticamente:

```
storage/
├── boletins/
│   ├── 1234567890_boletim-01-2024.pdf
│   └── 1234567891_boletim-02-2024.pdf
│
└── acervo/
    ├── fotografia/
    │   ├── 1234567890_foto1.jpg
    │   └── 1234567891_foto2.jpg
    └── documento/
        ├── 1234567892_doc1.pdf
        └── 1234567893_doc2.jpg
```

---

## 🔗 Integrando ao Site

### Passo 1: Obter Configurações
1. No Firebase Console, clique no **ícone de engrenagem** ⚙️ (canto superior esquerdo)
2. Clique em **"Project settings"** (ou **"Configurações do projeto"**)
3. Role até a seção **"Your apps"** (ou **"Seus apps"**) e clique em **"Adicionar Aplicativo"**
4. Clique no ícone **</>** (Web app)
5. Dê um nome: `Casa da Memória - Admin`
6. **NÃO** marque Firebase Hosting
7. Clique em **"Register app"** (ou **"Registrar app"**)

### Passo 2: Copiar Configuração
Você verá um código assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...exemplo...123abc",
  authDomain: "casa-memoria-piraquara.firebaseapp.com",
  projectId: "casa-memoria-piraquara",
  storageBucket: "casa-memoria-piraquara.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### Passo 3: Configurar Credenciais
1. **Copie o arquivo de exemplo e crie o arquivo onde ficara as credenciais :**
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   ```

2. **Abra `js/firebase-config.js` e substitua os valores:**
   ```javascript
   window.firebaseConfig = {
       apiKey: "AIzaSyD...exemplo...123abc",  // ← COLE AQUI
       authDomain: "casa-memoria-piraquara.firebaseapp.com",  // ← COLE AQUI
       projectId: "casa-memoria-piraquara",  // ← COLE AQUI
       storageBucket: "casa-memoria-piraquara.appspot.com",  // ← COLE AQUI
       messagingSenderId: "123456789012",  // ← COLE AQUI
       appId: "1:123456789012:web:abc123def456"  // ← COLE AQUI
   };
   ```

3. **⚠️ IMPORTANTE**: O arquivo `js/firebase-config.js` contém credenciais sensíveis e **NÃO** deve ser aberto ao público.

### Passo 4: Verificar Configuração
1. Abra `admin.html` no navegador
2. Se tudo estiver correto, você verá a tela de login
3. Se houver erro, verifique o console do navegador (F12)

---

## 👤 Criando o Primeiro Usuário

### Passo 1: Adicionar Usuário Manualmente
1. No Firebase Console, vá em **"Authentication"**
2. Clique na aba **"Users"** (ou **"Usuários"**)
3. Clique em **"Add user"** (ou **"Adicionar usuário"**)
4. Preencha:
   - **Email:** `admin@casadamemoria.gov.br` (ou outro)
   - **Password:** Crie uma senha forte (mínimo 6 caracteres)
5. Clique em **"Add user"**

### Passo 2: Fazer Login
1. Abra `admin.html` no navegador
2. Use o email e senha criados
3. Você estará logado!

---

## 🔒 Segurança e Regras

### ⚠️ IMPORTANTE: Configurar Regras de Segurança

Por padrão, o Firebase está em "modo teste" que **permite acesso público**.  
Você DEVE configurar regras de segurança.

### Firestore Rules

1. No Firebase Console, vá em **"Firestore Database"**
2. Clique na aba **"Rules"** (ou **"Regras"**)
3. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem ler
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

4. Clique em **"Publish"** (ou **"Publicar"**)

### Storage Rules

1. No Firebase Console, vá em **"Storage"**
2. Clique na aba **"Rules"** (ou **"Regras"**)
3. Substitua o conteúdo por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Apenas usuários autenticados podem fazer upload
    match /{allPaths=**} {
      allow read: if true;  // Público pode ver
      allow write: if request.auth != null;  // Apenas autenticados podem adicionar/deletar
    }
  }
}
```

4. Clique em **"Publish"** (ou **"Publicar"**)

### Explicação das Regras

**Firestore:**
- `allow read: if request.auth != null` → Apenas usuários logados podem ler dados
- `allow write: if request.auth != null` → Apenas usuários logados podem escrever

**Storage:**
- `allow read: if true` → Qualquer pessoa pode ver arquivos (necessário para o site público)
- `allow write: if request.auth != null` → Apenas usuários logados podem fazer upload

---

## Custos e Limites

### Plano Spark (Gratuito)

| Recurso | Limite Gratuito | Custo Adicional |
|---------|----------------|-----------------|
| **Firestore** | | |
| Leituras | 50.000/dia | $0.06 por 100.000 |
| Gravações | 20.000/dia | $0.18 por 100.000 |
| Armazenamento | 1 GB | $0.18/GB/mês |
| **Storage** | | |
| Armazenamento | 5 GB | $0.026/GB/mês |
| Download | 1 GB/dia | $0.12/GB |
| **Authentication** | | |
| Usuários | Ilimitado | Grátis |

### Estimativa para Casa da Memória

**Cenário:** 500 visitantes/dia

```
Leituras (visitante carrega 10 items): 5.000/dia = 150.000/mês
Gravações (admin adiciona 3 items/dia): 90/mês
Storage: ~2GB (100 PDFs + 200 fotos)
Download: ~10GB/mês

Total: R$ 0/mês (dentro do plano gratuito)
```

### Quando Pagar?
Você só paga se ultrapassar os limites gratuitos.  
Para um site municipal pequeno/médio, **dificilmente** vai precisar pagar.

---

## Solução de Problemas

### Erro: "Permission denied"
**Causa:** Regras de segurança bloqueando acesso  
**Solução:** Verifique as regras no Console Firebase

### Erro: "Firebase not initialized"
**Causa:** Credenciais incorretas no `admin.html`  
**Solução:** Copie novamente as credenciais do Firebase Console

### Upload não funciona
**Causa:** Storage não configurado ou regras muito restritivas  
**Solução:** Ative o Storage e configure as regras

### Login não funciona
**Causa:** Authentication não habilitado ou usuário não existe  
**Solução:** 
1. Verifique se Email/Password está ativo em Authentication
2. Crie um usuário em Authentication > Users

### Dados não aparecem no site
**Causa:** Páginas ainda não integradas ao Firebase  
**Solução:** Veja `INTEGRACAO_FIREBASE.md` para integrar as páginas

---

## Segurança e Boas Práticas

### Arquivos de Configuração
- **`js/firebase-config.js`**: Contém credenciais reais - **NÃO** deixe visivel ao público
- **`js/firebase-config.example.js`**: Template para criação de firebase-config.js
- **`.gitignore`**: Já configurado para ignorar `js/firebase-config.js`

### Para Deploy em Produção
1. **Copie** `js/firebase-config.example.js` para `js/firebase-config.js`
2. **Preencha** com suas credenciais do Firebase
3. **Nunca** commite o arquivo com credenciais reais
4. **Configure** as regras de segurança no Firebase Console

### Backup das Credenciais
- **Salve** suas credenciais em local seguro
- **Documente** qual projeto Firebase está sendo usado
- **Mantenha** o arquivo `firebase-config.example.js` atualizado