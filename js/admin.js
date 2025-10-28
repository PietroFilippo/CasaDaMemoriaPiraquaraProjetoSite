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
    let pdfFile = document.getElementById('boletim-pdf').files[0];
    
    // Verificar se é edição ou criação
    const isEdit = document.getElementById('form-boletim').dataset.editId;
    
    if (!isEdit && !pdfFile) {
        alert('Selecione um arquivo PDF');
        return;
    }
    
    if (isEdit && !pdfFile) {
        // Durante edição, arquivo é opcional - manter arquivo atual
        pdfFile = null;
    }
    
    if (pdfFile && pdfFile.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
    }
    
    try {
        let downloadURL;
        let fileName;
        
        if (pdfFile) {
            // Upload do novo arquivo
            fileName = `boletins/${Date.now()}_${pdfFile.name}`;
            const storageRef = window.firebaseModules.ref(window.storage, fileName);
            const uploadTask = window.firebaseModules.uploadBytesResumable(storageRef, pdfFile);
            
            // Mostrar progresso
            document.getElementById('boletim-progress').classList.remove('hidden');
            
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        document.getElementById('boletim-progress-bar').style.width = progress + '%';
                        document.getElementById('boletim-progress-text').textContent = Math.round(progress) + '%';
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        downloadURL = await window.firebaseModules.getDownloadURL(uploadTask.snapshot.ref);
                        resolve();
                    }
                );
            });
            
            document.getElementById('boletim-progress').classList.add('hidden');
        } else {
            // Usar arquivo existente
            const existingDoc = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'boletins', isEdit));
            const existingData = existingDoc.data();
            downloadURL = existingData.pdfUrl;
            fileName = existingData.fileName;
        }
        
        const boletimData = {
            titulo,
            edicao,
            data,
            descricao,
            pdfUrl: downloadURL,
            fileName,
            updatedAt: new Date().toISOString()
        };
        
        // Adicionar createdAt apenas para novos documentos
        if (!isEdit) {
            boletimData.createdAt = new Date().toISOString();
        }
        
        if (isEdit) {
            // Atualizar documento existente
            await window.firebaseModules.updateDoc(window.firebaseModules.doc(window.db, 'boletins', isEdit), boletimData);
            alert('Boletim atualizado com sucesso!');
        } else {
            // Criar novo documento
            await window.firebaseModules.addDoc(window.firebaseModules.collection(window.db, 'boletins'), boletimData);
            alert('Boletim publicado com sucesso!');
        }
        
        // Limpar formulário
        document.getElementById('form-boletim').reset();
        cancelEdit('boletim');
        loadBoletins();
        
    } catch (error) {
        alert('Erro ao processar boletim: ' + error.message);
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
                <div class="flex items-center gap-3">
                    <input type="checkbox" 
                           class="boletim-checkbox w-4 h-4 text-cinza-verde border-gray-300 rounded focus:ring-cinza-verde" 
                           data-id="${doc.id}"
                           onchange="toggleBoletimSelection('${doc.id}')">
                    <div>
                        <h4 class="boletim-titulo font-bold text-gray-800">${data.titulo}</h4>
                        <p class="text-sm text-gray-600">${data.edicao}</p>
                        ${data.data ? `<p class="boletim-data text-sm text-cinza-verde font-semibold mt-1">📅 ${data.data}</p>` : ''}
                        <p class="text-xs text-gray-500 mt-1">Criado em: ${new Date(data.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <a href="${data.pdfUrl}" target="_blank" class="bg-cinza-verde text-white px-4 py-2 rounded-lg text-sm hover:bg-verde-musgo">
                        Ver PDF
                    </a>
                    <button onclick="editBoletim('${doc.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                        Editar
                    </button>
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
    
    const custoEntrada = document.getElementById('ativ-custo').value;
    const valorEntrada = document.getElementById('ativ-valor-entrada').value;
    
    // Verificar se é edição ou criação
    const isEdit = document.getElementById('form-atividade').dataset.editId;
    
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
        custoEntrada: custoEntrada,
        valorEntrada: custoEntrada === 'paga' ? valorEntrada : null,
        gradiente: gradientes[tipo] || 'from-roxo to-azul',
        emoji: emojis[tipo] || '📅',
        updatedAt: new Date().toISOString()
    };
    
    // Adicionar createdAt apenas para novos documentos
    if (!isEdit) {
        atividade.createdAt = new Date().toISOString();
    }
    
    try {
        if (isEdit) {
            // Atualizar documento existente
            await window.firebaseModules.updateDoc(window.firebaseModules.doc(window.db, 'atividades', isEdit), atividade);
            alert('Atividade atualizada com sucesso!');
        } else {
            // Criar novo documento
            await window.firebaseModules.addDoc(window.firebaseModules.collection(window.db, 'atividades'), atividade);
            alert('Atividade publicada com sucesso!');
        }
        
        // Limpar formulário
        document.getElementById('form-atividade').reset();
        document.getElementById('valor-entrada-container').classList.add('hidden');
        document.getElementById('ativ-valor-entrada').required = false;
        cancelEdit('atividade');
        loadAtividades();
    } catch (error) {
        alert('Erro ao processar atividade: ' + error.message);
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
                    <div class="flex items-start gap-3">
                        <input type="checkbox" 
                               class="atividade-checkbox w-4 h-4 text-cinza-verde border-gray-300 rounded focus:ring-cinza-verde mt-1" 
                               data-id="${doc.id}"
                               onchange="toggleAtividadeSelection('${doc.id}')">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-2xl">${data.emoji}</span>
                                <h4 class="atividade-titulo font-bold text-gray-800">${data.titulo}</h4>
                            </div>
                            <p class="text-sm text-gray-600 mb-1"><strong>Tipo:</strong> ${data.tipoLabel}</p>
                            <p class="text-sm text-gray-600 mb-1"><strong>Data:</strong> <span class="atividade-data">${data.data}</span> | ${data.horario}</p>
                            <p class="text-sm text-gray-600"><strong>Status:</strong> ${data.status === 'proximas' ? 'Próxima' : 'Realizada'}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editAtividade('${doc.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                            Editar
                        </button>
                        <button onclick="deleteAtividade('${doc.id}')" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                            Excluir
                        </button>
                    </div>
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
    let arquivo = document.getElementById('acervo-arquivo').files[0];
    
    // Verificar se é edição ou criação
    const isEdit = document.getElementById('form-acervo').dataset.editId;
    
    if (!isEdit && !arquivo) {
        alert('Selecione um arquivo');
        return;
    }
    
    if (isEdit && !arquivo) {
        // Durante edição, arquivo é opcional - manter arquivo atual
        arquivo = null;
    }
    
    if (arquivo && arquivo.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
    }
    
    try {
        let downloadURL;
        let fileName;
        
        if (arquivo) {
            // Upload do novo arquivo
            fileName = `acervo/${tipo}/${Date.now()}_${arquivo.name}`;
            const storageRef = window.firebaseModules.ref(window.storage, fileName);
            const uploadTask = window.firebaseModules.uploadBytesResumable(storageRef, arquivo);
            
            // Mostrar progresso
            document.getElementById('acervo-progress').classList.remove('hidden');
            
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        document.getElementById('acervo-progress-bar').style.width = progress + '%';
                        document.getElementById('acervo-progress-text').textContent = Math.round(progress) + '%';
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        downloadURL = await window.firebaseModules.getDownloadURL(uploadTask.snapshot.ref);
                        resolve();
                    }
                );
            });
            
            document.getElementById('acervo-progress').classList.add('hidden');
        } else {
            // Usar arquivo existente
            const existingDoc = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'acervo', isEdit));
            const existingData = existingDoc.data();
            downloadURL = existingData.url;
            fileName = existingData.fileName;
        }
        
        const acervoData = {
            tipo,
            titulo,
            descricao,
            categoria,
            ano,
            url: downloadURL,
            fileName,
            updatedAt: new Date().toISOString()
        };
        
        // Adicionar createdAt apenas para novos documentos
        if (!isEdit) {
            acervoData.createdAt = new Date().toISOString();
        }
        
        if (isEdit) {
            // Atualizar documento existente
            await window.firebaseModules.updateDoc(window.firebaseModules.doc(window.db, 'acervo', isEdit), acervoData);
            alert('Item do acervo atualizado com sucesso!');
        } else {
            // Criar novo documento
            await window.firebaseModules.addDoc(window.firebaseModules.collection(window.db, 'acervo'), acervoData);
            alert('Item adicionado ao acervo com sucesso!');
        }
        
        // Limpar formulário
        document.getElementById('form-acervo').reset();
        cancelEdit('acervo');
        loadAcervo();
        
    } catch (error) {
        alert('Erro ao processar item do acervo: ' + error.message);
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
                <input type="checkbox" 
                       class="acervo-checkbox w-4 h-4 text-cinza-verde border-gray-300 rounded focus:ring-cinza-verde" 
                       data-id="${data.id}"
                       onchange="toggleAcervoSelection('${data.id}')">
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
                <button onclick="editAcervo('${data.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                    Editar
                </button>
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

// Exportar funções de seleção múltipla
window.toggleBoletimSelection = toggleBoletimSelection;
window.toggleAtividadeSelection = toggleAtividadeSelection;
window.toggleAcervoSelection = toggleAcervoSelection;
window.selectAllBoletins = selectAllBoletins;
window.selectAllAtividades = selectAllAtividades;
window.selectAllAcervo = selectAllAcervo;
window.clearBoletimSelection = clearBoletimSelection;
window.clearAtividadeSelection = clearAtividadeSelection;
window.clearAcervoSelection = clearAcervoSelection;
window.deleteSelectedBoletins = deleteSelectedBoletins;
window.deleteSelectedAtividades = deleteSelectedAtividades;
window.deleteSelectedAcervo = deleteSelectedAcervo;

// Exportar funções de edição
window.editBoletim = editBoletim;
window.editAtividade = editAtividade;
window.editAcervo = editAcervo;
window.cancelEdit = cancelEdit;

// === SELEÇÃO MÚLTIPLA ===
let selectedBoletins = new Set();
let selectedAtividades = new Set();
let selectedAcervo = new Set();

function toggleBoletimSelection(docId) {
    if (selectedBoletins.has(docId)) {
        selectedBoletins.delete(docId);
    } else {
        selectedBoletins.add(docId);
    }
    updateBoletimSelectionUI();
}

function toggleAtividadeSelection(docId) {
    if (selectedAtividades.has(docId)) {
        selectedAtividades.delete(docId);
    } else {
        selectedAtividades.add(docId);
    }
    updateAtividadeSelectionUI();
}

function toggleAcervoSelection(docId) {
    if (selectedAcervo.has(docId)) {
        selectedAcervo.delete(docId);
    } else {
        selectedAcervo.add(docId);
    }
    updateAcervoSelectionUI();
}

function selectAllBoletins() {
    const checkboxes = document.querySelectorAll('.boletim-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedBoletins.add(checkbox.dataset.id);
    });
    updateBoletimSelectionUI();
}

