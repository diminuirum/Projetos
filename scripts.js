document.addEventListener("DOMContentLoaded", () => {

    let inputTexto = document.querySelector(".input-texto"); // seleciona o primeiro elemento com essa classe
    let outputTexto = document.querySelector(".traducao");
    let btnGravar = document.getElementById("btnGravar"); // seleciona elemento pelo id
    let selectIdioma = document.querySelector(".idioma");
    let ouvindo = false;
    let timerSilencio = null;
    const tempoSilencio = 1500; // 1.5 segundos de silêncio
    

    function escreverDevagar(texto, velocidade = 25) {
        outputTexto.value = "";
        let i = 0;

        const intervalo = setInterval(() => {
            outputTexto.value += texto.charAt(i);
            ajustarAlturaTraducao();
            i++;

            if (i >= texto.length) {
                clearInterval(intervalo);
            }
        }, velocidade);
    }
    function ajustarAlturaTraducao() {
        outputTexto.style.height = "auto"
        outputTexto.style.height = outputTexto.scrollHeight + "px";
    }
    selectIdioma.addEventListener("change", () => {
        selectIdioma.classList.add("animar-idioma");

        setTimeout(() => {
            selectIdioma.classList.remove("animar-idioma");
        }, 400);
    });


    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "pt-BR"
    recognition.continuous = true
    recognition.interimResults = false


    btnGravar.addEventListener("click", () => {
        if (!ouvindo) {
            ouvindo = true;
            btnGravar.textContent = "parar";
            recognition.start(); //começa a ouvir
        } else {
            ouvindo = false;
            recognition.stop(); //para de ouvir
            btnGravar.textContent = "ouvir";
        }
    });

    recognition.onstart = () => {
        console.log("microfone ativo...")
    };

    recognition.onresult = (event) => {
        const TextoFalado = event.results[0][0].transcript
        inputTexto.value = TextoFalado
    };

    recognition.onend = () => {
        if (ouvindo) {
            recognition.start(); //reinicia o reconhecimento
        } else {
            btnGravar.textContent = "ouvir";
            traduzir(); 
        }
    };

    async function pedirPermissaoMIc() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log("Permissão para usar o microfone concedida.");
        } catch (err) {
            console.log("Permissão para usar o microfone negada:", err);
        }

    }

    async function traduzir(texto = null) {
        const textoParaTraduzir = texto || inputTexto.value.trim();
        if (!inputTexto.value.trim()) return;

        const idiomaDestino = selectIdioma.value;

        try {

            let endereco = "https://api.mymemory.translated.net/get?q="
                + encodeURIComponent(textoParaTraduzir)
                + "&langpair=pt|" + idiomaDestino;

            let resposta = await fetch(endereco);
            let dados = await resposta.json();

            escreverDevagar(dados.responseData.translatedText);
            ajustarAlturaTraducao();
            falar(dados.responseData.translatedText, idiomaDestino);

        } catch (err) {
            console.error("Erro na tradução:", err);
            outputTexto.value = "Erro ao traduzir";
        }
    }
    // --------- TEXT TO SPEECH ---------
    function falar(texto, idioma = "en") {
        const mapLang = {
            "zh-CN": "zh-CN",
            en: "en-US",
            de: "de-DE",
            es: "es-ES",
            it: "it-IT",
            fr: "fr-FR",
        };

        speechSynthesis.cancel(); // Cancela qualquer fala em andamento

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = mapLang[idioma] || "en-US";
        speechSynthesis.speak(utterance)
    }
    // Permite chamar pelo onclick do botão
    window.traduzir = traduzir;
});
