// ====================================
// ACERVO - INTEGRAÇÃO FIREBASE
// ====================================

// Este arquivo carrega fotografias e documentos do Firebase
// Substitui os dados hardcoded por dados dinâmicos

// Variáveis globais
let allPhotos = [];
let allDocuments = [];
let filteredPhotos = [];
let filteredDocuments = [];
let currentFilter = 'todas';
let currentDocFilter = 'todos';
let currentLightboxItem = null;
let currentLightboxIndex = 0;

// Controle de paginação
let photosPerPage = 8;
let docsPerPage = 8;
let displayedPhotosCount = photosPerPage;
let displayedDocsCount = docsPerPage;

// Controle de scroll position
let savedScrollPosition = 0;
let returnToGallery = false;

// ====================================
// CARREGAR ACERVO DO FIREBASE
// ====================================

async function loadAcervoFromFirebase() {
    try {
        // Carregar fotografias
        const photosQuery = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'acervo'),
            window.firebaseModules.where('tipo', '==', 'fotografia'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        
        const photosSnapshot = await window.firebaseModules.getDocs(photosQuery);
        allPhotos = photosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Carregar documentos
        const docsQuery = window.firebaseModules.query(
            window.firebaseModules.collection(window.db, 'acervo'),
            window.firebaseModules.where('tipo', '==', 'documento'),
            window.firebaseModules.orderBy('createdAt', 'desc')
        );
        
        const docsSnapshot = await window.firebaseModules.getDocs(docsQuery);
        allDocuments = docsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Renderizar
        displayPhotos(allPhotos);
        displayDocuments(allDocuments);
        
        console.log(`Carregadas ${allPhotos.length} fotografias e ${allDocuments.length} documentos`);
        
    } catch (error) {
        console.error('Erro ao carregar acervo:', error);
        
        // Mostrar mensagem de erro nas seções
        const photosGrid = document.getElementById('photosGrid');
        const docsGrid = document.getElementById('documentsGrid');
        
        const errorMessage = `
            <div class="col-span-full text-center py-12 text-red-500">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-lg">Erro ao carregar acervo</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
        
        if (photosGrid) photosGrid.innerHTML = errorMessage;
        if (docsGrid) docsGrid.innerHTML = errorMessage;
    }
}

// ====================================
// EXIBIR FOTOGRAFIAS
// ====================================

function displayPhotos(photos, limit = null) {
    filteredPhotos = photos;
    const grid = document.getElementById('photosGrid');
    const noPhotosMsg = document.getElementById('noPhotosMessage');
    const loadMoreBtn = document.getElementById('loadMorePhotosBtn');
    const showLessBtn = document.getElementById('showLessPhotosBtn');
    const showAllBtn = document.getElementById('showAllPhotosBtn');
    
    if (!grid) {
        console.error('Elemento photosGrid não encontrado');
        return;
    }
    
    // Limpar grid
    grid.innerHTML = '';
    
    // Verificar se há fotos
    if (photos.length === 0) {
        if (noPhotosMsg) {
            noPhotosMsg.classList.remove('hidden');
        } else {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-6xl mb-4">📸</div>
                    <p class="text-lg">Nenhuma fotografia encontrada</p>
                    <p class="text-sm mt-2">Em breve novas imagens serão adicionadas ao acervo.</p>
                </div>
            `;
        }
        // Ocultar todos os botões
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        if (showLessBtn) showLessBtn.classList.add('hidden');
        if (showAllBtn) showAllBtn.classList.add('hidden');
        return;
    }
    
    if (noPhotosMsg) {
        noPhotosMsg.classList.add('hidden');
    }
    
    // Determinar quantas fotos mostrar
    const photosToShow = limit ? photos.slice(0, limit) : photos.slice(0, displayedPhotosCount);
    
    // Criar card para cada foto
    photosToShow.forEach((photo, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg overflow-hidden shadow-md card-hover cursor-pointer';
        card.onclick = () => {
            returnToGallery = false;
            openLightbox(photo, index, photos);
        };
        
        card.innerHTML = `
            <div class="relative h-64 overflow-hidden lazy-image bg-gray-200">
                <img src="${photo.url}" 
                     alt="${photo.titulo}" 
                     loading="lazy"
                     class="w-full h-full object-cover"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImagem indisponível%3C/text%3E%3C/svg%3E';">
            </div>
            <div class="p-4">
                <h4 class="font-bold text-gray-800 mb-2">${photo.titulo}</h4>
                <p class="text-sm text-gray-600 mb-2 line-clamp-2">${photo.descricao || 'Sem descrição'}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-roxo bg-opacity-10 text-roxo px-2 py-1 rounded">${photo.categoria || 'Sem categoria'}</span>
                    ${photo.ano ? `<span>📅 ${photo.ano}</span>` : ''}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    // Atualizar visibilidade dos botões
    updatePhotoButtons(photos.length);
}

// ====================================
// FUNÇÕES DE PAGINAÇÃO DE FOTOS
// ====================================

function updatePhotoButtons(totalPhotos) {
    const loadMoreBtn = document.getElementById('loadMorePhotosBtn');
    const showLessBtn = document.getElementById('showLessPhotosBtn');
    const showAllBtn = document.getElementById('showAllPhotosBtn');
    
    if (displayedPhotosCount < totalPhotos) {
        if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
    } else {
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    }
    
    if (displayedPhotosCount > photosPerPage) {
        if (showLessBtn) showLessBtn.classList.remove('hidden');
    } else {
        if (showLessBtn) showLessBtn.classList.add('hidden');
    }
    
    if (showAllBtn) {
        if (totalPhotos > photosPerPage) {
            showAllBtn.classList.remove('hidden');
        } else {
            showAllBtn.classList.add('hidden');
        }
    }
}

function loadMorePhotos() {
    displayedPhotosCount += 4;
    displayPhotos(filteredPhotos);
}

function showLessPhotos() {
    if (displayedPhotosCount > photosPerPage) {
        displayedPhotosCount -= 4;
        if (displayedPhotosCount < photosPerPage) {
            displayedPhotosCount = photosPerPage;
        }
        displayPhotos(filteredPhotos);
    }
}

function showAllPhotosGallery() {
    currentGalleryType = 'photos';
    currentGalleryFilter = 'todas';
    currentGallerySearchTerm = '';
    currentGalleryYearTerm = '';
    
    const modal = document.getElementById('gallery-modal');
    
    if (!modal) return;
    
    // Resetar campos de busca
    const searchInput = document.getElementById('gallery-search');
    const yearInput = document.getElementById('gallery-year-search');
    if (searchInput) searchInput.value = '';
    if (yearInput) yearInput.value = '';
    
    // Resetar botões de filtro
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('todas')) {
            btn.classList.add('active');
        }
    });
    
    // Aplicar filtros (que vai renderizar o grid)
    applyGalleryFilters();
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function openLightboxFromGallery(photo, index, collection) {
    const galleryModal = document.getElementById('gallery-modal');
    if (galleryModal) {
        galleryModal.classList.add('hidden');
    }
    openLightbox(photo, index, collection);
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// ====================================
// EXIBIR DOCUMENTOS
// ====================================

function displayDocuments(documents, limit = null) {
    filteredDocuments = documents;
    const grid = document.getElementById('documentsGrid');
    const noDocsMsg = document.getElementById('noDocumentsMessage');
    const loadMoreBtn = document.getElementById('loadMoreDocsBtn');
    const showLessBtn = document.getElementById('showLessDocsBtn');
    const showAllBtn = document.getElementById('showAllDocsBtn');
    
    if (!grid) {
        console.error('Elemento documentsGrid não encontrado');
        return;
    }
    
    // Limpar grid
    grid.innerHTML = '';
    
    // Verificar se há documentos
    if (documents.length === 0) {
        if (noDocsMsg) {
            noDocsMsg.classList.remove('hidden');
        } else {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-6xl mb-4">📚</div>
                    <p class="text-lg">Nenhum documento encontrado</p>
                    <p class="text-sm mt-2">Em breve novos documentos serão adicionados ao acervo.</p>
                </div>
            `;
        }
        // Ocultar todos os botões
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        if (showLessBtn) showLessBtn.classList.add('hidden');
        if (showAllBtn) showAllBtn.classList.add('hidden');
        return;
    }
    
    if (noDocsMsg) {
        noDocsMsg.classList.add('hidden');
    }
    
    // Determinar quantos documentos mostrar
    const docsToShow = limit ? documents.slice(0, limit) : documents.slice(0, displayedDocsCount);
    
    // Criar card para cada documento
    docsToShow.forEach((doc, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg overflow-hidden shadow-md card-hover cursor-pointer';
        card.onclick = () => {
            returnToGallery = false;
            openLightbox(doc, index, documents);
        };
        
        // Verificar se é PDF
        const isPDF = doc.url && doc.url.toLowerCase().endsWith('.pdf');
        
        card.innerHTML = `
            <div class="relative h-64 overflow-hidden lazy-image bg-gray-100">
                ${isPDF ? 
                    `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-verde to-green-600">
                        <div class="text-center text-white">
                            <div class="text-6xl mb-2">📄</div>
                            <div class="text-sm font-semibold">Documento PDF</div>
                        </div>
                    </div>` :
                    `<img src="${doc.url}" 
                         alt="${doc.titulo}" 
                         loading="lazy" 
                         class="w-full h-full object-cover"
                         onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImagem indisponível%3C/text%3E%3C/svg%3E';">`
                }
            </div>
            <div class="p-4">
                <h4 class="font-bold text-gray-800 mb-2">${doc.titulo}</h4>
                <p class="text-sm text-gray-600 mb-2 line-clamp-2">${doc.descricao || 'Sem descrição'}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-verde bg-opacity-10 text-verde px-2 py-1 rounded">${doc.categoria || 'Sem categoria'}</span>
                    ${doc.ano ? `<span>📅 ${doc.ano}</span>` : ''}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    // Atualizar visibilidade dos botões
    updateDocsButtons(documents.length);
}

