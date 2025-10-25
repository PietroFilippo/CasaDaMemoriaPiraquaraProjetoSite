// ====================================
// PROGRAMAÇÃO - INTEGRAÇÃO FIREBASE
// ====================================

// Este arquivo carrega boletins e atividades do Firebase
// Substitui os dados hardcoded por dados dinâmicos

// Variáveis globais para PDF
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;

// Variáveis globais para paginação e filtros
let allBoletins = [];
let filteredBoletins = [];
let allActivities = [];
let filteredActivities = [];
let activitiesPerPage = 8;
let displayedActivitiesCount = activitiesPerPage;
let currentActivityFilter = 'todas';
let currentActivitySearchTerm = '';
let currentActivityDateTerm = '';

// ====================================
// CARREGAR BOLETINS DO FIREBASE
// ====================================

async function loadBoletinsFromFirebase() {
    const boletinsList = document.getElementById('boletins-list');
    
    if (!boletinsList) {
        console.error('Elemento boletins-list não encontrado');
        return;
    }
    
    try {
        // Buscar boletins ordenados por data de criação (mais recentes primeiro)
        const q = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'boletins'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        
        const snapshot = await window.firebaseModules.getDocs(q);
        
        // Armazenar boletins globalmente
        allBoletins = [];
        snapshot.forEach((doc) => {
            allBoletins.push({ id: doc.id, ...doc.data() });
        });
        
        filteredBoletins = [...allBoletins];
        
        // Renderizar boletins
        renderBoletins(filteredBoletins);
        
    } catch (error) {
        console.error('Erro ao carregar boletins:', error);
        boletinsList.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <div class="text-4xl mb-2">⚠️</div>
                <p>Erro ao carregar boletins</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}

function renderBoletins(boletins, limit = 3) {
    const boletinsList = document.getElementById('boletins-list');
    const verTodosBtn = document.getElementById('ver-todos-boletins-btn');
    
    if (!boletinsList) return;
    
    // Limpar lista existente
    boletinsList.innerHTML = '';
    
    // Verificar se há boletins
    if (boletins.length === 0) {
        boletinsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📰</div>
                <p>Nenhum boletim encontrado</p>
                <p class="text-sm mt-2">Os boletins aparecerão aqui assim que forem publicados.</p>
            </div>
        `;
        if (verTodosBtn) verTodosBtn.classList.add('hidden');
        return;
    }
    
    // Mostrar botão "Ver Todos" apenas se houver mais de 3 boletins
    if (verTodosBtn) {
        if (boletins.length > 3) {
            verTodosBtn.classList.remove('hidden');
        } else {
            verTodosBtn.classList.add('hidden');
        }
    }
    
    // Limitar a quantidade de boletins exibidos
    const boletinsToShow = boletins.slice(0, limit);
    
    // Criar botão para cada boletim
    boletinsToShow.forEach((boletim) => {
        const button = document.createElement('button');
        button.onclick = () => loadPDF(boletim.pdfUrl, boletim.titulo);
        button.className = 'boletim-item w-full text-left py-3 px-4 rounded-lg bg-gray-100 hover:bg-roxo hover:text-white transition-colors';
        
        button.innerHTML = `
            <span class="font-semibold text-gray-800 block">${boletim.titulo}</span>
            <span class="text-sm text-gray-600 block">${boletim.edicao || 'Edição especial'}</span>
            ${boletim.data ? `<span class="text-xs text-azul font-semibold block mt-1">📅 ${boletim.data}</span>` : ''}
            ${boletim.descricao ? `<span class="text-xs text-gray-500 block mt-1">${boletim.descricao.substring(0, 60)}...</span>` : ''}
        `;
        
        boletinsList.appendChild(button);
    });
}

// ====================================
// BUSCA DE BOLETINS
// ====================================

function searchBoletins() {
    const searchInput = document.getElementById('boletim-search');
    const dateInput = document.getElementById('boletim-date-search');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const dateTerm = dateInput ? dateInput.value.toLowerCase() : '';
    
    let filtered = [...allBoletins];
    
    // Aplicar busca por título
    if (searchTerm) {
        filtered = filtered.filter(b => 
            (b.titulo && b.titulo.toLowerCase().includes(searchTerm)) ||
            (b.edicao && b.edicao.toLowerCase().includes(searchTerm)) ||
            (b.descricao && b.descricao.toLowerCase().includes(searchTerm))
        );
    }
    
    // Aplicar busca por data (formato: MM/AAAA ou AAAA)
    if (dateTerm) {
        filtered = filtered.filter(b => {
            // Tentar match em edicao, titulo ou data de criação
            if (b.edicao && b.edicao.toLowerCase().includes(dateTerm)) return true;
            if (b.titulo && b.titulo.toLowerCase().includes(dateTerm)) return true;
            
            // Tentar converter createdAt para comparação
            if (b.createdAt && b.createdAt.toDate) {
                const date = b.createdAt.toDate();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const dateString = `${month}/${year}`;
                
                if (dateString.includes(dateTerm) || year.toString().includes(dateTerm)) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    filteredBoletins = filtered;
    renderBoletins(filteredBoletins);
}

function clearBoletimSearch() {
    const searchInput = document.getElementById('boletim-search');
    const dateInput = document.getElementById('boletim-date-search');
    
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    filteredBoletins = [...allBoletins];
    renderBoletins(filteredBoletins);
}

// ====================================
// GALERIA DE BOLETINS
// ====================================

let currentGalleryBoletinsSearchTerm = '';
let currentGalleryBoletinsDateTerm = '';

function showAllBoletinsGallery() {
    const modal = document.getElementById('boletins-gallery-modal');
    
    if (!modal) return;
    
    // Resetar campos de busca da galeria
    const searchInput = document.getElementById('boletim-gallery-search');
    const dateInput = document.getElementById('boletim-gallery-date-search');
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    currentGalleryBoletinsSearchTerm = '';
    currentGalleryBoletinsDateTerm = '';
    
    // Renderizar todos os boletins filtrados
    renderBoletinsGallery(filteredBoletins);
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function searchBoletinsInGallery() {
    const searchInput = document.getElementById('boletim-gallery-search');
    const dateInput = document.getElementById('boletim-gallery-date-search');
    
    currentGalleryBoletinsSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    currentGalleryBoletinsDateTerm = dateInput ? dateInput.value.toLowerCase() : '';
    
    let filtered = [...filteredBoletins];
    
    // Aplicar busca por título
    if (currentGalleryBoletinsSearchTerm) {
        filtered = filtered.filter(b => 
            (b.titulo && b.titulo.toLowerCase().includes(currentGalleryBoletinsSearchTerm)) ||
            (b.edicao && b.edicao.toLowerCase().includes(currentGalleryBoletinsSearchTerm)) ||
            (b.descricao && b.descricao.toLowerCase().includes(currentGalleryBoletinsSearchTerm))
        );
    }
    
    // Aplicar busca por data
    if (currentGalleryBoletinsDateTerm) {
        filtered = filtered.filter(b => {
            if (b.data && b.data.toLowerCase().includes(currentGalleryBoletinsDateTerm)) return true;
            if (b.edicao && b.edicao.toLowerCase().includes(currentGalleryBoletinsDateTerm)) return true;
            if (b.titulo && b.titulo.toLowerCase().includes(currentGalleryBoletinsDateTerm)) return true;
            return false;
        });
    }
    
    renderBoletinsGallery(filtered);
}

function clearBoletimGallerySearch() {
    const searchInput = document.getElementById('boletim-gallery-search');
    const dateInput = document.getElementById('boletim-gallery-date-search');
    
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    currentGalleryBoletinsSearchTerm = '';
    currentGalleryBoletinsDateTerm = '';
    
    renderBoletinsGallery(filteredBoletins);
}

function renderBoletinsGallery(boletins) {
    const galleryGrid = document.getElementById('boletins-gallery-grid');
    
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    if (boletins.length === 0) {
        galleryGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <div class="text-6xl mb-4">🔍</div>
                <p class="text-lg">Nenhum boletim encontrado</p>
                <p class="text-sm mt-2">Tente ajustar os filtros ou a busca</p>
            </div>
        `;
        return;
    }
    
    boletins.forEach((boletim) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer';
        card.onclick = () => {
            // Fechar modal
            closeBoletinsGalleryModal();
            // Carregar PDF na página principal
            loadPDF(boletim.pdfUrl, boletim.titulo);
            // Scroll para a seção de boletins
            document.getElementById('boletins').scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        
        card.innerHTML = `
            <div class="relative pb-[75%] overflow-hidden bg-gradient-to-br from-roxo to-purple-600">
                <div class="absolute inset-0 flex items-center justify-center text-white">
                    <div class="text-5xl">📰</div>
                </div>
            </div>
            <div class="p-4">
                <h4 class="text-sm font-bold text-gray-800 mb-2 line-clamp-2">${boletim.titulo}</h4>
                <p class="text-xs text-gray-600 mb-1">${boletim.edicao || 'Edição especial'}</p>
                ${boletim.data ? `<p class="text-xs text-azul font-semibold">📅 ${boletim.data}</p>` : ''}
            </div>
        `;
        
        galleryGrid.appendChild(card);
    });
}

function closeBoletinsGalleryModal() {
    const modal = document.getElementById('boletins-gallery-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// ====================================
// CARREGAR PDF NO VIEWER
// ====================================

function loadPDF(url, title) {
    const pdfLoading = document.getElementById('pdf-loading');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfControls = document.getElementById('pdf-controls');
    const pdfTitle = document.getElementById('pdf-title');
    const downloadBtn = document.getElementById('download-btn');
    
    // Atualizar título
    if (pdfTitle) {
        pdfTitle.textContent = title;
    }
    
    // Mostrar loading
    if (pdfLoading) {
        pdfLoading.innerHTML = `
            <div class="text-center py-20">
                <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-roxo mx-auto mb-4"></div>
                <p class="text-gray-600">Carregando ${title}...</p>
            </div>
        `;
        pdfLoading.classList.remove('hidden');
    }
    
    if (pdfCanvas) {
        pdfCanvas.classList.add('hidden');
    }
    
    if (pdfControls) {
        pdfControls.classList.add('hidden');
    }
    
    if (downloadBtn) {
        downloadBtn.classList.add('hidden');
    }
    
    // Configurar PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Carregar PDF com configurações de CORS
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            withCredentials: false,
            isEvalSupported: false
        });
        
        loadingTask.promise.then(function(pdf) {
            pdfDoc = pdf;
            
            // Atualizar informações
            const pageCount = document.getElementById('page-count');
            if (pageCount) {
                pageCount.textContent = pdf.numPages;
            }
            
            // Esconder loading e mostrar canvas
            if (pdfLoading) {
                pdfLoading.classList.add('hidden');
            }
            if (pdfCanvas) {
                pdfCanvas.classList.remove('hidden');
            }
            if (pdfControls) {
                pdfControls.classList.remove('hidden');
            }
            
            // Configurar link de download
            if (downloadBtn) {
                downloadBtn.href = url;
                downloadBtn.classList.remove('hidden');
                downloadBtn.download = `${title}.pdf`;
            }
            
            // Renderizar primeira página
            pageNum = 1;
            renderPage(pageNum);
            
        }).catch(function(error) {
            console.error('Erro ao carregar PDF:', error);
            if (pdfLoading) {
                pdfLoading.innerHTML = `
                    <div class="text-center py-20 text-red-500">
                        <div class="text-6xl mb-4">⚠️</div>
                        <p class="text-lg font-semibold">Erro ao carregar o PDF</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                `;
            }
        });
    } else {
        console.error('PDF.js não está carregado');
        if (pdfLoading) {
            pdfLoading.innerHTML = `
                <div class="text-center py-20 text-red-500">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-lg font-semibold">Erro: PDF.js não carregado</p>
                </div>
            `;
        }
    }
}

