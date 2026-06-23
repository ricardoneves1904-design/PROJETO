/**
 * stemcellsrock - Sistema de Scripts Unificado
 * Controlo da Galeria, Quantidade, Carrinho, Pagamento e Servidor MySQL
 */

// Variáveis globais para controlar o carrinho no ecrã
let carrinho = []; // Lista que vai guardar todos os produtos adicionados
const PRECO_PRODUTO = 25.00;
// Guarda o ID do último produto que o utilizador adicionou ao carrinho
let idDoProdutoSelecionadoParaCheckout = 1; 
let nomeDoProdutoSelecionadoParaCheckout = "";

// Aguarda que todo o HTML seja carregado antes de correr as configurações iniciais
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa o estado dos botões de diminuir para todos os blocos de quantidade
    document.querySelectorAll('.product-quantity-input').forEach(bloco => {
        const input = bloco.querySelector('.product-qty-value');
        const btnDecrease = bloco.querySelector('.decrease-button');
        if (input && btnDecrease) {
            btnDecrease.disabled = (parseInt(input.value) <= 1);
        }
    });

    // Garante que o estado inicial dos campos de pagamento está correto
    if (document.querySelector('input[name="payment-method"]')) {
        alternarCamposPagamento();
    }
});

/* ==========================================================================
   1. CONTROLO DA GALERIA DE IMAGENS (Múltiplos Produtos)
   ========================================================================== */
function changeImage(element) {
    const productVisual = element.closest('.product-visual');
    if (!productVisual) return;

    const mainImg = productVisual.querySelector('.main-product-img');
    if (mainImg) {
        mainImg.src = element.src;
        mainImg.alt = element.alt;
    }

    const thumbs = productVisual.querySelectorAll('.thumb');
    thumbs.forEach(thumb => thumb.classList.remove('active'));

    element.classList.add('active');
}

/* ==========================================================================
   2. SELETOR DE QUANTIDADE CORRIGIDO (Mantém o CSS Néon Intacto)
   ========================================================================== */
function alterarQuantidade(valor, elementoBotao) {
    const blocoQuantidade = elementoBotao.closest('.product-quantity-input');
    // Tenta encontrar pela nova classe ou pelo ID antigo
    const input = blocoQuantidade.querySelector('.product-qty-value') || blocoQuantidade.querySelector('input[type="number"]');
    if (!input) return;

    let qtdAtual = parseInt(input.value) || 1;
    let novaQtd = qtdAtual + valor;
    
    if (novaQtd < 1) novaQtd = 1;
    
    input.value = novaQtd;
    
    const btnDecrease = blocoQuantidade.querySelector('.decrease-button') || blocoQuantidade.querySelector('#btn-decrease');
    if (btnDecrease) btnDecrease.disabled = (novaQtd <= 1);
}

function validarInput(elementoInput) {
    let valor = parseInt(elementoInput.value);
    if (isNaN(valor) || valor < 1) {
        elementoInput.value = 1;
        valor = 1;
    }
    
    const blocoQuantidade = elementoInput.closest('.product-quantity-input');
    const btnDecrease = blocoQuantidade.querySelector('.decrease-button') || blocoQuantidade.querySelector('#btn-decrease');
    if (btnDecrease) btnDecrease.disabled = (valor <= 1);
}

/* ==========================================================================
   3. ADICIONAR AO CARRINHO (Contextualizado por Produto)
   ========================================================================== */
async function addToCart(elementoBotao) {
    const principalProduto = elementoBotao.closest('.product-page-layout');
    if (!principalProduto) return;

    const selectTamanho = principalProduto.querySelector('select[name="size"]');
    const inputQuantidade = principalProduto.querySelector('.product-qty-value');
    const inputId = principalProduto.querySelector('input[name="product-db-id"]');
    const tituloProduto = principalProduto.querySelector('h1.stem-text');

    if (!selectTamanho || !inputQuantidade || !inputId || !tituloProduto) return;

    const idProduto = parseInt(inputId.value);
    const nomeProduto = tituloProduto.textContent;
    const tamanhoSelecionado = selectTamanho.value.toUpperCase();
    const quantidadeSelecionada = parseInt(inputQuantidade.value) || 1;

    // Procura se este produto com este tamanho já está no carrinho
    const produtoExistente = carrinho.find(item => item.id === idProduto && item.tamanho === tamanhoSelecionado);

    if (produtoExistente) {
        produtoExistente.quantidade += quantidadeSelecionada;
    } else {
        // Se for novo, adiciona à lista
        carrinho.push({
            id: idProduto,
            nome: nomeProduto,
            tamanho: tamanhoSelecionado,
            quantidade: quantidadeSelecionada
        });
    }

    // Atualiza o contador visual do topo da página
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const contadorCarrinho = document.getElementById('cart-counter');
    if (contadorCarrinho) contadorCarrinho.textContent = totalItens;

    // Animação Néon no Ícone do Carrinho
    const iconeCarrinho = document.querySelector('.cart-icon-container');
    if (iconeCarrinho) {
        iconeCarrinho.classList.add('pulse-glow');
        setTimeout(() => iconeCarrinho.classList.remove('pulse-glow'), 1000);
    }

    alert(`Adicionamos ${quantidadeSelecionada}x ${nomeProduto} [Size: ${tamanhoSelecionado}] ao teu carrinho!`);

    atualizarResumoCheckout();
}

