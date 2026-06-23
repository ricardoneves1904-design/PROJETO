/**
 * stemcellsrock - Sistema de Scripts Unificado
 * Controlo da Galeria, Quantidade, Carrinho, Pagamento e Servidor MySQL
 */

// Variáveis globais para controlar o carrinho no ecrã
let totalItensNoCarrinho = 0;
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
    
    const contadorCarrinho = document.getElementById('cart-counter');
    const iconeCarrinho = document.querySelector('.cart-icon-container');

    if (!selectTamanho || !inputQuantidade || !inputId) return;

    const tamanhoSelecionado = selectTamanho.value.toUpperCase();
    const quantidadeSelecionada = parseInt(inputQuantidade.value) || 1;
    
    // Atualiza o ID global para o checkout saber qual produto foi escolhido (1 ou 2)
    idDoProdutoSelecionadoParaCheckout = parseInt(inputId.value);

    // Captura o título do produto dinamicamente (Preta ou Branca)
    const tituloProduto = principalProduto.querySelector('h1.stem-text');
    nomeDoProdutoSelecionadoParaCheckout = tituloProduto ? tituloProduto.textContent : "T-Shirt Estaminalino";

    // Atualização Visual do Contador no Topo
    totalItensNoCarrinho += quantidadeSelecionada;
    if (contadorCarrinho) contadorCarrinho.textContent = totalItensNoCarrinho;

    if (iconeCarrinho) {
        iconeCarrinho.classList.add('pulse-glow');
        setTimeout(() => iconeCarrinho.classList.remove('pulse-glow'), 1000);
    }

    alert(`Adicionamos ${quantidadeSelecionada} item(s) [Size: ${tamanhoSelecionado}] ao teu carrinho!`);

    atualizarResumoCheckout();
}

function atualizarResumoCheckout() {
    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');
    const summaryName = document.getElementById('summary-product-name'); // <--- Adicione esta linha

    if (summaryQty && summaryTotal) {
        summaryQty.textContent = totalItensNoCarrinho;
        summaryTotal.textContent = `€${(totalItensNoCarrinho * PRECO_PRODUTO).toFixed(2)}`;
    }

    // Atualiza o nome do produto no resumo do checkout
    if (summaryName && nomeDoProdutoSelecionadoParaCheckout) {
        summaryName.textContent = nomeDoProdutoSelecionadoParaCheckout;
    }
}

/* ==========================================================================
   4. LÓGICA DE PAGAMENTO SIMULADO E CHECKOUT (CONEXÃO MYSQL)
   ========================================================================== */
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

    if (totalItensNoCarrinho === 0) {
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

        // 2. Registar a Encomenda associada a esse Cliente usando o ID dinâmico
        const respostaEncomenda = await fetch('http://localhost:3000/api/encomendas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_id: dadosCliente.id,
                produto_id: idDoProdutoSelecionadoParaCheckout, // <--- Dinâmico (1 ou 2)
                quantity: totalItensNoCarrinho,
                morada: morada,
                codigo_postal: codigo_postal,
                localidade: localidade,
                pais: pais
            })
        });

        if (respostaEncomenda.ok) {
            alert(`🎉 Sucesso! Pagamento aprovado via ${metodoPagamento.toUpperCase()}. O teu material estaminal está garantido.`);
            
            // Limpa o estado da página e reinicia o carrinho
            totalItensNoCarrinho = 0;
            document.getElementById('cart-counter').textContent = "0";
            document.getElementById('checkout-form').reset();
            atualizarResumoCheckout();
            alternarCamposPagamento();
        }

    } catch (erro) {
        console.error(erro);
        alert("Erro de comunicação com o servidor. Garante que 'node server.js' está a correr.");
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