// ====================================
// RENDERIZAR PÁGINA DO PDF
// ====================================

function renderPage(num) {
    pageRendering = true;
    
    const canvas = document.getElementById('pdf-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            pageRendering = false;
            
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // Atualizar número da página
            const pageNum = document.getElementById('page-num');
            if (pageNum) {
                pageNum.textContent = num;
            }
            
            // Atualizar estado dos botões - não há prev-page e next-page, o HTML chama previousPage() e nextPage()
        });
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// ====================================
// CONTROLES DE NAVEGAÇÃO DO PDF
// ====================================

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

// Aliases para as funções chamadas do HTML
function previousPage() {
    onPrevPage();
}

function nextPage() {
    onNextPage();
}

// ====================================
// CARREGAR ATIVIDADES DO FIREBASE
// ====================================

async function loadAtividadesFromFirebase() {
    try {
        // Buscar atividades ordenadas por data de criação
        const q = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'atividades'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        
        const snapshot = await window.firebaseModules.getDocs(q);
        
        // Armazenar todas as atividades
        allActivities = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allActivities.push({ id: doc.id, ...data });
        });
        
        filteredActivities = [...allActivities];
        
        // Renderizar atividades com paginação
        displayActivities(filteredActivities);
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        const container = document.getElementById('activities-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-500">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-lg">Erro ao carregar atividades</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
}

