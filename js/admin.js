// admin.js - Lógica do Painel Administrativo

// === AUTENTICAÇÃO ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        await window.firebaseModules.signInWithEmailAndPassword(window.auth, email, password);
        errorDiv.classList.add('hidden');
    } catch (error) {
        errorDiv.textContent = 'Email ou senha incorretos. Tente novamente.';
        errorDiv.classList.remove('hidden');
    }
});

function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.firebaseModules.signOut(window.auth);
    }
}

// === NAVEGAÇÃO ENTRE TABS ===
function showTab(tabName) {
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    // Adicionar active no botão clicado
    event.target.classList.add('tab-active');
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    
    // Esconder todas as seções
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    document.getElementById(`section-${tabName}`).classList.add('active');
}

window.showTab = showTab;

// === BOLETINS ===
document.getElementById('form-boletim').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titulo = document.getElementById('boletim-titulo').value;
    const edicao = document.getElementById('boletim-edicao').value;
    const data = document.getElementById('boletim-data').value;
    const descricao = document.getElementById('boletim-descricao').value;
    const pdfFile = document.getElementById('boletim-pdf').files[0];
    
    if (!pdfFile) {
        alert('Selecione um arquivo PDF');
        return;
    }
    
    if (pdfFile.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
    }
    
    try {
        // Upload do PDF
        const fileName = `boletins/${Date.now()}_${pdfFile.name}`;
        const storageRef = window.firebaseModules.ref(window.storage, fileName);
        const uploadTask = window.firebaseModules.uploadBytesResumable(storageRef, pdfFile);
        
        // Mostrar progresso
        document.getElementById('boletim-progress').classList.remove('hidden');
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('boletim-progress-bar').style.width = progress + '%';
                document.getElementById('boletim-progress-text').textContent = Math.round(progress) + '%';
            },
            (error) => {
                alert('Erro no upload: ' + error.message);
                document.getElementById('boletim-progress').classList.add('hidden');
            },
            async () => {
                // Upload completo
                const downloadURL = await window.firebaseModules.getDownloadURL(uploadTask.snapshot.ref);
                
                // Salvar no Firestore
                await window.firebaseModules.addDoc(
                    window.firebaseModules.collection(window.db, 'boletins'),
                    {
                        titulo,
                        edicao,
                        data,
                        descricao,
                        pdfUrl: downloadURL,
                        fileName,
                        createdAt: new Date().toISOString()
                    }
                );
                
                alert('Boletim publicado com sucesso!');
                document.getElementById('form-boletim').reset();
                document.getElementById('boletim-progress').classList.add('hidden');
                loadBoletins();
            }
        );
    } catch (error) {
        alert('Erro ao publicar boletim: ' + error.message);
        document.getElementById('boletim-progress').classList.add('hidden');
    }
});

async function loadBoletins() {
    const listDiv = document.getElementById('boletins-list');
    listDiv.innerHTML = '<p class="text-gray-500">Carregando...</p>';
    
    try {
        const q = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'boletins'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        const snapshot = await window.firebaseModules.getDocs(q);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-500">Nenhum boletim cadastrado</p>';
            return;
        }
        
        listDiv.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'boletim-item border border-gray-200 rounded-lg p-4 flex items-center justify-between';
            item.innerHTML = `
                <div>
                    <h4 class="boletim-titulo font-bold text-gray-800">${data.titulo}</h4>
                    <p class="text-sm text-gray-600">${data.edicao}</p>
                    ${data.data ? `<p class="boletim-data text-sm text-cinza-verde font-semibold mt-1">📅 ${data.data}</p>` : ''}
                    <p class="text-xs text-gray-500 mt-1">Criado em: ${new Date(data.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="flex gap-2">
                    <a href="${data.pdfUrl}" target="_blank" class="bg-cinza-verde text-white px-4 py-2 rounded-lg text-sm hover:bg-verde-musgo">
                        Ver PDF
                    </a>
                    <button onclick="deleteBoletim('${doc.id}', '${data.fileName}')" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                        Excluir
                    </button>
                </div>
            `;
            listDiv.appendChild(item);
        });
    } catch (error) {
        listDiv.innerHTML = '<p class="text-red-500">Erro ao carregar boletins</p>';
    }
}

