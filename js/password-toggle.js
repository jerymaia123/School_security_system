// Adds an eye button to every password box: click to show, click again to hide.
(function () {
    const style = document.createElement("style");
    style.textContent =
        ".pw-wrap{position:relative}.pw-wrap input{padding-right:46px}" +
        ".pw-wrap button.pw-toggle{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;" +
        "margin:0;padding:0;border:0;border-radius:8px;background:transparent;color:#70778A;display:grid;place-items:center;cursor:pointer}" +
        ".pw-wrap button.pw-toggle:hover{background:#F3EEFF;color:#6D57BF}";
    document.head.appendChild(style);

    const svg = (inner) => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
    const EYE = svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>');
    const EYE_OFF = svg('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>');

    document.querySelectorAll('input[type="password"]').forEach((input) => {
        const wrap = document.createElement("div");
        wrap.className = "pw-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pw-toggle";
        btn.setAttribute("aria-label", "Show password");
        btn.setAttribute("aria-pressed", "false");
        btn.innerHTML = EYE;
        btn.onclick = () => {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.innerHTML = show ? EYE_OFF : EYE;
            btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
            btn.setAttribute("aria-pressed", String(show));
        };
        wrap.appendChild(btn);
    });
})();