// ====================================
// FILTRAR FOTOGRAFIAS
// ====================================

function filterPhotos(category) {
    currentFilter = category;
    
    // Resetar paginação ao trocar filtro
    displayedPhotosCount = photosPerPage;
    
    const filtered = category === 'todas' 
        ? allPhotos 
        : allPhotos.filter(p => p.categoria === category);
    
    displayPhotos(filtered);
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Marcar botão atual como ativo
    const activeBtn = Array.from(document.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent.toLowerCase().includes(category.toLowerCase()) || 
              (category === 'todas' && btn.textContent.toLowerCase().includes('todas')));
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// ====================================
// FILTRAR DOCUMENTOS
// ====================================

function filterDocuments(category) {
    currentDocFilter = category;
    
    // Resetar paginação ao trocar filtro
    displayedDocsCount = docsPerPage;
    
    const filtered = category === 'todos' 
        ? allDocuments 
        : allDocuments.filter(d => d.categoria === category);
    
    displayDocuments(filtered);
    
    // Atualizar botões ativos
    document.querySelectorAll('.doc-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Marcar botão atual como ativo
    const activeBtn = Array.from(document.querySelectorAll('.doc-filter-btn'))
        .find(btn => btn.textContent.toLowerCase().includes(category.toLowerCase()) || 
              (category === 'todos' && btn.textContent.toLowerCase().includes('todos')));
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// ====================================
// BUSCA DE FOTOGRAFIAS
// ====================================

function searchPhotos() {
    const searchInput = document.getElementById('photo-search');
    const yearInput = document.getElementById('photo-year-search');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const yearTerm = yearInput ? yearInput.value.toLowerCase() : '';
    
    // Começar com fotos filtradas pela categoria atual
    let filtered = currentFilter === 'todas' 
        ? allPhotos 
        : allPhotos.filter(p => p.categoria === currentFilter);
    
    // Aplicar busca por nome
    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.titulo && p.titulo.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm))
        );
    }
    
    // Aplicar busca por ano
    if (yearTerm) {
        filtered = filtered.filter(p => 
            p.ano && p.ano.toString().includes(yearTerm)
        );
    }
    
    // Resetar paginação
    displayedPhotosCount = photosPerPage;
    
    displayPhotos(filtered);
}

