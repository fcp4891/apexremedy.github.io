(function () {
    let searchTimeout = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function sortProducts(products, sortValue) {
        if (!sortValue) {
            return products;
        }

        const sorted = [...products];
        switch (sortValue) {
            case 'price ASC':
                sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price DESC':
                sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'name ASC':
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name DESC':
                sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'created_at DESC':
            default:
                sorted.sort((a, b) => {
                    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return bDate - aDate;
                });
                break;
        }
        return sorted;
    }

    async function loadProducts() {
        if (typeof productManager === 'undefined') {
            console.warn('productManager no disponible: no se pudieron cargar productos');
            return;
        }

        try {
            if (typeof productManager.showLoading === 'function') {
                productManager.showLoading();
            }
            await productManager.loadProducts({ limit: 1000 });
            applyFilters();
        } catch (error) {
            console.error('❌ Error al cargar productos en tienda:', error);
        }
    }

    async function loadCategories() {
        if (typeof productManager === 'undefined' || typeof productManager.getCategories !== 'function') {
            return;
        }

        try {
            const select = getElement('categoryFilter');
            if (!select) return;

            const categoriesResponse = await productManager.getCategories();
            select.innerHTML = '<option value="all">Todas</option>';

            let categories = [];
            if (Array.isArray(categoriesResponse)) {
                categories = categoriesResponse;
            } else if (categoriesResponse && Array.isArray(categoriesResponse.data?.categories)) {
                categories = categoriesResponse.data.categories;
            } else if (categoriesResponse && Array.isArray(categoriesResponse.data)) {
                categories = categoriesResponse.data;
            }

            const canViewMedicinal = typeof productManager.canViewMedicinal === 'function'
                ? productManager.canViewMedicinal()
                : true;

            const addedCategories = new Set();
            const addedNames = new Set();

            categories.forEach((cat) => {
                const catSlug = typeof cat === 'string' ? cat : (cat.slug || cat.id || '');
                const catName = typeof cat === 'string' ? cat : (cat.name || catSlug);

                if (!catSlug || typeof catSlug !== 'string') {
                    console.warn('⚠️ Categoría inválida ignorada:', cat);
                    return;
                }

                if (!canViewMedicinal) {
                    const normalizedSlug = catSlug.toLowerCase();
                    const isMedicinalCategory =
                        normalizedSlug === 'medicinal' ||
                        normalizedSlug === 'medicinal-flores' ||
                        normalizedSlug === 'medicinal-aceites' ||
                        normalizedSlug === 'medicinal-concentrados' ||
                        normalizedSlug.includes('medicinal');
                    if (isMedicinalCategory) {
                        return;
                    }
                }

                const normalizedCat = catSlug.toLowerCase().trim();
                const categoryName = productManager.categoriesMap && productManager.categoriesMap.has(catSlug)
                    ? productManager.categoriesMap.get(catSlug)
                    : formatCategoryName(catSlug);
                const normalizedName = (categoryName || catName || catSlug).toLowerCase().trim();

                if (!addedCategories.has(normalizedCat) && !addedNames.has(normalizedName)) {
                    addedCategories.add(normalizedCat);
                    addedNames.add(normalizedName);
                    const option = document.createElement('option');
                    option.value = catSlug;
                    option.textContent = categoryName || catName || catSlug;
                    select.appendChild(option);
                }
            });
        } catch (error) {
            console.error('❌ Error al cargar categorías:', error);
        }
    }

    function formatCategoryName(category) {
        const names = {
            semillas_coleccion: 'Semillas de Colección',
            accesorios: 'Accesorios',
            indoors: 'Indoors',
            iluminacion: 'Iluminación',
            aditivos: 'Aditivos',
            vapo: 'Vaporizadores',
            parafernalia: 'Parafernalia',
            smartshop: 'Smartshop',
            merchandising: 'Merchandising',
            ofertas: 'Ofertas',
            medicinal: '🏥 Medicinal'
        };
        return names[category] || category;
    }

    function getActiveFilters() {
        return {
            search: getElement('searchInput')?.value || undefined,
            category: (() => {
                const value = getElement('categoryFilter')?.value;
                return value && value !== 'all' ? value : undefined;
            })(),
            minPrice: (() => {
                const value = getElement('minPrice')?.value;
                return value ? parseInt(value, 10) : undefined;
            })(),
            maxPrice: (() => {
                const value = getElement('maxPrice')?.value;
                return value ? parseInt(value, 10) : undefined;
            })(),
            inStock: getElement('inStockFilter')?.checked || undefined,
            featured: getElement('featuredFilter')?.checked || undefined
        };
    }

    function applyFilters() {
        if (typeof productManager === 'undefined' || typeof productManager.filterProducts !== 'function') {
            return;
        }

        const filters = getActiveFilters();
        const sortValue = getElement('sortBy')?.value || 'created_at DESC';
        const products = productManager.filterProducts(filters);
        const sortedProducts = sortProducts(products, sortValue);

        productManager.renderProducts(sortedProducts);

        const resultCount = getElement('resultCount');
        if (resultCount) {
            const count = sortedProducts.length;
            resultCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        }
    }

    function clearFilters(options = { closeModal: false }) {
        const searchInput = getElement('searchInput');
        const categoryFilter = getElement('categoryFilter');
        const minPrice = getElement('minPrice');
        const maxPrice = getElement('maxPrice');
        const inStock = getElement('inStockFilter');
        const featured = getElement('featuredFilter');
        const sortBy = getElement('sortBy');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (minPrice) minPrice.value = '';
        if (maxPrice) maxPrice.value = '';
        if (inStock) inStock.checked = false;
        if (featured) featured.checked = false;
        if (sortBy) sortBy.value = 'created_at DESC';

        applyFilters();

        if (options.closeModal) {
            closeFiltersModal();
        }
    }

    function setupSearch() {
        const searchInput = getElement('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(applyFilters, 500);
        });
    }

    function checkAccessButton() {
        const btn = getElement('refreshAccessBtn');
        if (!btn) return;

        if (window.authManager && typeof window.authManager.isAuthenticated === 'function' && window.authManager.isAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            const needsRefresh = user && user.role !== 'admin' &&
                (typeof user.account_status === 'undefined' || user.account_status !== 'approved');
            btn.style.display = needsRefresh ? 'block' : 'none';
            if (needsRefresh) {
                console.log('🔧 Token desactualizado - botón de actualización disponible');
            }
        } else {
            btn.style.display = 'none';
        }
    }

    function openFiltersModal() {
        const modal = getElement('filtersModal');
        const modalBody = getElement('filtersModalBody');
        const filtersCard = getElement('filtersCard');

        if (!modal || !modalBody || !filtersCard) return;

        const filtersContent = filtersCard.cloneNode(true);
        const title = filtersContent.querySelector('h2');
        if (title) title.remove();

        const buttons = filtersContent.querySelectorAll('button');
        buttons.forEach((btn) => {
            const text = (btn.textContent || '').toLowerCase();
            if (text.includes('aplicar') || text.includes('limpiar') || btn.id === 'refreshAccessBtn') {
                btn.remove();
            }
        });

        modalBody.innerHTML = '';
        modalBody.appendChild(filtersContent);

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeFiltersModal() {
        const modal = getElement('filtersModal');
        if (!modal) return;

        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function handleEscClose(event) {
        if (event.key === 'Escape') {
            closeFiltersModal();
        }
    }

    function toggleFiltersButton() {
        const btn = getElement('openFiltersBtn');
        if (!btn) return;

        if (window.innerWidth <= 767) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    }

    function attachFilterEvents() {
        const applyBtn = document.querySelector('[data-action="apply-filters"]');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }

        const clearBtn = document.querySelector('[data-action="clear-filters"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => clearFilters());
        }

        const refreshBtn = document.querySelector('[data-action="refresh-access"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                if (typeof refreshUserToken === 'function') {
                    await refreshUserToken();
                }
                checkAccessButton();
            });
        }

        const openModalBtn = document.querySelector('[data-action="open-filters-modal"]');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', openFiltersModal);
        }

        document.querySelectorAll('[data-action="close-filters-modal"]').forEach((el) => {
            el.addEventListener('click', closeFiltersModal);
        });

        const modalClearBtn = document.querySelector('[data-action="clear-filters-modal"]');
        if (modalClearBtn) {
            modalClearBtn.addEventListener('click', () => clearFilters({ closeModal: true }));
        }

        const modalApplyBtn = document.querySelector('[data-action="apply-filters-modal"]');
        if (modalApplyBtn) {
            modalApplyBtn.addEventListener('click', () => {
                applyFilters();
                closeFiltersModal();
            });
        }

        const categoryFilter = getElement('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', applyFilters);
        }

        const minPrice = getElement('minPrice');
        const maxPrice = getElement('maxPrice');
        if (minPrice) {
            minPrice.addEventListener('change', applyFilters);
        }
        if (maxPrice) {
            maxPrice.addEventListener('change', applyFilters);
        }

        const inStock = getElement('inStockFilter');
        const featured = getElement('featuredFilter');
        if (inStock) {
            inStock.addEventListener('change', applyFilters);
        }
        if (featured) {
            featured.addEventListener('change', applyFilters);
        }

        const sortBy = getElement('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', applyFilters);
        }
    }

    function attachLegacyModalHandlers() {
        document.querySelectorAll('[onclick="closeProductModalOnOverlay(event)"]').forEach((el) => {
            el.removeAttribute('onclick');
            el.addEventListener('click', (event) => {
                if (typeof closeProductModalOnOverlay === 'function') {
                    closeProductModalOnOverlay(event);
                }
            });
        });

        document.querySelectorAll('[onclick="event.stopPropagation()"]').forEach((el) => {
            el.removeAttribute('onclick');
            el.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        document.querySelectorAll('[onclick="closeProductModal()"]').forEach((el) => {
            el.removeAttribute('onclick');
            el.addEventListener('click', () => {
                if (typeof closeProductModal === 'function') {
                    closeProductModal();
                }
            });
        });

        document.querySelectorAll('[onclick="addToCartFromModal()"]').forEach((el) => {
            el.removeAttribute('onclick');
            el.addEventListener('click', () => {
                if (typeof addToCartFromModal === 'function') {
                    addToCartFromModal();
                }
            });
        });
    }

    function toggleSectionsByAuth() {
        const registroSection = getElement('registro-catalogo');
        const userNotice = getElement('unregistered-user-notice');

        const isLoggedIn = (function () {
            if (window.authManager && typeof window.authManager.isAuthenticated === 'function') {
                return window.authManager.isAuthenticated();
            }
            return false;
        })();

        if (registroSection) {
            registroSection.style.display = isLoggedIn ? 'none' : 'block';
        }

        if (userNotice) {
            userNotice.style.display = isLoggedIn ? 'none' : 'block';
        }

        console.log('Estado de autenticación:', isLoggedIn ? '✅ Logueado' : '❌ No logueado');
    }

    async function initializePage() {
        attachFilterEvents();
        attachLegacyModalHandlers();
        setupSearch();
        document.addEventListener('keydown', handleEscClose);

        await loadProducts();
        await loadCategories();
        setTimeout(checkAccessButton, 1000);

        toggleFiltersButton();
        window.addEventListener('resize', toggleFiltersButton);
        toggleSectionsByAuth();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initializePage().catch((error) => {
            console.error('❌ Error inicializando tienda:', error);
        });
    });
})();


