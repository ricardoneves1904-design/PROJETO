/**
 * stemcellsrock - Sistema de Scripts Unificado
 * Controlo da Galeria, Quantidade, Carrinho, Pagamento e Servidor MySQL
 */

// Variável global para controlar o carrinho no ecrã
let totalItensNoCarrinho = 0;
const PRECO_PRODUTO = 25.00;

// Aguarda que todo o HTML seja carregado antes de correr as configurações iniciais
document.addEventListener("DOMContentLoaded", () => {
    const inputQuantidade = document.getElementById('quantity-input');
    if (inputQuantidade) {
        atualizarBotaoMenos(parseInt(inputQuantidade.value) || 1);
    }
    // Garante que o estado inicial dos campos de pagamento está correto
    if (document.querySelector('input[name="payment-method"]')) {
        alternarCamposPagamento();
    }
});

/* ==========================================================================
   1. CONTROLO DA GALERIA DE IMAGENS (Múltiplos Produtos)
   ========================================================================== */
function changeImage(element) {
    // 1. Encontra o contentor (.product-visual) do produto que foi clicado
    const productVisual = element.closest('.product-visual');
    if (!productVisual) return;

    // 2. Procura a imagem principal APENAS dentro deste produto (usando a classe)
    const mainImg = productVisual.querySelector('.main-product-img');
    if (mainImg) {
        mainImg.src = element.src;
        mainImg.alt = element.alt;
    }

    // 3. Remove a classe 'active' APENAS das miniaturas deste produto
    const thumbs = productVisual.querySelectorAll('.thumb');
    thumbs.forEach(thumb => thumb.classList.remove('active'));

    // 4. Adiciona a classe 'active' na miniatura que foi clicada
    element.classList.add('active');
}

/* ==========================================================================
   2. SELETOR DE QUANTIDADE (NÉON INPUT)
   ========================================================================== */
function alterarQuantidade(valor) {
    const input = document.getElementById('quantity-input');
    if (!input) return;

    let qtdAtual = parseInt(input.value) || 1;
    let novaQtd = qtdAtual + valor;
    
    if (novaQtd < 1) novaQtd = 1;
    
    input.value = novaQtd;
    atualizarBotaoMenos(novaQtd);
}

function validarInput() {
    const input = document.getElementById('quantity-input');
    if (!input) return;

    let valor = parseInt(input.value);
    
    if (isNaN(valor) || valor < 1) {
        input.value = 1;
        valor = 1;
    }
    atualizarBotaoMenos(valor);
}

function atualizarBotaoMenos(quantidade) {
    const btnDecrease = document.getElementById('btn-decrease');
    if (!btnDecrease) return;

    btnDecrease.disabled = (quantidade <= 1);
}

/* ==========================================================================
   3. ADICIONAR AO CARRINHO 
   ========================================================================== */
async function addToCart() {
    const selectTamanho = document.getElementById('size');
    const inputQuantidade = document.getElementById('quantity-input');
    const contadorCarrinho = document.getElementById('cart-counter');
    const iconeCarrinho = document.querySelector('.cart-icon-container');

    if (!selectTamanho || !inputQuantidade) return;

    const tamanhoSelecionado = selectTamanho.value.toUpperCase();
    const quantidadeSelecionada = parseInt(inputQuantidade.value) || 1;

    // Atualização Visual do Contador no Topo
    totalItensNoCarrinho += quantidadeSelecionada;
    if (contadorCarrinho) contadorCarrinho.textContent = totalItensNoCarrinho;

    // Animação Néon no Ícone do Carrinho
    if (iconeCarrinho) {
        iconeCarrinho.classList.add('pulse-glow');
        setTimeout(() => iconeCarrinho.classList.remove('pulse-glow'), 1000);
    }

    alert(`Adicionamos ${quantidadeSelecionada} item(s) [Size: ${tamanhoSelecionado}] ao teu carrinho!`);

    // Atualiza os números do painel de checkout automaticamente
    atualizarResumoCheckout();
}

// Atualiza o resumo financeiro do checkout abaixo na página
function atualizarResumoCheckout() {
    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');

    if (summaryQty && summaryTotal) {
        summaryQty.textContent = totalItensNoCarrinho;
        summaryTotal.textContent = `€${(totalItensNoCarrinho * PRECO_PRODUTO).toFixed(2)}`;
    }
}

/* ==========================================================================
   4. LOGICA DE PAGAMENTO SIMULADO E CHECKOUT (CONEXÃO MYSQL)
   ========================================================================== */

// Alterna a exibição dos campos de pagamento (MB WAY / Cartão) no ecrã
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

// Processa o fecho da transação e envia os dados para o backend
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

    // --- SIMULAÇÃO VISUAL DE PAGAMENTO ---
    const botaoSubmit = document.querySelector('.checkout-submit-btn');
    botaoSubmit.disabled = true;
    botaoSubmit.textContent = metodoPagamento === 'mbway' 
        ? "Waiting for MB WAY approval..." 
        : "Processing Card authorization...";

    // Simula uma espera de rede de 2 segundos para realismo
    await new Promise(resolve => setTimeout(resolve, 2000));
    // --- FIM DA SIMULAÇÃO ---

    try {
        // 1. Registar ou obter o ID do Cliente no MySQL
        const respostaCliente = await fetch('http://localhost:3000/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, telefone })
        });
        const dadosCliente = await respostaCliente.json();

        if (!respostaCliente.ok) throw new Error(dadosCliente.erro);

        // 2. Registar a Encomenda associada a esse Cliente
        const respostaEncomenda = await fetch('http://localhost:3000/api/encomendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        cliente_id: dadosCliente.id,
        produto_id: 1, 
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