function selectAllAtividades() {
    const checkboxes = document.querySelectorAll('.atividade-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedAtividades.add(checkbox.dataset.id);
    });
    updateAtividadeSelectionUI();
}

function selectAllAcervo() {
    const checkboxes = document.querySelectorAll('.acervo-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedAcervo.add(checkbox.dataset.id);
    });
    updateAcervoSelectionUI();
}

function clearBoletimSelection() {
    selectedBoletins.clear();
    document.querySelectorAll('.boletim-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateBoletimSelectionUI();
}

function clearAtividadeSelection() {
    selectedAtividades.clear();
    document.querySelectorAll('.atividade-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateAtividadeSelectionUI();
}

function clearAcervoSelection() {
    selectedAcervo.clear();
    document.querySelectorAll('.acervo-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateAcervoSelectionUI();
}

function updateBoletimSelectionUI() {
    const count = selectedBoletins.size;
    const bulkActions = document.getElementById('boletins-bulk-actions');
    const deleteBtn = document.getElementById('delete-selected-boletins');
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
        deleteBtn.textContent = `Excluir Selecionados (${count})`;
    } else {
        bulkActions.classList.add('hidden');
    }
}

function updateAtividadeSelectionUI() {
    const count = selectedAtividades.size;
    const bulkActions = document.getElementById('atividades-bulk-actions');
    const deleteBtn = document.getElementById('delete-selected-atividades');
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
        deleteBtn.textContent = `Excluir Selecionados (${count})`;
    } else {
        bulkActions.classList.add('hidden');
    }
}

function updateAcervoSelectionUI() {
    const count = selectedAcervo.size;
    const bulkActions = document.getElementById('acervo-bulk-actions');
    const deleteBtn = document.getElementById('delete-selected-acervo');
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
        deleteBtn.textContent = `Excluir Selecionados (${count})`;
    } else {
        bulkActions.classList.add('hidden');
    }
}