function displayActivities(activities) {
    const container = document.getElementById('activities-container');
    const noActivitiesMsg = document.getElementById('no-activities');
    const loadMoreBtn = document.getElementById('loadMoreActivitiesBtn');
    const showLessBtn = document.getElementById('showLessActivitiesBtn');
    const showAllBtn = document.getElementById('showAllActivitiesBtn');
    
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Verificar se há atividades
    if (activities.length === 0) {
        if (noActivitiesMsg) {
            noActivitiesMsg.classList.remove('hidden');
        } else {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-6xl mb-4">📅</div>
                    <p class="text-lg">Nenhuma atividade encontrada</p>
                    <p class="text-sm mt-2">Fique atento às próximas programações!</p>
                </div>
            `;
        }
        
        // Ocultar botões
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        if (showLessBtn) showLessBtn.classList.add('hidden');
        if (showAllBtn) showAllBtn.classList.add('hidden');
        return;
    }
    
    if (noActivitiesMsg) {
        noActivitiesMsg.classList.add('hidden');
    }
    
    // Determinar quantas atividades mostrar
    const activitiesToShow = activities.slice(0, displayedActivitiesCount);
    
    // Criar card para cada atividade
    activitiesToShow.forEach((activity) => {
        const card = createActivityCard(activity.id, activity);
        container.appendChild(card);
    });
    
    // Atualizar visibilidade dos botões
    updateActivityButtons(activities.length);
}

// ====================================
// CRIAR CARD DE ATIVIDADE
// ====================================

function createActivityCard(id, data) {
    const card = document.createElement('div');
    card.className = 'activity-card bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer';
    card.dataset.type = data.tipo || 'todas';
    card.dataset.status = data.status || 'proximas';
    card.onclick = () => openActivityModal(id, data);
    
    // Definir gradientes e cores baseado no tipo
    const typeStyles = {
        'oficina': { gradient: 'from-roxo to-purple-600', emoji: '🎨' },
        'palestra': { gradient: 'from-azul to-blue-600', emoji: '🎤' },
        'exposicao': { gradient: 'from-verde to-green-600', emoji: '🖼️' },
        'evento': { gradient: 'from-amarelo to-orange-500', emoji: '🎉' }
    };
    
    const style = typeStyles[data.tipo] || typeStyles['evento'];
    
    // Status labels
    const statusLabels = {
        'proximas': { text: 'PRÓXIMA', color: 'text-verde' },
        'realizadas': { text: 'ENCERRADA', color: 'text-gray-500' }
    };
    
    const statusInfo = statusLabels[data.status] || statusLabels['proximas'];
    
    card.innerHTML = `
        <div class="relative h-48 bg-gradient-to-br ${style.gradient} flex items-center justify-center">
            <div class="absolute top-4 right-4 bg-white ${statusInfo.color} px-4 py-2 rounded-full text-sm font-bold">
                ${statusInfo.text}
            </div>
            <div class="text-white text-center">
                <div class="text-5xl mb-2">${data.emoji || style.emoji}</div>
                <div class="text-xl font-bold">${(data.tipoLabel || data.tipo || 'Atividade').toUpperCase()}</div>
            </div>
        </div>
        <div class="p-6">
            <div class="flex items-center text-gray-600 mb-3">
                <span class="text-verde mr-2">📅</span>
                <span class="font-semibold">${data.data || 'Data a confirmar'}</span>
            </div>
            <div class="flex items-center text-gray-600 mb-4">
                <span class="text-azul mr-2">🕐</span>
                <span>${data.horario || 'Horário a confirmar'}</span>
            </div>
            <h4 class="text-xl font-bold text-gray-800 mb-2">${data.titulo}</h4>
            <p class="text-gray-600 text-sm">${data.descricaoCurta || data.descricaoCompleta?.substring(0, 100) + '...' || 'Sem descrição'}</p>
        </div>
    `;
    
    return card;
}

// ====================================
// ABRIR MODAL DE ATIVIDADE
// ====================================

function openActivityModal(id, data) {
    const modal = document.getElementById('activity-modal');
    const modalContent = document.getElementById('modal-content');
    
    if (!modal || !modalContent) {
        console.error('Modal não encontrado');
        return;
    }
    
    // Definir gradientes baseado no tipo
    const typeStyles = {
        'oficina': { gradient: 'from-roxo to-purple-600', emoji: '🎨' },
        'palestra': { gradient: 'from-azul to-blue-600', emoji: '🎤' },
        'exposicao': { gradient: 'from-verde to-green-600', emoji: '🖼️' },
        'evento': { gradient: 'from-amarelo to-orange-500', emoji: '🎉' }
    };
    
    const style = typeStyles[data.tipo] || typeStyles['evento'];
    
    modalContent.innerHTML = `
        <div class="bg-gradient-to-br ${style.gradient} h-64 flex items-center justify-center relative">
            <div class="text-white text-center">
                <div class="text-6xl mb-4">${data.emoji || style.emoji}</div>
                <div class="text-2xl font-bold">${(data.tipoLabel || data.tipo || 'Atividade').toUpperCase()}</div>
            </div>
        </div>
        
        <div class="p-8">
            <h3 class="text-3xl font-bold text-gray-800 mb-6">${data.titulo}</h3>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-verde text-sm font-semibold mb-1">📅 Data</div>
                    <div class="text-gray-700">${data.data || 'Data a confirmar'}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-azul text-sm font-semibold mb-1">🕐 Horário</div>
                    <div class="text-gray-700">${data.horario || 'Horário a confirmar'}</div>
                </div>
            </div>
            
            
            ${data.local ? `
            <div class="mb-6">
                <div class="text-gray-600 text-sm font-semibold mb-2">📍 Local</div>
                <div class="text-gray-700">${data.local}</div>
            </div>
            ` : ''}
            
            ${data.classificacao ? `
            <div class="mb-6">
                <div class="text-gray-600 text-sm font-semibold mb-2">ℹ️ Classificação Indicativa</div>
                <div class="text-gray-700">${data.classificacao}</div>
            </div>
            ` : ''}
            
            <div class="border-t border-gray-200 pt-6">
                <h4 class="text-xl font-bold text-gray-800 mb-3">Descrição</h4>
                <p class="text-gray-700 leading-relaxed">${data.descricaoCompleta || data.descricaoCurta || 'Sem descrição disponível.'}</p>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// ====================================
// FECHAR MODAL
// ====================================

function closeActivityModal() {
    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// ====================================
// FILTROS DE ATIVIDADES
// ====================================

function filterActivities(filter) {
    currentActivityFilter = filter;
    
    // Resetar paginação ao mudar filtro
    displayedActivitiesCount = activitiesPerPage;
    
    let filtered = [...allActivities];
    
    // Aplicar filtro de tipo/status
    if (filter !== 'todas') {
        if (filter === 'proximas' || filter === 'realizadas') {
            filtered = filtered.filter(a => a.status === filter);
        } else {
            filtered = filtered.filter(a => a.tipo === filter);
        }
    }
    
    // Aplicar busca se houver
    const searchInput = document.getElementById('activity-search');
    const dateInput = document.getElementById('activity-date-search');
    
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filtered = filtered.filter(a => 
            (a.titulo && a.titulo.toLowerCase().includes(searchTerm)) ||
            (a.descricaoCurta && a.descricaoCurta.toLowerCase().includes(searchTerm)) ||
            (a.descricaoCompleta && a.descricaoCompleta.toLowerCase().includes(searchTerm))
        );
    }
    
    if (dateInput && dateInput.value) {
        const dateTerm = dateInput.value.toLowerCase();
        filtered = filtered.filter(a => 
            a.data && a.data.toLowerCase().includes(dateTerm)
        );
    }
    
    filteredActivities = filtered;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.filter-btn'))
        .find(btn => {
            const btnText = btn.textContent.toLowerCase();
            return btnText.includes(filter.toLowerCase()) ||
                   (filter === 'todas' && btnText.includes('todas'));
        });
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    displayActivities(filteredActivities);
}

// ====================================
// BUSCA DE ATIVIDADES
// ====================================

function searchActivities() {
    // Reaplica o filtro atual considerando a busca
    filterActivities(currentActivityFilter);
}

function clearActivitySearch() {
    const searchInput = document.getElementById('activity-search');
    const dateInput = document.getElementById('activity-date-search');
    
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    searchActivities();
}

// ====================================
// PAGINAÇÃO DE ATIVIDADES
// ====================================

function updateActivityButtons(totalActivities) {
    const loadMoreBtn = document.getElementById('loadMoreActivitiesBtn');
    const showLessBtn = document.getElementById('showLessActivitiesBtn');
    const showAllBtn = document.getElementById('showAllActivitiesBtn');
    
    if (displayedActivitiesCount < totalActivities) {
        if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
    } else {
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    }
    
    if (displayedActivitiesCount > activitiesPerPage) {
        if (showLessBtn) showLessBtn.classList.remove('hidden');
    } else {
        if (showLessBtn) showLessBtn.classList.add('hidden');
    }
    
    if (showAllBtn) {
        if (totalActivities > activitiesPerPage) {
            showAllBtn.classList.remove('hidden');
        } else {
            showAllBtn.classList.add('hidden');
        }
    }
}

function loadMoreActivities() {
    displayedActivitiesCount += 4;
    displayActivities(filteredActivities);
}

function showLessActivities() {
    if (displayedActivitiesCount > activitiesPerPage) {
        displayedActivitiesCount -= 4;
        if (displayedActivitiesCount < activitiesPerPage) {
            displayedActivitiesCount = activitiesPerPage;
        }
        displayActivities(filteredActivities);
    }
}

function showAllActivitiesGallery() {
    const modal = document.getElementById('activities-gallery-modal');
    const modalTitle = document.getElementById('activities-gallery-title');
    const galleryGrid = document.getElementById('activities-gallery-grid');
    
    if (!modal || !galleryGrid) return;
    
    // Resetar filtros da galeria
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('todas')) {
            btn.classList.add('active');
        }
    });
    
    modalTitle.textContent = `Todas as Atividades (${filteredActivities.length})`;
    renderActivitiesGallery(filteredActivities);
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function filterActivitiesInGallery(filter) {
    let filtered = [...filteredActivities];
    
    if (filter !== 'todas') {
        if (filter === 'proximas' || filter === 'realizadas') {
            filtered = filtered.filter(a => a.status === filter);
        } else {
            filtered = filtered.filter(a => a.tipo === filter);
        }
    }
    
    // Atualizar botões ativos
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.gallery-filter-btn'))
        .find(btn => {
            const btnText = btn.textContent.toLowerCase();
            return btnText.includes(filter.toLowerCase()) ||
                   (filter === 'todas' && btnText.includes('todas'));
        });
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Atualizar título
    const modalTitle = document.getElementById('activities-gallery-title');
    if (modalTitle) {
        const filterName = filter === 'todas' ? 'Todas' : 
                          filter.charAt(0).toUpperCase() + filter.slice(1);
        modalTitle.textContent = `Atividades - ${filterName} (${filtered.length})`;
    }
    
    renderActivitiesGallery(filtered);
}

function renderActivitiesGallery(activities) {
    const galleryGrid = document.getElementById('activities-gallery-grid');
    
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    activities.forEach((activity) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer';
        card.onclick = () => {
            closeActivitiesGalleryModal();
            openActivityModal(activity.id, activity);
        };
        
        const typeStyles = {
            'oficina': { gradient: 'from-roxo to-purple-600', emoji: '🎨' },
            'palestra': { gradient: 'from-azul to-blue-600', emoji: '🎤' },
            'exposicao': { gradient: 'from-verde to-green-600', emoji: '🖼️' },
            'evento': { gradient: 'from-amarelo to-orange-500', emoji: '🎉' }
        };
        
        const style = typeStyles[activity.tipo] || typeStyles['evento'];
        
        card.innerHTML = `
            <div class="relative pb-[75%] overflow-hidden bg-gradient-to-br ${style.gradient}">
                <div class="absolute inset-0 flex items-center justify-center text-white">
                    <div class="text-4xl">${activity.emoji || style.emoji}</div>
                </div>
            </div>
            <div class="p-3">
                <p class="text-xs font-bold text-gray-800 truncate mb-1">${activity.titulo}</p>
                <p class="text-xs text-gray-600 truncate">📅 ${activity.data || 'A confirmar'}</p>
            </div>
        `;
        
        galleryGrid.appendChild(card);
    });
}