async function deleteBoletim(docId, fileName) {
    if (!confirm('Deseja realmente excluir este boletim?')) return;
    
    try {
        // Deletar arquivo do Storage
        const storageRef = window.firebaseModules.ref(window.storage, fileName);
        await window.firebaseModules.deleteObject(storageRef);
        
        // Deletar do Firestore
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'boletins', docId));
        
        alert('Boletim excluído com sucesso!');
        loadBoletins();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

window.deleteBoletim = deleteBoletim;

// === ATIVIDADES ===
document.getElementById('form-atividade').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('ativ-tipo').value;
    const gradientes = {
        'educativa': 'from-roxo to-azul',
        'oficina': 'from-verde to-amarelo',
        'exposicao': 'from-azul to-roxo',
        'palestra': 'from-amarelo to-verde',
        'roda-conversa': 'from-verde to-azul'
    };
    
    const emojis = {
        'educativa': '📚',
        'oficina': '🎨',
        'exposicao': '🖼️',
        'palestra': '🎤',
        'roda-conversa': '📖'
    };
    
    const atividade = {
        titulo: document.getElementById('ativ-titulo').value,
        tipo: tipo,
        tipoLabel: document.getElementById('ativ-tipo').selectedOptions[0].text,
        status: document.getElementById('ativ-status').value,
        data: document.getElementById('ativ-data').value,
        horario: document.getElementById('ativ-horario').value,
        descricaoCurta: document.getElementById('ativ-descricao-curta').value,
        descricaoCompleta: document.getElementById('ativ-descricao-completa').value,
        local: document.getElementById('ativ-local').value,
        classificacao: document.getElementById('ativ-classificacao').value,
        gradiente: gradientes[tipo] || 'from-roxo to-azul',
        emoji: emojis[tipo] || '📅',
        createdAt: new Date().toISOString()
    };
    
    try {
        await window.firebaseModules.addDoc(
            window.firebaseModules.collection(window.db, 'atividades'),
            atividade
        );
        
        alert('Atividade publicada com sucesso!');
        document.getElementById('form-atividade').reset();
        loadAtividades();
    } catch (error) {
        alert('Erro ao publicar atividade: ' + error.message);
    }
});

async function loadAtividades() {
    const listDiv = document.getElementById('atividades-list');
    listDiv.innerHTML = '<p class="text-gray-500">Carregando...</p>';
    
    try {
        const q = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'atividades'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        const snapshot = await window.firebaseModules.getDocs(q);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-500">Nenhuma atividade cadastrada</p>';
            return;
        }
        
        listDiv.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'atividade-item border border-gray-200 rounded-lg p-4';
            item.innerHTML = `
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">${data.emoji}</span>
                            <h4 class="atividade-titulo font-bold text-gray-800">${data.titulo}</h4>
                        </div>
                        <p class="text-sm text-gray-600 mb-1"><strong>Tipo:</strong> ${data.tipoLabel}</p>
                        <p class="text-sm text-gray-600 mb-1"><strong>Data:</strong> <span class="atividade-data">${data.data}</span> | ${data.horario}</p>
                        <p class="text-sm text-gray-600"><strong>Status:</strong> ${data.status === 'proximas' ? 'Próxima' : 'Realizada'}</p>
                    </div>
                    <button onclick="deleteAtividade('${doc.id}')" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                        Excluir
                    </button>
                </div>
            `;
            listDiv.appendChild(item);
        });
    } catch (error) {
        listDiv.innerHTML = '<p class="text-red-500">Erro ao carregar atividades</p>';
    }
}

async function deleteAtividade(docId) {
    if (!confirm('Deseja realmente excluir esta atividade?')) return;
    
    try {
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'atividades', docId));
        alert('Atividade excluída com sucesso!');
        loadAtividades();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

window.deleteAtividade = deleteAtividade;