function atualizarResumoCheckout() {
    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');
    const summaryName = document.getElementById('summary-product-name');

    // Calcula os totais combinados de todos os itens do carrinho
    const totalQtd = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const totalDinheiro = totalQtd * PRECO_PRODUTO;

    if (summaryQty) summaryQty.textContent = totalQtd;
    if (summaryTotal) summaryTotal.textContent = `€${totalDinheiro.toFixed(2)}`;

    // Cria a lista visual de produtos para o resumo
    if (summaryName) {
        if (carrinho.length === 0) {
            summaryName.innerHTML = "<div>Nenhum produto selecionado</div>";
            return;
        }

        // Gera o HTML dinâmico para cada produto diferente comprado
        summaryName.innerHTML = carrinho.map(item => `
            <div style="margin-bottom: 5px; font-size: 0.95em;">
                • ${item.quantidade}x ${item.nome} (${item.tamanho})
            </div>
        `).join('');
    }
}
/* ==========================================================================
   4. LÓGICA DE CHECKOUT MULTI-PRODUTO E PAGAMENTO (CONEXÃO MYSQL)
   ========================================================================== */

// --- FUNÇÃO RECUPERADA (ADICIONADA DE VOLTA) ---
function alternarCamposPagamento() {
    const metodoInput = document.querySelector('input[name="payment-method"]:checked');
    if (!metodoInput) return;
    
    const metodo = metodoInput.value;
    const mbwayFields = document.getElementById('mbway-fields');
    const cardFields = document.getElementById('card-fields');

    if (metodo === 'mbway') {
        if (mbwayFields) mbwayFields.style.display = 'flex';
        if (cardFields) cardFields.style.display = 'none';
        document.getElementById('mbway-phone').required = true;
        document.getElementById('card-number').required = false;
    } else {
        if (mbwayFields) mbwayFields.style.display = 'none';
        if (cardFields) cardFields.style.display = 'flex';
        document.getElementById('mbway-phone').required = false;
        document.getElementById('card-number').required = true;
    }
}

async function processarCheckout(event) {
    event.preventDefault();

    if (carrinho.length === 0) {
        alert("O teu carrinho está vazio!");
        return;
    }

    const nome = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const telefone = document.getElementById('customer-phone').value;
    const metodoPagamento = document.querySelector('input[name="payment-method"]:checked').value;
    const morada = document.getElementById('shipping-address').value;
    const codigo_postal = document.getElementById('shipping-zip').value;
    const localidade = document.getElementById('shipping-city').value;
    const pais = document.getElementById('shipping-country').value;

    const botaoSubmit = document.querySelector('.checkout-submit-btn');
    botaoSubmit.disabled = true;
    botaoSubmit.textContent = metodoPagamento === 'mbway' 
        ? "Waiting for MB WAY approval..." 
        : "Processing Card authorization...";

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // 1. Registar ou obter o ID do Cliente no MySQL
        const respostaCliente = await fetch('http://localhost:3000/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, telefone })
        });
        const dadosCliente = await respostaCliente.json();

        if (!respostaCliente.ok) throw new Error(dadosCliente.erro);

        // 2. Envia o carrinho completo para a rota múltipla
        const respostaEncomenda = await fetch('http://localhost:3000/api/encomendas/multiplas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_id: dadosCliente.id,
                itens: carrinho,
                morada: morada,
                codigo_postal: codigo_postal,
                localidade: localidade,
                pais: pais
            })
        });

        if (!respostaEncomenda.ok) {
            const textoErro = await respostaEncomenda.text();
            let mensagemErro = "Erro ao registar os produtos.";
            try {
                const jsonErro = JSON.parse(textoErro);
                mensagemErro = jsonErro.erro || mensagemErro;
            } catch(e) {
                mensagemErro = textoErro || mensagemErro;
            }
            throw new Error(mensagemErro);
        }

        // 3. Sucesso Absoluto
        alert(`🎉 Sucesso! Pagamento aprovado via ${metodoPagamento.toUpperCase()}. O teu material estaminal está garantido.`);
        
        carrinho = [];
        const contadorCarrinho = document.getElementById('cart-counter');
        if (contadorCarrinho) contadorCarrinho.textContent = "0";
        
        document.getElementById('checkout-form').reset();

        // Limpa todos os seletores de quantidade da página
        document.querySelectorAll('.product-qty-value').forEach(input => {
            input.value = 1;
        });
        document.querySelectorAll('.decrease-button, #btn-decrease').forEach(btn => {
            btn.disabled = true;
        });

        atualizarResumoCheckout();
        alternarCamposPagamento(); // <--- Agora já vai funcionar sem crashar!

    } catch (erro) {
        console.error("Erro capturado no checkout:", erro);
        alert(`Erro: ${erro.message}\nSe os dados entraram no MySQL, ignora este aviso e verifica a resposta do teu servidor.`);
    } finally {
        botaoSubmit.disabled = false;
        botaoSubmit.textContent = "Complete Purchase";
    }
}

// Função para enviar o e-mail da newsletter para o backend MySQL
async function subscreverNewsletter(event) {
    event.preventDefault();

    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value;

    try {
        const resposta = await fetch('http://localhost:3000/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert("🛸 Bem vindo ao NICHO! Confirma no teu email-inbox.");
            document.getElementById('newsletter-form').reset();
        } else {
            alert(dados.erro || "Ocorreu um erro.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro de comunicação com o servidor.");
    }
}