// === EXCLUSÃO EM LOTE ===
async function deleteSelectedBoletins() {
    if (selectedBoletins.size === 0) return;
    
    if (!confirm(`Deseja realmente excluir ${selectedBoletins.size} boletim(s) selecionado(s)?`)) return;
    
    const promises = Array.from(selectedBoletins).map(async (docId) => {
        // Buscar dados do boletim para obter o fileName
        const doc = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'boletins', docId));
        const data = doc.data();
        
        // Deletar arquivo do Storage
        if (data.fileName) {
            const storageRef = window.firebaseModules.ref(window.storage, data.fileName);
            await window.firebaseModules.deleteObject(storageRef);
        }
        
        // Deletar do Firestore
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'boletins', docId));
    });
    
    try {
        await Promise.all(promises);
        alert(`${selectedBoletins.size} boletim(s) excluído(s) com sucesso!`);
        clearBoletimSelection();
        loadBoletins();
    } catch (error) {
        alert('Erro ao excluir boletins: ' + error.message);
    }
}

async function deleteSelectedAtividades() {
    if (selectedAtividades.size === 0) return;
    
    if (!confirm(`Deseja realmente excluir ${selectedAtividades.size} atividade(s) selecionada(s)?`)) return;
    
    const promises = Array.from(selectedAtividades).map(async (docId) => {
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'atividades', docId));
    });
    
    try {
        await Promise.all(promises);
        alert(`${selectedAtividades.size} atividade(s) excluída(s) com sucesso!`);
        clearAtividadeSelection();
        loadAtividades();
    } catch (error) {
        alert('Erro ao excluir atividades: ' + error.message);
    }
}

