document.addEventListener("DOMContentLoaded", () => {

    const inputTexto = document.querySelector(".input-texto");
    const outputTexto = document.querySelector(".traducao");
    const btnGravar = document.getElementById("btnGravar");
    const btnCopiar = document.getElementById("btnCopiar");
    const selectOrigem = document.querySelector(".idioma-origem");
    const selectDestino = document.querySelector(".idioma-destino");

    let recognition = null;
    let ouvindo = false;
    let timerSilencio = null;
    const tempoSilencio = 700;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.continuous = !isSafari;
    }

    /* ================= MIC ================= */

    btnGravar.addEventListener("click", async () => {
        if (!recognition) {
            alert("Reconhecimento de voz não suportado.");
            return;
        }

        if (!ouvindo) {
            await pedirPermissaoMic();

            const mapLang = {
                "pt": "pt-BR",
                "en": "en-US",
                "de": "de-DE",
                "es": "es-ES",
                "fr": "fr-FR",
                "it": "it-IT",
                "zh-CN": "zh-CN"
            };
            recognition.lang = mapLang[selectOrigem.value] || "pt-BR";
            recognition.start();
            ouvindo = true;
            btnGravar.classList.add("gravando");
        } else {
            recognition.stop();
            ouvindo = false;
            btnGravar.classList.remove("gravando");
        }
    });

    if (recognition) {

        recognition.onresult = (event) => {
            const textoFalado = event.results[0][0].transcript;
            inputTexto.value = textoFalado;

            if (timerSilencio) clearTimeout(timerSilencio);

            timerSilencio = setTimeout(() => {
                if (ouvindo) {
                    ouvindo = false;
                    recognition.stop();
                    btnGravar.classList.remove("gravando");
                }
            }, tempoSilencio);
        };

        recognition.onerror = () => {
            ouvindo = false;
            btnGravar.classList.remove("gravando");
        };

        recognition.onend = () => {
            if (timerSilencio);
            timerSilencio = null

            if (ouvindo && !isSafari) {
                recognition.start();
            } else {
                ouvindo = false;
                btnGravar.classList.remove("gravando");
                traduzir();
            }
        };
    }

    /* ================= TRADUÇÃO ================= */

    async function traduzir(texto = null) {
        const textoFinal = texto || inputTexto.value.trim();
        if (!textoFinal) return;

        const origem = selectOrigem.value;
        const destino = selectDestino.value;

        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoFinal)}&langpair=${origem}|${destino}`;
            const res = await fetch(url);
            const data = await res.json();

            escreverDevagar(data.responseData.translatedText);
            falar(data.responseData.translatedText, destino);

        } catch {
            outputTexto.value = "Erro ao traduzir.";
        }
    }

    function escreverDevagar(texto) {
        outputTexto.value = "";
        let i = 0;
        const interval = setInterval(() => {
            outputTexto.value += texto.charAt(i++);
            if (i >= texto.length) clearInterval(interval);
        }, 20);
    }

    function falar(texto, idioma) {
        const map = {
            pt: "pt-BR",
            en: "en-US",
            de: "de-DE",
            es: "es-ES",
            fr: "fr-FR",
            it: "it-IT",
            "zh-CN": "zh-CN"
        };

        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = map[idioma] || "en-US";
        speechSynthesis.speak(msg);
    }

    async function pedirPermissaoMic() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch {
            alert("Permissão de microfone negada.");
        }
    }

    btnCopiar.addEventListener("click", () => {
        if (outputTexto.value) {
            navigator.clipboard.writeText(outputTexto.value);
        }
    });

    window.traduzir = traduzir;
});