function clearPhotoSearch() {
    const searchInput = document.getElementById('photo-search');
    const yearInput = document.getElementById('photo-year-search');
    
    if (searchInput) searchInput.value = '';
    if (yearInput) yearInput.value = '';
    
    searchPhotos();
}

// ====================================
// BUSCA DE DOCUMENTOS
// ====================================

function searchDocuments() {
    const searchInput = document.getElementById('doc-search');
    const yearInput = document.getElementById('doc-year-search');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const yearTerm = yearInput ? yearInput.value.toLowerCase() : '';
    
    // Começar com documentos filtrados pela categoria atual
    let filtered = currentDocFilter === 'todos' 
        ? allDocuments 
        : allDocuments.filter(d => d.categoria === currentDocFilter);
    
    // Aplicar busca por nome
    if (searchTerm) {
        filtered = filtered.filter(d => 
            (d.titulo && d.titulo.toLowerCase().includes(searchTerm)) ||
            (d.descricao && d.descricao.toLowerCase().includes(searchTerm))
        );
    }
    
    // Aplicar busca por ano
    if (yearTerm) {
        filtered = filtered.filter(d => 
            d.ano && d.ano.toString().includes(yearTerm)
        );
    }
    
    // Resetar paginação
    displayedDocsCount = docsPerPage;
    
    displayDocuments(filtered);
}