async function deleteSelectedAcervo() {
    if (selectedAcervo.size === 0) return;
    
    if (!confirm(`Deseja realmente excluir ${selectedAcervo.size} item(s) do acervo selecionado(s)?`)) return;
    
    const promises = Array.from(selectedAcervo).map(async (docId) => {
        // Buscar dados do item para obter o fileName
        const doc = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'acervo', docId));
        const data = doc.data();
        
        // Deletar arquivo do Storage
        if (data.fileName) {
            const storageRef = window.firebaseModules.ref(window.storage, data.fileName);
            await window.firebaseModules.deleteObject(storageRef);
        }
        
        // Deletar do Firestore
        await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, 'acervo', docId));
    });
    
    try {
        await Promise.all(promises);
        alert(`${selectedAcervo.size} item(s) do acervo excluído(s) com sucesso!`);
        clearAcervoSelection();
        loadAcervo();
    } catch (error) {
        alert('Erro ao excluir itens do acervo: ' + error.message);
    }
}

// === FUNÇÕES DE EDIÇÃO ===

// Editar Boletim
function editBoletim(docId) {
    // Buscar dados do boletim
    window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'boletins', docId))
        .then(doc => {
            if (doc.exists()) {
                const data = doc.data();
                
                // Preencher formulário com dados existentes
                document.getElementById('boletim-titulo').value = data.titulo || '';
                document.getElementById('boletim-edicao').value = data.edicao || '';
                document.getElementById('boletim-data').value = data.data || '';
                document.getElementById('boletim-descricao').value = data.descricao || '';
                
                // Armazenar ID para atualização
                document.getElementById('form-boletim').dataset.editId = docId;
                document.getElementById('form-boletim').dataset.editFileName = data.fileName || '';
                
                // Alterar botão de submit
                const submitBtn = document.querySelector('#form-boletim button[type="submit"]');
                submitBtn.textContent = 'Atualizar Boletim';
                submitBtn.classList.remove('bg-gradient-to-r', 'from-verde-cultural', 'to-cinza-verde');
                submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                
                // Mostrar botão de cancelar
                document.getElementById('boletim-edit-controls').classList.remove('hidden');
                
                // Tornar campo de arquivo opcional durante edição
                document.getElementById('boletim-pdf').required = false;
                
                // Mostrar dica sobre manter arquivo atual
                document.getElementById('boletim-file-hint').classList.remove('hidden');
                
                // Scroll para o formulário
                document.getElementById('section-boletins').scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            alert('Erro ao carregar dados do boletim: ' + error.message);
        });
}