function closeActivitiesGalleryModal() {
    const modal = document.getElementById('activities-gallery-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function filterByStatus(status) {
    // Mantido para compatibilidade, mas redireciona para filterActivities
    filterActivities(status);
}

// ====================================
// INICIALIZAÇÃO
// ====================================

document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados do Firebase
    if (window.db) {
        loadBoletinsFromFirebase();
        loadAtividadesFromFirebase();
    } else {
        console.error('Firebase não foi inicializado corretamente');
    }
});

// Tornar funções disponíveis globalmente (chamadas do HTML)
window.previousPage = previousPage;
window.nextPage = nextPage;
window.loadPDF = loadPDF;
window.filterActivities = filterActivities;
window.filterByStatus = filterByStatus;
window.searchActivities = searchActivities;
window.clearActivitySearch = clearActivitySearch;
window.loadMoreActivities = loadMoreActivities;
window.showLessActivities = showLessActivities;
window.showAllActivitiesGallery = showAllActivitiesGallery;
window.filterActivitiesInGallery = filterActivitiesInGallery;
window.closeActivitiesGalleryModal = closeActivitiesGalleryModal;
window.closeActivityModal = closeActivityModal;
window.searchBoletins = searchBoletins;
window.clearBoletimSearch = clearBoletimSearch;
window.showAllBoletinsGallery = showAllBoletinsGallery;
window.searchBoletinsInGallery = searchBoletinsInGallery;
window.clearBoletimGallerySearch = clearBoletimGallerySearch;
window.closeBoletinsGalleryModal = closeBoletinsGalleryModal;