function clearDocSearch() {
    const searchInput = document.getElementById('doc-search');
    const yearInput = document.getElementById('doc-year-search');
    
    if (searchInput) searchInput.value = '';
    if (yearInput) yearInput.value = '';
    
    searchDocuments();
}

// ====================================
// FUNÇÕES DE PAGINAÇÃO DE DOCUMENTOS
// ====================================

function updateDocsButtons(totalDocs) {
    const loadMoreBtn = document.getElementById('loadMoreDocsBtn');
    const showLessBtn = document.getElementById('showLessDocsBtn');
    const showAllBtn = document.getElementById('showAllDocsBtn');
    
    if (displayedDocsCount < totalDocs) {
        if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
    } else {
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    }
    
    if (displayedDocsCount > docsPerPage) {
        if (showLessBtn) showLessBtn.classList.remove('hidden');
    } else {
        if (showLessBtn) showLessBtn.classList.add('hidden');
    }
    
    if (showAllBtn) {
        if (totalDocs > docsPerPage) {
            showAllBtn.classList.remove('hidden');
        } else {
            showAllBtn.classList.add('hidden');
        }
    }
}

function loadMoreDocs() {
    displayedDocsCount += 4;
    displayDocuments(filteredDocuments);
}

function showLessDocs() {
    if (displayedDocsCount > docsPerPage) {
        displayedDocsCount -= 4;
        if (displayedDocsCount < docsPerPage) {
            displayedDocsCount = docsPerPage;
        }
        displayDocuments(filteredDocuments);
    }
}

function showAllDocsGallery() {
    currentGalleryType = 'docs';
    currentGalleryFilter = 'todas';
    currentGallerySearchTerm = '';
    currentGalleryYearTerm = '';
    
    const modal = document.getElementById('gallery-modal');
    
    if (!modal) return;
    
    // Resetar campos de busca
    const searchInput = document.getElementById('gallery-search');
    const yearInput = document.getElementById('gallery-year-search');
    if (searchInput) searchInput.value = '';
    if (yearInput) yearInput.value = '';
    
    // Resetar botões de filtro
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes('todas') || btn.textContent.toLowerCase().includes('todos')) {
            btn.classList.add('active');
        }
    });
    
    // Aplicar filtros (que vai renderizar o grid)
    applyGalleryFilters();
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// ====================================
// LIGHTBOX (VISUALIZADOR DE IMAGENS)
// ====================================

