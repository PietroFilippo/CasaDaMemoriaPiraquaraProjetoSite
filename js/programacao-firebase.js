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
let activitiesPerPage = 4;
let displayedActivitiesCount = activitiesPerPage;
let currentActivityFilter = 'todas';
let currentActivitySearchTerm = '';
let currentActivityDateTerm = '';
let currentBoletimSearch = '';
let boletinsPerPage = 6;
let displayedBoletinsCount = boletinsPerPage;

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

function renderBoletins(boletins) {
    const boletinsList = document.getElementById('boletins-list');
    
    if (!boletinsList) return;
    
    // Limpar lista existente
    boletinsList.innerHTML = '';
    
    if (boletins.length === 0) {
        boletinsList.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum boletim encontrado</p>';
        updateBoletinsButtons(boletins.length);
        return;
    }
    
    // Mostrar apenas a quantidade definida
    const boletinsToShow = boletins.slice(0, displayedBoletinsCount);
    
    // Criar card para cada boletim
    boletinsToShow.forEach((boletim) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow';
        
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h5 class="font-semibold text-gray-800 text-lg mb-2">${boletim.titulo}</h5>
                    <p class="text-sm text-gray-600 mb-2">${boletim.edicao || 'Edição especial'}</p>
                    ${boletim.data ? `<p class="text-xs text-cinza-verde font-semibold mb-2">📅 ${boletim.data}</p>` : ''}
                    ${boletim.descricao ? `<p class="text-sm text-gray-500 line-clamp-2">${boletim.descricao}</p>` : ''}
                </div>
                <div class="flex flex-col gap-2 ml-4">
                    <button onclick="showBoletimDescription('${boletim.id}')" 
                            class="px-3 py-1 bg-cinza-verde text-white rounded text-sm hover:bg-verde-musgo transition-colors">
                        📖 Ver Descrição
                    </button>
                    <button onclick="downloadPDF('${boletim.pdfUrl}', '${boletim.titulo}')" 
                            class="px-3 py-1 bg-verde-musgo text-white rounded text-sm hover:bg-verde-cultural transition-colors">
                        ⬇️ Baixar PDF
                    </button>
                </div>
            </div>
        `;
        
        boletinsList.appendChild(card);
    });
    
    // Atualizar botões de paginação
    updateBoletinsButtons(boletins.length);
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
            downloadPDF(boletim.pdfUrl, boletim.titulo);
            // Scroll para a seção de boletins
            document.getElementById('boletins').scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        
        card.innerHTML = `
            <div class="relative pb-[75%] overflow-hidden bg-gradient-to-br from-verde-cultural to-cinza-verde">
                <div class="absolute inset-0 flex items-center justify-center text-white">
                    <div class="text-5xl">📰</div>
                </div>
            </div>
            <div class="p-4">
                <h4 class="text-sm font-bold text-gray-800 mb-2 line-clamp-2">${boletim.titulo}</h4>
                <p class="text-xs text-gray-600 mb-1">${boletim.edicao || 'Edição especial'}</p>
                ${boletim.data ? `<p class="text-xs text-cinza-verde font-semibold">📅 ${boletim.data}</p>` : ''}
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

// Função para obter URL de download segura do Firebase Storage
async function getSecureDownloadUrl(firebaseUrl) {
    try {
        console.log('🔍 Obtendo URL segura do Firebase Storage...');
        console.log('URL original:', firebaseUrl);
        
        // Extrair o caminho do arquivo da URL do Firebase Storage
        const url = new URL(firebaseUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
        
        if (!pathMatch) {
            console.error('❌ Não foi possível extrair o caminho do arquivo da URL');
            return firebaseUrl; // Retornar URL original se não conseguir extrair
        }
        
        const filePath = decodeURIComponent(pathMatch[1]);
        console.log('📁 Caminho do arquivo extraído:', filePath);
        
        // Criar referência do Firebase Storage
        const fileRef = window.firebaseModules.ref(window.storage, filePath);
        
        // Obter URL de download segura
        const downloadUrl = await window.firebaseModules.getDownloadURL(fileRef);
        console.log('✅ URL de download segura obtida:', downloadUrl);
        
        return downloadUrl;
    } catch (error) {
        console.error('❌ Erro ao obter URL segura:', error);
        console.log('🔄 Usando URL original como fallback');
        return firebaseUrl; // Retornar URL original se falhar
    }
}

// Função para testar se a URL é acessível
async function testUrlAccessibility(url) {
    try {
        console.log('🧪 Testando acessibilidade da URL:', url);
        const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'cors'
        });
        console.log('📊 Resposta HEAD:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        return response.ok;
    } catch (error) {
        console.log('❌ Erro ao testar URL:', error);
        return false;
    }
}

// Função de fallback com iframe
function tryIframeFallback(url, title, pdfLoading, pdfCanvas, pdfControls, downloadBtn) {
    console.log('🔄 === TENTANDO FALLBACK COM IFRAME ===');
    
    if (pdfLoading) {
        pdfLoading.innerHTML = `
            <div class="text-center py-20">
                <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-verde-cultural mx-auto mb-4"></div>
                <p class="text-gray-600">Carregando ${title} (modo iframe)...</p>
            </div>
        `;
    }
    
    // Criar iframe para visualizar PDF
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    // Timeout para evitar carregamento infinito
    const timeoutId = setTimeout(() => {
        console.error('⏰ Timeout ao carregar iframe');
        if (pdfLoading) {
            pdfLoading.innerHTML = `
                <div class="text-center py-20 text-red-500">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-lg font-semibold">Timeout ao carregar PDF</p>
                    <p class="text-sm mt-2">O PDF demorou muito para carregar</p>
                    <p class="text-xs mt-2 text-gray-500">URL: ${url}</p>
                    <div class="mt-4 space-x-2">
                        <a href="${url}" target="_blank" class="inline-block px-4 py-2 bg-verde-cultural text-white rounded-lg hover:bg-verde-musgo transition-colors">
                            🔗 Abrir PDF em nova aba
                        </a>
                        <button onclick="downloadPDF('${url}', '${title}')" class="inline-block px-4 py-2 bg-cinza-verde text-white rounded-lg hover:bg-verde-musgo transition-colors">
                            🔄 Tentar novamente
                        </button>
                    </div>
                </div>
            `;
        }
    }, 10000); // 10 segundos de timeout
    
    iframe.onload = function() {
        console.log('✅ Iframe carregado com sucesso!');
        clearTimeout(timeoutId); // Cancelar timeout
        
            if (pdfLoading) {
                pdfLoading.classList.add('hidden');
            }
            if (pdfCanvas) {
            pdfCanvas.innerHTML = '';
            pdfCanvas.appendChild(iframe);
                pdfCanvas.classList.remove('hidden');
            }
            if (pdfControls) {
            pdfControls.classList.add('hidden'); // Ocultar controles de página para iframe
            }
            if (downloadBtn) {
                downloadBtn.href = url;
                downloadBtn.classList.remove('hidden');
                downloadBtn.download = `${title}.pdf`;
            }
    };
    
    iframe.onerror = function() {
        console.error('❌ Erro ao carregar iframe');
        clearTimeout(timeoutId); // Cancelar timeout
        
            if (pdfLoading) {
                pdfLoading.innerHTML = `
                    <div class="text-center py-20 text-red-500">
                        <div class="text-6xl mb-4">⚠️</div>
                        <p class="text-lg font-semibold">Erro ao carregar o PDF</p>
                    <p class="text-sm mt-2">Não foi possível carregar o PDF nem com PDF.js nem com iframe</p>
                    <p class="text-xs mt-2 text-gray-500">URL: ${url}</p>
                    <div class="mt-4 space-x-2">
                        <a href="${url}" target="_blank" class="inline-block px-4 py-2 bg-verde-cultural text-white rounded-lg hover:bg-verde-musgo transition-colors">
                            🔗 Abrir PDF em nova aba
                        </a>
                        <button onclick="downloadPDF('${url}', '${title}')" class="inline-block px-4 py-2 bg-cinza-verde text-white rounded-lg hover:bg-verde-musgo transition-colors">
                            🔄 Tentar novamente
                        </button>
                    </div>
                    </div>
                `;
            }
    };
}

// ====================================
// BAIXAR PDF (DOWNLOAD DIRETO)
// ====================================
async function downloadPDF(url, title) {
    console.log('📥 === INICIANDO DOWNLOAD DE PDF ===');
    console.log('📄 URL do PDF:', url);
    console.log('📝 Título:', title);
    
    try {
        // Obter URL segura do Firebase Storage
        const secureUrl = await getSecureDownloadUrl(url);
        console.log('🔐 URL segura obtida:', secureUrl);
        
        // Criar link de download e clicar automaticamente
        const downloadLink = document.createElement('a');
        downloadLink.href = secureUrl;
        downloadLink.download = `${title}.pdf`;
        downloadLink.target = '_blank';
        
        // Adicionar ao DOM temporariamente
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Remover do DOM
        document.body.removeChild(downloadLink);
        
        console.log('✅ Download iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao baixar PDF:', error);
    }
}

// ====================================
// NOTIFICAÇÕES
// ====================================
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // Definir cores baseadas no tipo
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-black'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="text-lg">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="font-medium">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg hover:opacity-70">×</button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// ====================================
// PAGINAÇÃO DE BOLETINS
// ====================================

function updateBoletinsButtons(totalBoletins) {
    const loadMoreBtn = document.getElementById('loadMoreBoletinsBtn');
    const showLessBtn = document.getElementById('showLessBoletinsBtn');
    
    if (!loadMoreBtn || !showLessBtn) return;
    
    // Mostrar botão "Carregar Mais" se houver mais boletins para mostrar
    if (displayedBoletinsCount < totalBoletins) {
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.classList.add('hidden');
    }
    
    // Mostrar botão "Mostrar Menos" se estiver mostrando mais que o inicial
    if (displayedBoletinsCount > boletinsPerPage) {
        showLessBtn.classList.remove('hidden');
    } else {
        showLessBtn.classList.add('hidden');
    }
}

function showAllBoletins() {
    // Abrir modal ao invés de mostrar todos inline
    showAllBoletinsGallery();
}

function showAllBoletinsGallery() {
    const modal = document.getElementById('boletins-gallery-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderBoletinsGallery(filteredBoletins);
    }
}

function closeBoletinsGalleryModal() {
    const modal = document.getElementById('boletins-gallery-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderBoletinsGallery(boletins) {
    const galleryList = document.getElementById('boletins-gallery-list');
    
    if (!galleryList) return;
    
    galleryList.innerHTML = '';
    
    if (boletins.length === 0) {
        galleryList.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum boletim encontrado</p>';
        return;
    }
    
    // Criar card para cada boletim
    boletins.forEach((boletim) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow';
        
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h5 class="font-semibold text-gray-800 text-lg mb-2">${boletim.titulo}</h5>
                    <p class="text-sm text-gray-600 mb-2">${boletim.edicao || 'Edição especial'}</p>
                    ${boletim.data ? `<p class="text-xs text-cinza-verde font-semibold mb-2">📅 ${boletim.data}</p>` : ''}
                    ${boletim.descricao ? `<p class="text-sm text-gray-500 line-clamp-2">${boletim.descricao}</p>` : ''}
                </div>
                <div class="flex flex-col gap-2 ml-4">
                    <button onclick="showBoletimDescription('${boletim.id}')" 
                            class="px-3 py-1 bg-cinza-verde text-white rounded text-sm hover:bg-verde-musgo transition-colors">
                        📖 Ver Descrição
                    </button>
                    <button onclick="downloadPDF('${boletim.pdfUrl}', '${boletim.titulo}')" 
                            class="px-3 py-1 bg-verde-musgo text-white rounded text-sm hover:bg-verde-cultural transition-colors">
                        ⬇️ Baixar PDF
                    </button>
                </div>
                </div>
            `;
        
        galleryList.appendChild(card);
    });
}

function searchBoletinsInGallery() {
    const searchInput = document.getElementById('boletim-gallery-search');
    const dateInput = document.getElementById('boletim-gallery-date');
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const dateTerm = dateInput ? dateInput.value.toLowerCase().trim() : '';
    
    let filtered = allBoletins;
    
    // Filtro por texto
    if (searchTerm) {
        filtered = filtered.filter(b => 
            b.titulo.toLowerCase().includes(searchTerm) ||
            (b.edicao && b.edicao.toLowerCase().includes(searchTerm)) ||
            (b.descricao && b.descricao.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtro por data
    if (dateTerm) {
        filtered = filtered.filter(b => 
            (b.data && b.data.toLowerCase().includes(dateTerm)) ||
            (b.edicao && b.edicao.toLowerCase().includes(dateTerm))
        );
    }
    
    renderBoletinsGallery(filtered);
}

function clearBoletimGallerySearch() {
    const searchInput = document.getElementById('boletim-gallery-search');
    const dateInput = document.getElementById('boletim-gallery-date');
    
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    renderBoletinsGallery(allBoletins);
}

function loadMoreBoletins() {
    displayedBoletinsCount += 3; // Aumentar de 3 em 3
    renderBoletins(filteredBoletins);
}

function showLessBoletins() {
    if (displayedBoletinsCount > boletinsPerPage) {
        displayedBoletinsCount -= 3; // Diminuir de 3 em 3
        if (displayedBoletinsCount < boletinsPerPage) {
            displayedBoletinsCount = boletinsPerPage;
        }
        renderBoletins(filteredBoletins);
    }
}

// ====================================
// MOSTRAR DESCRIÇÃO DO BOLETIM
// ====================================

function showBoletimDescription(boletimId) {
    const boletim = allBoletins.find(b => b.id === boletimId);
    if (!boletim) return;
    
    // Criar modal de descrição
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold text-gray-800">${boletim.titulo}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">📰 Edição</h4>
                        <p class="text-gray-600">${boletim.edicao || 'Edição especial'}</p>
                    </div>
                    
                    ${boletim.data ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">📅 Data</h4>
                        <p class="text-gray-600">${boletim.data}</p>
                    </div>
                    ` : ''}
                    
                    ${boletim.descricao ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">📝 Descrição</h4>
                        <p class="text-gray-600 leading-relaxed">${boletim.descricao}</p>
                    </div>
                    ` : ''}
                    
                    <div class="flex gap-3 pt-4">
                        <button onclick="downloadPDF('${boletim.pdfUrl}', '${boletim.titulo}'); this.closest('.fixed').remove();" 
                                class="flex-1 bg-verde-musgo text-white px-4 py-2 rounded-lg hover:bg-verde-cultural transition-colors font-semibold">
                            ⬇️ Baixar PDF
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
                </div>
            `;
    
    document.body.appendChild(modal);
}

// ====================================
// ATUALIZAR ÁREA DE DOWNLOAD
// ====================================

function updateDownloadArea(boletim) {
    const pdfTitle = document.getElementById('pdf-title');
    const downloadBtn = document.getElementById('download-btn');
    const downloadArea = document.getElementById('pdf-download-area');
    
    if (pdfTitle) {
        pdfTitle.textContent = boletim.titulo;
    }
    
    if (downloadBtn) {
        downloadBtn.href = boletim.pdfUrl;
        downloadBtn.download = `${boletim.titulo}.pdf`;
        downloadBtn.classList.remove('hidden');
    }
    
    if (downloadArea) {
        downloadArea.innerHTML = `
            <div class="text-6xl mb-4">📄</div>
            <p class="text-xl font-semibold mb-2">${boletim.titulo}</p>
            <p class="text-sm text-gray-600 mb-4">${boletim.edicao || 'Edição especial'}</p>
            <p class="text-sm text-gray-500 mb-6">
                Download iniciado! O arquivo será salvo em seu dispositivo.
            </p>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div class="flex items-center space-x-3">
                    <div class="text-2xl">✅</div>
                    <div class="text-left">
                        <p class="text-sm font-medium text-green-800">Download em andamento</p>
                        <p class="text-xs text-green-600">
                            Se o download não iniciar automaticamente, clique no botão "Baixar PDF" acima
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}


function searchBoletins() {
    const searchInput = document.getElementById('boletim-search');
    const dateInput = document.getElementById('boletim-date-search');
    
    if (!searchInput) return;
    
    currentBoletimSearch = searchInput.value.toLowerCase().trim();
    const dateSearch = dateInput ? dateInput.value.toLowerCase().trim() : '';
    
    let filtered = allBoletins;
    
    // Filtro por texto (título, edição, descrição)
    if (currentBoletimSearch) {
        filtered = filtered.filter(b => 
            b.titulo.toLowerCase().includes(currentBoletimSearch) ||
            (b.edicao && b.edicao.toLowerCase().includes(currentBoletimSearch)) ||
            (b.descricao && b.descricao.toLowerCase().includes(currentBoletimSearch))
        );
    }
    
    // Filtro por data
    if (dateSearch) {
        filtered = filtered.filter(b => 
            (b.data && b.data.toLowerCase().includes(dateSearch)) ||
            (b.edicao && b.edicao.toLowerCase().includes(dateSearch))
        );
    }
    
    // Resetar paginação ao buscar
    displayedBoletinsCount = boletinsPerPage;
    filteredBoletins = filtered;
    renderBoletins(filteredBoletins);
}

function clearBoletimSearch() {
    const searchInput = document.getElementById('boletim-search');
    const dateInput = document.getElementById('boletim-date-search');
    
    if (searchInput) {
        searchInput.value = '';
    }
    if (dateInput) {
        dateInput.value = '';
    }
    
    currentBoletimSearch = '';
    displayedBoletinsCount = boletinsPerPage;
    filteredBoletins = allBoletins;
    renderBoletins(filteredBoletins);
}

// ====================================
// RENDERIZAR PÁGINA DO PDF
// ====================================

function renderPage(num) {
    console.log('🎨 === RENDERIZANDO PÁGINA ===');
    console.log('📄 Número da página:', num);
    console.log('📚 PDF Doc disponível:', !!pdfDoc);
    
    pageRendering = true;
    
    const canvas = document.getElementById('pdf-canvas');
    if (!canvas) {
        console.error('❌ Canvas não encontrado!');
        return;
    }
    
    console.log('🖼️ Canvas encontrado:', canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ Contexto 2D não disponível!');
        return;
    }
    
    console.log('🔄 Obtendo página do PDF...');
    
    pdfDoc.getPage(num).then(function(page) {
        console.log('✅ Página obtida com sucesso:', {
            pageNumber: page.pageNumber,
            view: page.view
        });
        
        const viewport = page.getViewport({ scale: 1.5 });
        console.log('📐 Viewport calculado:', {
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale
        });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        console.log('🖼️ Canvas redimensionado:', {
            width: canvas.width,
            height: canvas.height
        });
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        console.log('🎨 Iniciando renderização...');
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            console.log('✅ Página renderizada com sucesso!');
            pageRendering = false;
            
            if (pageNumPending !== null) {
                console.log('🔄 Renderizando página pendente:', pageNumPending);
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // Atualizar número da página
            const pageNum = document.getElementById('page-num');
            if (pageNum) {
                pageNum.textContent = num;
            }
            
            console.log('🎉 Renderização concluída!');
        }).catch(function(error) {
            console.error('❌ Erro ao renderizar página:', error);
            pageRendering = false;
        });
    }).catch(function(error) {
        console.error('❌ Erro ao obter página do PDF:', error);
        pageRendering = false;
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
        'oficina': { gradient: 'from-verde-cultural to-cinza-verde', emoji: '🎨' },
        'palestra': { gradient: 'from-cinza-verde to-verde-musgo', emoji: '🎤' },
        'exposicao': { gradient: 'from-verde-musgo to-areia', emoji: '🖼️' },
        'evento': { gradient: 'from-areia to-verde-cultural', emoji: '🎉' },
        'educativa': { gradient: 'from-verde-cultural to-verde-musgo', emoji: '📚' }
    };
    
    const style = typeStyles[data.tipo] || typeStyles['evento'];
    
    // Status labels
    const statusLabels = {
        'proximas': { text: 'PRÓXIMA', color: 'text-verde-musgo-musgo' },
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
                <span class="text-verde-musgo-musgo mr-2">📅</span>
                <span class="font-semibold">${data.data || 'Data a confirmar'}</span>
            </div>
            <div class="flex items-center text-gray-600 mb-3">
                <span class="text-cinza-verde mr-2">🕐</span>
                <span>${data.horario || 'Horário a confirmar'}</span>
            </div>
            ${data.custoEntrada ? `
            <div class="flex items-center text-gray-600 mb-4">
                <span class="text-verde-cultural mr-2">💰</span>
                <span class="font-semibold ${data.custoEntrada === 'gratuita' ? 'text-green-600' : 'text-orange-600'}">
                    ${data.custoEntrada === 'gratuita' ? 'Entrada Gratuita' : `R$ ${data.valorEntrada || 'Valor a confirmar'}`}
                </span>
            </div>
            ` : ''}
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
        'oficina': { gradient: 'from-verde-cultural to-cinza-verde', emoji: '🎨' },
        'palestra': { gradient: 'from-cinza-verde to-verde-musgo', emoji: '🎤' },
        'exposicao': { gradient: 'from-verde-musgo to-areia', emoji: '🖼️' },
        'evento': { gradient: 'from-areia to-verde-cultural', emoji: '🎉' },
        'educativa': { gradient: 'from-verde-cultural to-verde-musgo', emoji: '📚' }
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
                    <div class="text-verde-musgo text-sm font-semibold mb-1">📅 Data</div>
                    <div class="text-gray-700">${data.data || 'Data a confirmar'}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-cinza-verde text-sm font-semibold mb-1">🕐 Horário</div>
                    <div class="text-gray-700">${data.horario || 'Horário a confirmar'}</div>
                </div>
            </div>
            
            ${data.custoEntrada ? `
            <div class="mb-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-gray-600 text-sm font-semibold mb-2">💰 Custo de Entrada</div>
                    <div class="text-gray-700 font-semibold ${data.custoEntrada === 'gratuita' ? 'text-green-600' : 'text-orange-600'}">
                        ${data.custoEntrada === 'gratuita' ? 'Entrada Gratuita' : `R$ ${data.valorEntrada || 'Valor a confirmar'}`}
                    </div>
                </div>
            </div>
            ` : ''}
            
            
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
    displayedActivitiesCount += 2;
    displayActivities(filteredActivities);
}

function showLessActivities() {
    if (displayedActivitiesCount > activitiesPerPage) {
        displayedActivitiesCount -= 2;
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

function searchActivitiesInGallery() {
    const searchInput = document.getElementById('activity-gallery-search');
    const dateInput = document.getElementById('activity-gallery-date');
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const dateTerm = dateInput ? dateInput.value.toLowerCase().trim() : '';
    
    let filtered = allActivities;
    
    // Filtro por texto
    if (searchTerm) {
        filtered = filtered.filter(a => 
            a.titulo.toLowerCase().includes(searchTerm) ||
            (a.descricao && a.descricao.toLowerCase().includes(searchTerm)) ||
            (a.local && a.local.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtro por data
    if (dateTerm) {
        filtered = filtered.filter(a => 
            (a.data && a.data.toLowerCase().includes(dateTerm)) ||
            (a.horario && a.horario.toLowerCase().includes(dateTerm))
        );
    }
    
    // Aplicar filtro de status atual se houver
    const activeBtn = document.querySelector('.gallery-filter-btn.active');
    if (activeBtn) {
        const btnText = activeBtn.textContent.toLowerCase();
        if (btnText.includes('próximas')) {
            filtered = filtered.filter(a => a.status === 'proximas');
        } else if (btnText.includes('realizadas')) {
            filtered = filtered.filter(a => a.status === 'realizadas');
        }
    }
    
    renderActivitiesGallery(filtered);
}

function clearActivityGallerySearch() {
    const searchInput = document.getElementById('activity-gallery-search');
    const dateInput = document.getElementById('activity-gallery-date');
    
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    // Aplicar filtro de status atual se houver
    const activeBtn = document.querySelector('.gallery-filter-btn.active');
    let filtered = allActivities;
    
    if (activeBtn) {
        const btnText = activeBtn.textContent.toLowerCase();
        if (btnText.includes('próximas')) {
            filtered = filtered.filter(a => a.status === 'proximas');
        } else if (btnText.includes('realizadas')) {
            filtered = filtered.filter(a => a.status === 'realizadas');
        }
    }
    
    renderActivitiesGallery(filtered);
}

function filterActivitiesInGallery(filter) {
    // Limpar campos de busca ao trocar filtro
    const searchInput = document.getElementById('activity-gallery-search');
    const dateInput = document.getElementById('activity-gallery-date');
    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';
    
    let filtered = [...allActivities];
    
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
            'oficina': { gradient: 'from-verde-cultural to-cinza-verde', emoji: '🎨' },
            'palestra': { gradient: 'from-cinza-verde to-verde-musgo', emoji: '🎤' },
            'exposicao': { gradient: 'from-verde-musgo to-areia', emoji: '🖼️' },
            'evento': { gradient: 'from-areia to-verde-cultural', emoji: '🎉' },
            'educativa': { gradient: 'from-verde-cultural to-verde-musgo', emoji: '📚' }
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
                <p class="text-xs text-gray-600 truncate mb-1">📅 ${activity.data || 'A confirmar'}</p>
                ${activity.custoEntrada ? `
                <p class="text-xs font-semibold truncate ${activity.custoEntrada === 'gratuita' ? 'text-green-600' : 'text-orange-600'}">
                    💰 ${activity.custoEntrada === 'gratuita' ? 'Gratuita' : `R$ ${activity.valorEntrada || 'Paga'}`}
                </p>
                ` : ''}
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

// Função de teste para diagnosticar problemas com PDFs
window.testPDFLoading = function(testUrl) {
    console.log('🧪 === TESTE DE CARREGAMENTO DE PDF ===');
    console.log('🔗 URL de teste:', testUrl);
    
    // Teste 1: Verificar se a URL responde
    fetch(testUrl, { method: 'HEAD' })
        .then(response => {
            console.log('✅ URL responde:', response.status, response.statusText);
            console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
        })
        .catch(error => {
            console.log('❌ URL não responde:', error);
        });
    
    // Teste 2: Tentar carregar com PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        console.log('📚 Testando com PDF.js...');
        const loadingTask = pdfjsLib.getDocument(testUrl);
        loadingTask.promise
            .then(pdf => {
                console.log('✅ PDF.js conseguiu carregar:', pdf.numPages, 'páginas');
            })
            .catch(error => {
                console.log('❌ PDF.js falhou:', error);
            });
    } else {
        console.log('❌ PDF.js não está disponível');
    }
    
    // Teste 3: Tentar com iframe
    const testIframe = document.createElement('iframe');
    testIframe.src = testUrl;
    testIframe.style.display = 'none';
    document.body.appendChild(testIframe);
    
    testIframe.onload = () => {
        console.log('✅ Iframe conseguiu carregar');
        document.body.removeChild(testIframe);
    };
    
    testIframe.onerror = () => {
        console.log('❌ Iframe falhou');
        document.body.removeChild(testIframe);
    };
    
    setTimeout(() => {
        if (document.body.contains(testIframe)) {
            document.body.removeChild(testIframe);
        }
    }, 5000);
};

// Tornar funções disponíveis globalmente (chamadas do HTML)
window.previousPage = previousPage;
window.nextPage = nextPage;
window.downloadPDF = downloadPDF;
window.filterActivities = filterActivities;
window.filterByStatus = filterByStatus;
window.searchActivities = searchActivities;
window.clearActivitySearch = clearActivitySearch;
window.loadMoreActivities = loadMoreActivities;
window.searchBoletins = searchBoletins;
window.clearBoletimSearch = clearBoletimSearch;
window.showBoletimDescription = showBoletimDescription;
window.showAllBoletins = showAllBoletins;
window.loadMoreBoletins = loadMoreBoletins;
window.showLessBoletins = showLessBoletins;
window.showAllBoletinsGallery = showAllBoletinsGallery;
window.closeBoletinsGalleryModal = closeBoletinsGalleryModal;
window.searchBoletinsInGallery = searchBoletinsInGallery;
window.clearBoletimGallerySearch = clearBoletimGallerySearch;
window.searchActivitiesInGallery = searchActivitiesInGallery;
window.clearActivityGallerySearch = clearActivityGallerySearch;
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