// Editar Atividade
function editAtividade(docId) {
    // Buscar dados da atividade
    window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'atividades', docId))
        .then(doc => {
            if (doc.exists()) {
                const data = doc.data();
                
                // Preencher formulário com dados existentes
                document.getElementById('ativ-titulo').value = data.titulo || '';
                document.getElementById('ativ-tipo').value = data.tipo || '';
                document.getElementById('ativ-status').value = data.status || '';
                document.getElementById('ativ-data').value = data.data || '';
                document.getElementById('ativ-horario').value = data.horario || '';
                document.getElementById('ativ-descricao-curta').value = data.descricaoCurta || '';
                document.getElementById('ativ-descricao-completa').value = data.descricaoCompleta || '';
                document.getElementById('ativ-local').value = data.local || '';
                document.getElementById('ativ-classificacao').value = data.classificacao || '';
                document.getElementById('ativ-custo').value = data.custoEntrada || '';
                
                // Configurar campo de valor se for pago
                if (data.custoEntrada === 'paga') {
                    document.getElementById('valor-entrada-container').classList.remove('hidden');
                    document.getElementById('ativ-valor-entrada').required = true;
                    document.getElementById('ativ-valor-entrada').value = data.valorEntrada || '';
                }
                
                // Armazenar ID para atualização
                document.getElementById('form-atividade').dataset.editId = docId;
                
                // Alterar botão de submit
                const submitBtn = document.querySelector('#form-atividade button[type="submit"]');
                submitBtn.textContent = 'Atualizar Atividade';
                submitBtn.classList.remove('bg-gradient-to-r', 'from-verde-cultural', 'to-cinza-verde');
                submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                
                // Mostrar botão de cancelar
                document.getElementById('atividade-edit-controls').classList.remove('hidden');
                
                // Scroll para o formulário
                document.getElementById('section-atividades').scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            alert('Erro ao carregar dados da atividade: ' + error.message);
        });
}