function openLightbox(item, index, collection) {
    currentLightboxItem = item;
    currentLightboxIndex = index;
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxPDF = document.getElementById('lightboxPDF');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDescription = document.getElementById('lightboxDescription');
    const lightboxDate = document.getElementById('lightboxDate');
    const infoPanel = document.getElementById('lightbox-info-panel');
    const infoText = document.getElementById('info-text');
    const infoIcon = document.getElementById('info-icon');
    
    if (!lightbox) {
        console.error('Lightbox não encontrado');
        return;
    }
    
    // Verificar se é PDF
    const isPDF = item.url && item.url.toLowerCase().endsWith('.pdf');
    
    // Resetar estado do painel de informações (ocultar)
    if (infoPanel) {
        infoPanel.classList.add('translate-y-full');
        infoPanel.classList.remove('translate-y-0');
    }
    if (infoText) {
        infoText.textContent = 'Ver Informações';
    }
    if (infoIcon) {
        infoIcon.textContent = 'ℹ️';
    }
    
    if (isPDF) {
        // Mostrar PDF no iframe
        if (lightboxImg) {
            lightboxImg.classList.add('hidden');
        }
        if (lightboxPDF) {
            lightboxPDF.src = item.url;
            lightboxPDF.classList.remove('hidden');
        }
    } else {
        // Mostrar imagem
        if (lightboxPDF) {
            lightboxPDF.src = '';
            lightboxPDF.classList.add('hidden');
        }
        if (lightboxImg) {
            lightboxImg.src = item.url;
            lightboxImg.alt = item.titulo;
            lightboxImg.classList.remove('hidden');
        }
    }
    
    // Atualizar informações (mas manter ocultas)
    if (lightboxTitle) {
        lightboxTitle.textContent = item.titulo;
    }
    
    if (lightboxDescription) {
        lightboxDescription.textContent = item.descricao || 'Sem descrição disponível';
    }
    
    if (lightboxDate) {
        let metaInfo = [];
        if (item.categoria) metaInfo.push(`📁 ${item.categoria}`);
        if (item.ano) metaInfo.push(`📅 ${item.ano}`);
        if (item.local) metaInfo.push(`📍 ${item.local}`);
        lightboxDate.textContent = metaInfo.join(' • ');
    }
    
    // Mostrar lightbox
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function toggleLightboxInfo() {
    const infoPanel = document.getElementById('lightbox-info-panel');
    const infoText = document.getElementById('info-text');
    const infoIcon = document.getElementById('info-icon');
    
    if (!infoPanel) return;
    
    const isHidden = infoPanel.classList.contains('translate-y-full');
    
    if (isHidden) {
        // Mostrar painel
        infoPanel.classList.remove('translate-y-full');
        infoPanel.classList.add('translate-y-0');
        if (infoText) infoText.textContent = 'Ocultar Informações';
        if (infoIcon) infoIcon.textContent = '✕';
    } else {
        // Ocultar painel
        infoPanel.classList.add('translate-y-full');
        infoPanel.classList.remove('translate-y-0');
        if (infoText) infoText.textContent = 'Ver Informações';
        if (infoIcon) infoIcon.textContent = 'ℹ️';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxPDF = document.getElementById('lightboxPDF');
    const infoPanel = document.getElementById('lightbox-info-panel');
    const galleryModal = document.getElementById('gallery-modal');
    
    if (lightbox) {
        lightbox.classList.add('hidden');
    }
    
    // Limpar PDF iframe
    if (lightboxPDF) {
        lightboxPDF.src = '';
    }
    
    // Resetar painel de info
    if (infoPanel) {
        infoPanel.classList.add('translate-y-full');
        infoPanel.classList.remove('translate-y-0');
    }
    
    // Se veio da galeria, voltar para ela
    if (returnToGallery && galleryModal) {
        galleryModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Restaurar posição de scroll da galeria após um pequeno delay
        setTimeout(() => {
            window.scrollTo(0, savedScrollPosition);
        }, 100);
    } else {
        document.body.style.overflow = 'auto';
    }
}

// ====================================
// FILTRAR NA GALERIA MODAL
// ====================================

let currentGalleryFilter = 'todas';
let currentGalleryType = 'photos'; // 'photos' ou 'docs'
let currentGallerySearchTerm = '';
let currentGalleryYearTerm = '';

function filterGallery(category) {
    currentGalleryFilter = category;
    
    // Atualizar botões ativos
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.gallery-filter-btn'))
        .find(btn => {
            const btnText = btn.textContent.toLowerCase();
            return btnText.includes(category.toLowerCase()) ||
                   ((category === 'todas' || category === 'todos') && (btnText.includes('todas') || btnText.includes('todos')));
        });
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Aplicar filtros e renderizar
    applyGalleryFilters();
}

function searchInGallery() {
    const searchInput = document.getElementById('gallery-search');
    const yearInput = document.getElementById('gallery-year-search');
    
    currentGallerySearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    currentGalleryYearTerm = yearInput ? yearInput.value.toLowerCase() : '';
    
    applyGalleryFilters();
}

function clearGallerySearch() {
    const searchInput = document.getElementById('gallery-search');
    const yearInput = document.getElementById('gallery-year-search');
    
    if (searchInput) searchInput.value = '';
    if (yearInput) yearInput.value = '';
    
    currentGallerySearchTerm = '';
    currentGalleryYearTerm = '';
    
    applyGalleryFilters();
}

function applyGalleryFilters() {
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (!galleryGrid) return;
    
    // Determinar qual tipo de conteúdo está sendo exibido
    const collection = currentGalleryType === 'photos' ? filteredPhotos : filteredDocuments;
    
    // Aplicar filtro de categoria
    let filtered = currentGalleryFilter === 'todas' || currentGalleryFilter === 'todos'
        ? [...collection]
        : collection.filter(item => item.categoria === currentGalleryFilter);
    
    // Aplicar busca por nome
    if (currentGallerySearchTerm) {
        filtered = filtered.filter(item => 
            (item.titulo && item.titulo.toLowerCase().includes(currentGallerySearchTerm)) ||
            (item.descricao && item.descricao.toLowerCase().includes(currentGallerySearchTerm))
        );
    }
    
    // Aplicar busca por ano
    if (currentGalleryYearTerm) {
        filtered = filtered.filter(item => 
            item.ano && item.ano.toString().includes(currentGalleryYearTerm)
        );
    }
    
    // Limpar e renderizar grid
    galleryGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        galleryGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <div class="text-6xl mb-4">🔍</div>
                <p class="text-lg">Nenhum item encontrado</p>
                <p class="text-sm mt-2">Tente ajustar os filtros ou a busca</p>
            </div>
        `;
    } else {
        filtered.forEach((item, index) => {
            const isPDF = item.url && item.url.toLowerCase().endsWith('.pdf');
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer';
            card.onclick = () => {
                savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                returnToGallery = true;
                openLightboxFromGallery(item, index, filtered);
            };
            
            const bgColor = currentGalleryType === 'photos' ? 'from-roxo to-purple-600' : 'from-verde to-green-600';
            
            card.innerHTML = `
                <div class="relative pb-[100%] overflow-hidden bg-gray-100">
                    ${isPDF ? 
                        `<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br ${bgColor}">
                            <div class="text-white text-4xl">📄</div>
                        </div>` :
                        `<img src="${item.url}" 
                             alt="${item.titulo}" 
                             loading="lazy"
                             class="absolute inset-0 w-full h-full object-cover"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-gray-400\\'>❌</div>';">`
                    }
                </div>
                <div class="p-2">
                    <p class="text-xs font-semibold text-gray-800 truncate">${item.titulo}</p>
                </div>
            `;
            
            galleryGrid.appendChild(card);
        });
    }
    
    // Atualizar título da galeria
    const modalTitle = document.getElementById('gallery-modal-title');
    if (modalTitle) {
        const typeName = currentGalleryType === 'photos' ? 'Fotografias' : 'Documentos';
        const categoryName = currentGalleryFilter === 'todas' || currentGalleryFilter === 'todos' 
            ? 'Todas' 
            : currentGalleryFilter.charAt(0).toUpperCase() + currentGalleryFilter.slice(1);
        
        let titleParts = [typeName, categoryName];
        if (currentGallerySearchTerm || currentGalleryYearTerm) {
            titleParts.push('(Filtrado)');
        }
        
        modalTitle.textContent = `${titleParts.join(' - ')} (${filtered.length})`;
    }
}

// ====================================
// SCROLL SUAVE
// ====================================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = 100; // Offset para o header fixo
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ====================================
// MENU MOBILE
// ====================================

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// ====================================
// INICIALIZAÇÃO
// ====================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar menu mobile
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Configurar lightbox
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.id === 'close-lightbox') {
                closeLightbox();
            }
        });
    }
    
    // Tecla ESC fecha lightbox
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
    
    // Carregar dados do Firebase
    if (window.db) {
        loadAcervoFromFirebase();
    } else {
        console.error('Firebase não foi inicializado corretamente');
        
        // Tentar novamente após um delay
        setTimeout(() => {
            if (window.db) {
                loadAcervoFromFirebase();
            } else {
                console.error('Firebase ainda não está disponível');
            }
        }, 1000);
    }
});

// Tornar funções disponíveis globalmente
window.filterPhotos = filterPhotos;
window.filterDocuments = filterDocuments;
window.searchPhotos = searchPhotos;
window.clearPhotoSearch = clearPhotoSearch;
window.searchDocuments = searchDocuments;
window.clearDocSearch = clearDocSearch;
window.filterGallery = filterGallery;
window.searchInGallery = searchInGallery;
window.clearGallerySearch = clearGallerySearch;
window.scrollToSection = scrollToSection;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.toggleLightboxInfo = toggleLightboxInfo;
window.loadMorePhotos = loadMorePhotos;
window.showLessPhotos = showLessPhotos;
window.showAllPhotosGallery = showAllPhotosGallery;
window.closeGalleryModal = closeGalleryModal;
window.loadMoreDocs = loadMoreDocs;
window.showLessDocs = showLessDocs;
window.showAllDocsGallery = showAllDocsGallery;