// === ACERVO ===
document.getElementById('form-acervo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('acervo-tipo').value;
    const titulo = document.getElementById('acervo-titulo').value;
    const descricao = document.getElementById('acervo-descricao').value;
    const categoria = document.getElementById('acervo-categoria').value;
    const ano = document.getElementById('acervo-ano').value;
    const arquivo = document.getElementById('acervo-arquivo').files[0];
    
    if (!arquivo) {
        alert('Selecione um arquivo');
        return;
    }
    
    if (arquivo.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
    }
    
    try {
        // Upload do arquivo
        const fileName = `acervo/${tipo}/${Date.now()}_${arquivo.name}`;
        const storageRef = window.firebaseModules.ref(window.storage, fileName);
        const uploadTask = window.firebaseModules.uploadBytesResumable(storageRef, arquivo);
        
        // Mostrar progresso
        document.getElementById('acervo-progress').classList.remove('hidden');
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('acervo-progress-bar').style.width = progress + '%';
                document.getElementById('acervo-progress-text').textContent = Math.round(progress) + '%';
            },
            (error) => {
                alert('Erro no upload: ' + error.message);
                document.getElementById('acervo-progress').classList.add('hidden');
            },
            async () => {
                // Upload completo
                const downloadURL = await window.firebaseModules.getDownloadURL(uploadTask.snapshot.ref);
                
                // Salvar no Firestore
                await window.firebaseModules.addDoc(
                    window.firebaseModules.collection(window.db, 'acervo'),
                    {
                        tipo,
                        titulo,
                        descricao,
                        categoria,
                        ano,
                        url: downloadURL,
                        fileName,
                        createdAt: new Date().toISOString()
                    }
                );
                
                alert('Item adicionado ao acervo com sucesso!');
                document.getElementById('form-acervo').reset();
                document.getElementById('acervo-progress').classList.add('hidden');
                loadAcervo();
            }
        );
    } catch (error) {
        alert('Erro ao adicionar ao acervo: ' + error.message);
        document.getElementById('acervo-progress').classList.add('hidden');
    }
});

let acervoData = [];

async function loadAcervo() {
    const listDiv = document.getElementById('acervo-list');
    listDiv.innerHTML = '<p class="text-gray-500">Carregando...</p>';
    
    try {
        const q = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'acervo'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        const snapshot = await window.firebaseModules.getDocs(q);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-500">Nenhum item no acervo</p>';
            acervoData = [];
            return;
        }
        
        acervoData = [];
        snapshot.forEach((doc) => {
            acervoData.push({ id: doc.id, ...doc.data() });
        });
        
        displayAcervo(acervoData);
    } catch (error) {
        listDiv.innerHTML = '<p class="text-red-500">Erro ao carregar acervo</p>';
    }
}