// Editar Acervo
function editAcervo(docId) {
    // Buscar dados do item do acervo
    window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, 'acervo', docId))
        .then(doc => {
            if (doc.exists()) {
                const data = doc.data();
                
                // Preencher formulário com dados existentes
                document.getElementById('acervo-tipo').value = data.tipo || '';
                document.getElementById('acervo-titulo').value = data.titulo || '';
                document.getElementById('acervo-descricao').value = data.descricao || '';
                document.getElementById('acervo-categoria').value = data.categoria || '';
                document.getElementById('acervo-ano').value = data.ano || '';
                
                // Mostrar preview do arquivo atual
                const previewDiv = document.getElementById('acervo-file-preview');
                if (previewDiv) {
                    previewDiv.innerHTML = `
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Arquivo Atual:</h4>
                            <div class="flex items-center gap-3">
                                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    ${data.url.endsWith('.pdf') ? 
                                        '<span class="text-2xl">📄</span>' :
                                        `<img src="${data.url}" alt="${data.titulo}" class="w-full h-full object-cover">`
                                    }
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-800">${data.titulo}</p>
                                    <p class="text-xs text-gray-500">${data.tipo === 'fotografia' ? 'Fotografia' : 'Documento'}</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">Deixe o campo de arquivo vazio para manter o arquivo atual</p>
                        </div>
                    `;
                }
                
                // Armazenar ID e fileName para atualização
                document.getElementById('form-acervo').dataset.editId = docId;
                document.getElementById('form-acervo').dataset.editFileName = data.fileName || '';
                
                // Alterar botão de submit
                const submitBtn = document.querySelector('#form-acervo button[type="submit"]');
                submitBtn.textContent = 'Atualizar Item';
                submitBtn.classList.remove('bg-gradient-to-r', 'from-cinza-verde', 'to-verde-cultural');
                submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                
                // Mostrar botão de cancelar
                document.getElementById('acervo-edit-controls').classList.remove('hidden');
                
                // Tornar campo de arquivo opcional durante edição
                document.getElementById('acervo-arquivo').required = false;
                
                // Scroll para o formulário
                document.getElementById('section-acervo').scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            alert('Erro ao carregar dados do item: ' + error.message);
        });
}

// Cancelar Edição
function cancelEdit(formType) {
    const form = document.getElementById(`form-${formType}`);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Limpar dados de edição
    delete form.dataset.editId;
    delete form.dataset.editFileName;
    
    // Resetar formulário
    form.reset();
    
    // Restaurar botão original
    if (formType === 'boletim') {
        submitBtn.textContent = 'Publicar Boletim';
        submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.classList.add('bg-gradient-to-r', 'from-verde-cultural', 'to-cinza-verde');
        document.getElementById('boletim-edit-controls').classList.add('hidden');
        document.getElementById('boletim-pdf').required = true;
        document.getElementById('boletim-file-hint').classList.add('hidden');
    } else if (formType === 'atividade') {
        submitBtn.textContent = 'Publicar Atividade';
        submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.classList.add('bg-gradient-to-r', 'from-verde-cultural', 'to-cinza-verde');
        document.getElementById('valor-entrada-container').classList.add('hidden');
        document.getElementById('ativ-valor-entrada').required = false;
        document.getElementById('atividade-edit-controls').classList.add('hidden');
    } else if (formType === 'acervo') {
        submitBtn.textContent = 'Adicionar ao Acervo';
        submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.classList.add('bg-gradient-to-r', 'from-cinza-verde', 'to-verde-cultural');
        document.getElementById('acervo-edit-controls').classList.add('hidden');
        document.getElementById('acervo-arquivo').required = true;
        
        // Limpar preview
        const previewDiv = document.getElementById('acervo-file-preview');
        if (previewDiv) {
            previewDiv.innerHTML = '';
        }
    }
}

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

// Função para mostrar/ocultar campo de valor de entrada
function toggleValorEntrada() {
    const custoSelect = document.getElementById('ativ-custo');
    const valorContainer = document.getElementById('valor-entrada-container');
    const valorInput = document.getElementById('ativ-valor-entrada');
    
    if (custoSelect.value === 'paga') {
        valorContainer.classList.remove('hidden');
        valorInput.required = true;
    } else {
        valorContainer.classList.add('hidden');
        valorInput.required = false;
        valorInput.value = '';
    }
}

// Função para formatar valor monetário
function formatarValor(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    if (valor.length === 0) {
        input.value = '';
        return;
    }
    
    // Converte para centavos
    valor = parseInt(valor);
    
    // Formata como moeda brasileira
    const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    input.value = valorFormatado;
}

// Tornar funções disponíveis globalmente
window.toggleValorEntrada = toggleValorEntrada;
window.formatarValor = formatarValor;