function displayAcervo(items) {
    const listDiv = document.getElementById('acervo-list');
    
    if (items.length === 0) {
        listDiv.innerHTML = '<p class="text-gray-500">Nenhum item encontrado</p>';
        return;
    }
    
    listDiv.innerHTML = '';
    items.forEach((data) => {
        const item = document.createElement('div');
        item.className = 'acervo-item border border-gray-200 rounded-lg p-4 flex items-center justify-between';
        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    ${data.url.endsWith('.pdf') ? 
                        '<span class="text-3xl">📄</span>' :
                        `<img src="${data.url}" alt="${data.titulo}" class="w-full h-full object-cover">`
                    }
                </div>
                <div>
                    <h4 class="acervo-titulo font-bold text-gray-800">${data.titulo}</h4>
                    <p class="text-sm text-gray-600">Tipo: ${data.tipo === 'fotografia' ? 'Fotografia' : 'Documento'} | Categoria: ${data.categoria}</p>
                    <p class="text-xs text-gray-500 mt-1"><span class="acervo-ano">${data.ano ? data.ano : ''}</span> | ${new Date(data.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <a href="${data.url}" target="_blank" class="bg-cinza-verde text-white px-4 py-2 rounded-lg text-sm hover:bg-verde-musgo">
                    Ver
                </a>
                <button onclick="deleteAcervo('${data.id}', '${data.fileName}')" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                    Excluir
                </button>
            </div>
        `;
        listDiv.appendChild(item);
    });
}

function filterAcervo(filter) {
    // Atualizar botões
    document.querySelectorAll('.filter-acervo').forEach(btn => {
        btn.classList.remove('active', 'bg-verde-cultural', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    event.target.classList.add('active', 'bg-verde-cultural', 'text-white');
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    
    // Filtrar dados
    if (filter === 'todos') {
        displayAcervo(acervoData);
    } else {
        const filtered = acervoData.filter(item => item.tipo === filter);
        displayAcervo(filtered);
    }
}

window.filterAcervo = filterAcervo;

async function deleteAcervo(docId, fileName) {
    if (!confirm('Deseja realmente excluir este item?')) return;
    
    try {
        // Deletar arquivo do Storage
        const storageRef = window.firebaseModules.ref(window.storage, fileName);
        await window.firebaseModules.deleteObject(storageRef);
        
        // Deletar do Firestore
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'acervo', docId));
        
        alert('Item excluído com sucesso!');
        loadAcervo();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

window.deleteAcervo = deleteAcervo;

// === CARREGAR TODOS OS DADOS ===
function loadAllData() {
    loadBoletins();
    loadAtividades();
    loadAcervo();
}

// === FUNÇÕES DE BUSCA ===

// Busca de Boletins
function searchBoletins() {
    const searchTerm = document.getElementById('boletim-search').value.toLowerCase();
    const dateTerm = document.getElementById('boletim-date-search').value.toLowerCase();
    
    const boletinsList = document.getElementById('boletins-list');
    const items = boletinsList.querySelectorAll('.boletim-item');
    
    items.forEach(item => {
        const titulo = item.querySelector('.boletim-titulo')?.textContent.toLowerCase() || '';
        const data = item.querySelector('.boletim-data')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || titulo.includes(searchTerm);
        const matchesDate = !dateTerm || data.includes(dateTerm);
        
        if (matchesSearch && matchesDate) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearBoletimSearch() {
    document.getElementById('boletim-search').value = '';
    document.getElementById('boletim-date-search').value = '';
    
    const boletinsList = document.getElementById('boletins-list');
    const items = boletinsList.querySelectorAll('.boletim-item');
    items.forEach(item => item.style.display = 'block');
}

// Busca de Atividades
function searchAtividades() {
    const searchTerm = document.getElementById('atividade-search').value.toLowerCase();
    const dateTerm = document.getElementById('atividade-date-search').value.toLowerCase();
    
    const atividadesList = document.getElementById('atividades-list');
    const items = atividadesList.querySelectorAll('.atividade-item');
    
    items.forEach(item => {
        const titulo = item.querySelector('.atividade-titulo')?.textContent.toLowerCase() || '';
        const data = item.querySelector('.atividade-data')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || titulo.includes(searchTerm);
        const matchesDate = !dateTerm || data.includes(dateTerm);
        
        if (matchesSearch && matchesDate) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearAtividadeSearch() {
    document.getElementById('atividade-search').value = '';
    document.getElementById('atividade-date-search').value = '';
    
    const atividadesList = document.getElementById('atividades-list');
    const items = atividadesList.querySelectorAll('.atividade-item');
    items.forEach(item => item.style.display = 'block');
}

// Busca de Acervo
function searchAcervo() {
    const searchTerm = document.getElementById('acervo-search').value.toLowerCase();
    const yearTerm = document.getElementById('acervo-year-search').value.toLowerCase();
    
    const acervoList = document.getElementById('acervo-list');
    const items = acervoList.querySelectorAll('.acervo-item');
    
    items.forEach(item => {
        const titulo = item.querySelector('.acervo-titulo')?.textContent.toLowerCase() || '';
        const ano = item.querySelector('.acervo-ano')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || titulo.includes(searchTerm);
        const matchesYear = !yearTerm || ano.includes(yearTerm);
        
        if (matchesSearch && matchesYear) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearAcervoSearch() {
    document.getElementById('acervo-search').value = '';
    document.getElementById('acervo-year-search').value = '';
    
    const acervoList = document.getElementById('acervo-list');
    const items = acervoList.querySelectorAll('.acervo-item');
    items.forEach(item => item.style.display = 'block');
}

// === EXPORTAR FUNÇÕES ===
window.loadAllData = loadAllData;
window.logout = logout;
window.searchBoletins = searchBoletins;
window.clearBoletimSearch = clearBoletimSearch;
window.searchAtividades = searchAtividades;
window.clearAtividadeSearch = clearAtividadeSearch;
window.searchAcervo = searchAcervo;
window.clearAcervoSearch = clearAcervoSearch;

