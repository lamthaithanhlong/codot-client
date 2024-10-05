// ==UserScript==
// @name         Codot AIsisstant
// @namespace    codot.cw.hobovsky
// @version      0.0.9
// @description  Client facade for the Codot bot.
// @author       hobovsky
// @updateURL    https://github.com/hobovsky/codot-client/raw/main/src/codot.user.js
// @downloadURL  https://github.com/hobovsky/codot-client/raw/main/src/codot.user.js
// @match        https://www.codewars.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codewars.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      localhost
// @connect      codot-server.fly.dev
// @connect      api.openai.com
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require      https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js?version=198809
// @require      https://cdn.jsdelivr.net/npm/marked/marked.min.js
// ==/UserScript==

(function() {
    'use strict';
    let api_key = "Bearer YOUR_OPENAI_API_KEY_HERE";

    var $ = window.jQuery;
    const JQUERYUI_CSS_URL = '//ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/themes/dark-hive/jquery-ui.min.css';
    $.noConflict();
    $("head").append(`
        <link href="${JQUERYUI_CSS_URL}" rel="stylesheet" type="text/css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css" type="text/css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.default.min.css" type="text/css">
    `);

        let css = `
        .codot_panel > * {
        margin: 15px
        }
    
        .firework {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0.5em;
        height: 0.5em;
        border-radius: 50%;
        animation: firework 0.8s ease-out;
        animation-fill-mode: forwards;
        }
    
        @keyframes firework {
        0% { width: 0.5em; height: 0.5em; opacity: 1; }
        100% { width: 5em; height: 5em; opacity: 0; }
        }
    `;
    GM_addStyle(css);

    function fetchAborted() {
        console.info("Fetch aborted.", "info");
    }
    function fetchError(resp) {
        console.info("ERROR!:\n" + JSON.stringify(resp));
    }

    function getCodotServiceHeadersBase() {
        return {
            "Content-Type": "application/json"
        };
    }

    function getCodotServiceRequestBase(route) {
        return {
            _url: 'http://localhost:3000' + route,
            url: 'https://codot-server.fly.dev' + route,
            method: 'POST',
            headers: getCodotServiceHeadersBase(),
            responseType: 'json',
            onabort: fetchAborted,
            onerror: fetchError,
        }
    }

    let noises = [
        "Interesting...",
        "Oh, what is this?",
        "I think I know!",
        "No, wait...",
        "Give me a second...",
        "This code is a mess...",
        "This is a very interesting pattern here...",
        "This variable has a really cool name!",
        "This line definitely could be improved.",
        "I think this could be a bug.",
        "Is this variable unused?",
        "Inconsistent coding style spotted.",
        "Is this fragment copy/pasted?",
        "This code looks familiar...",
        "This code is not SOLID enough.",
        "This code is not DRY enough.",
        "Is this a global variable?",
        "Did anyone test this?",
        "Are these variable names meaningful enough?",
        "I'm not sure what this function is supposed to do.",
        "Is this error handling sufficient?",
        "Does this function need to be this long?",
        "I'm not entirely clear on the purpose of this block.",
        "I'm not confident about the logic in this section.",
        "I'm not entirely sure about this algorithm.",
        "Does this code follow best practices?",
        "I'm not entirely convinced by this design.",
        "Are these variables being used correctly?",
        "I think this code be simplified.",
        "There must a way to refactor this.",
        "Did anyone even test this?",
        "Is this algorithm overly complex?",
        "I think this code is not portable.",
        "Whys is this code so complex?",
        "I'm not entirely sure about the intent of this code.",
        "I'm unsure about the correctness of this logic.",
        "Are the global variables necessary?",
        "Should these variables be more descriptive?",
        "I'm not entirely convinced by the choice of algorithm.",
        "Magic numbers are bad",
        "Uncle Bob would be proud."
    ];

    function getRandomNoise() {
        return noises[Math.floor(Math.random() * noises.length)];
    }

    function createFirework() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 5; i++) {
            const firework = document.createElement('div');
            firework.classList.add('firework');
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(firework);
            setTimeout(() => {
                firework.remove();
            }, 1000);
        }
    }

    function setupHelpPanel(f) {
        jQuery('#codot-pnl-help').append(`
        <p>When your tests fail, I can take a look at your solution and help you with failed tests. Do you want me to try?</p>
        <button id='codot-help'>Yeah, go ahead</button>
        <div id='codot-help-level-selection' style='display:none;'>
            <p>Please select the level of help you need:</p>
            <div><button id='codot-help-level-1'>Level 1: Hints</button></div>
            <div><button id='codot-help-level-2'>Level 2: Partial Code</button></div>
            <div><button id='codot-help-level-3'>Level 3: Detailed Explanation</button></div>
        </div>
        <div id='codot-help-reply'></div>
        `);
    
        jQuery('#codot-help').button().on("click", function() {
            jQuery('#codot-help-level-selection').show();
            jQuery(this).hide();
        });
    
        ['1', '2', '3'].forEach(level => {
            jQuery(document).on('click', `#codot-help-level-${level}`, function() {
                let helpOutput = jQuery('#codot-help-reply');
                let randomNoise = getRandomNoise();
                jQuery('#help-copy-markdown').remove();
                helpOutput.text(`${randomNoise}`);
                
                let runner = App.instance.controller?.outputPanel?.runner;
                if(!runner || !runner.request || !runner.response) {
                    f({ reply: "You need to run tests first!" });
                    return;
                }
                let { request, response } = runner;
                let pathElems = window.location.pathname.split('/');
                let kataId    = pathElems[2];
                let userCode  = request.code;
                let language  = request.language;
                let runnerResponse = response;
    
                if(response.result?.completed){
                    f({ reply: "All your tests passed! Good job!" });
                    createFirework();
                    return;
                }
    
                let openAIRequestData = {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {role: "system", content: `You are a helpful coding assistant for Codewars kata. Provide assistance at level ${level}.
                        Level 1: Give only hints, explanations, and sample syntax.
                        Level 2: Include level 1 but also give partial pieces of code and some comments.
                        Level 3: Include level 2 but explain in really detailed manner, tell everything, and show complete samples.`},
                        {role: "user", content: `I'm working on a Codewars kata (ID: ${kataId}) in ${language}. Here's my code:
    
    ${userCode}
    
    The tests failed. Here's the test response:
    ${JSON.stringify(runnerResponse, null, 2)}
    
    Please help me understand what's wrong and how to fix it at assistance level ${level}.`}
                    ]
                };
    
                let getHelpReq = {
                    url: 'https://api.openai.com/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": api_key
                    },
                    responseType: 'json',
                    onerror: function(resp) {
                        let msg = "I am sorry, something bad happened, I am unable to help you.";
                        if(resp?.error)
                            msg += '\n\n' + resp.error;
                        f({reply: msg });
                    }
                };
    
                getHelpReq.data = JSON.stringify(openAIRequestData);
                getHelpReq.onreadystatechange = function(resp){
                    if (resp.readyState !== 4) return;
    
                    if (resp.status >= 400) {
                        f({reply: `Something went wrong!\n${resp.response?.error?.message ?? ""}`});
                        return;
                    }
    
                    const msgResp = resp.response?.choices[0]?.message?.content;
                    if(!msgResp) {
                        f({reply: "I got no response from the server, I think something went wrong."});
                        return;
                    }
                    f({reply: msgResp });
                };
    
                GM_xmlhttpRequest(getHelpReq);
            });
        });
    }
    
    function setupReviewPanel(f) {
        jQuery('#codot-pnl-review').append(`
        <p>I can perform a review of your code. Do you want me to try?</p>
        <button id='codot-review'>Yeah, go ahead</button>
        <div id='codot-review-reply'></div>
        `);
        jQuery('#codot-review').button().on("click", function() {
            let reviewOutput = jQuery('#codot-review-reply')
            let randomNoise = getRandomNoise();
            reviewOutput.text(`${randomNoise}`);
    
            let pathElems = window.location.pathname.split('/');
            let kataId    = pathElems[2];
            let solution  = jQuery('#code .CodeMirror')[0].CodeMirror.getValue();
            let language  = pathElems[4] ?? 'unknown';
    
            let openAIRequestData = {
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a helpful code reviewer for Codewars kata solutions."},
                    {role: "user", content: `Please review this ${language} code for a Codewars kata (ID: ${kataId}):
        
        ${solution}
        
        Provide a concise review focusing on code quality, efficiency, and best practices.`}
                ]
            };
    
            let getReviewReq = {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": api_key
                },
                responseType: 'json',
                onerror: function(resp) {
                    let msg = "I am sorry, something bad happened, I am unable to help you.";
                    if(resp?.error)
                        msg += '\n\n' + resp.error;
                    f({reply: msg });
                }
            };
    
            getReviewReq.data = JSON.stringify(openAIRequestData);
            getReviewReq.onreadystatechange = function(resp){
                if (resp.readyState !== 4) return;
    
                if (resp.status >= 400) {
                    f({reply: `Something went wrong!\n${resp.response?.error?.message ?? ""}`});
                    return;
                }
    
                const msgResp = resp.response?.choices[0]?.message?.content;
                if(!msgResp) {
                    f({reply: "I got no response from the server, I think something went wrong."});
                    return;
                }
                f({reply: msgResp });
            };
    
            GM_xmlhttpRequest(getReviewReq);
        });
    }
    
    function setupLinterPanel(f) {
        jQuery('#codot-pnl-lint').append(`
        <p>I can run a linter on your code and check the style of your code. Do you want me to try?</p>
        <button id='codot-lint'>Yeah, go ahead</button>
        <div id='codot-lint-reply'></div>
        `);
        jQuery('#codot-lint').button().on("click", function() {
            let randomNoise = getRandomNoise();
            jQuery('#codot-lint-reply').text(`${randomNoise}`);
            let pathElems = window.location.pathname.split('/');
            let kataId    = pathElems[2];
            let language  = pathElems[4] ?? 'unknown';
            let code      = jQuery('#code .CodeMirror')[0].CodeMirror.getValue();
    
            let openAIRequestData = {
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a helpful code linter. Analyze the code and provide a list of style issues and potential improvements."},
                    {role: "user", content: `Please lint this ${language} code for a Codewars kata (ID: ${kataId}):
        
        ${code}
        
        Provide a list of linting issues, focusing on code style, potential bugs, and best practices.`}
                ]
            };
    
            let lintReq = {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": api_key
                },
                responseType: 'json',
                onerror: function(resp) {
                    let msg = "I am sorry, something bad happened, I am unable to help you.";
                    if(resp?.error)
                        msg += '\n\n' + resp.error;
                    f({reply: msg});
                }
            };
    
            lintReq.data = JSON.stringify(openAIRequestData);
            lintReq.onreadystatechange = function(resp){
                if (resp.readyState !== 4) return;
    
                if (resp.status >= 400) {
                    f({reply: `Something went wrong!\n${resp.response?.error?.message ?? ""}`});
                    return;
                }
    
                const lintResult = resp.response?.choices[0]?.message?.content;
                if(!lintResult) {
                    f({reply: "I got no response from the server, I think something went wrong."});
                    return;
                }
    
                // Parse the lintResult into lintItems
                const lintItems = lintResult.split('\n').filter(item => item.trim() !== '').map((item, index) => ({
                    message: item,
                    ruleId: `OPENAI_LINT_${index + 1}`,
                    ruleLink: '#',
                    line: null,
                    col: null
                }));
    
                f({ lintItems });
            };
    
            GM_xmlhttpRequest(lintReq);
        });
    }

    function setupChatPanel(f) {
        jQuery('#codot-pnl-chat').append(`
            <p>Ask me any question about your code or the kata. I'll do my best to help!</p>
            <textarea id='codot-chat-input' rows='3' style='width: 100%; margin-bottom: 10px;'></textarea>
            <button id='codot-chat-send'>Send</button>
            <div id='codot-chat-reply'></div>
        `);
    
        jQuery('#codot-chat-send').button().on("click", function() {
            let chatInput = jQuery('#codot-chat-input');
            let chatOutput = jQuery('#codot-chat-reply');
            let userQuestion = chatInput.val().trim();
    
            if (userQuestion === '') {
                chatOutput.text('Please enter a question.');
                return;
            }
    
            chatOutput.text('Thinking...');
            chatInput.val('');
    
            let pathElems = window.location.pathname.split('/');
            let kataId = pathElems[2];
            let language = pathElems[4] ?? 'unknown';
            let code = jQuery('#code .CodeMirror')[0].CodeMirror.getValue();
    
            let openAIRequestData = {
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a helpful coding assistant for Codewars kata."},
                    {role: "user", content: `I'm working on a Codewars kata (ID: ${kataId}) in ${language}. Here's my code:
    
    ${code}
    
    My question is: ${userQuestion}`}
                ]
            };
    
            let chatReq = {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": api_key
                },
                responseType: 'json',
                onerror: function(resp) {
                    let msg = "I am sorry, something bad happened, I am unable to help you.";
                    if(resp?.error)
                        msg += '\n\n' + resp.error;
                    f({reply: msg});
                }
            };
    
            chatReq.data = JSON.stringify(openAIRequestData);
            chatReq.onreadystatechange = function(resp){
                if (resp.readyState !== 4) return;
    
                if (resp.status >= 400) {
                    f({reply: `Something went wrong!\n${resp.response?.error?.message ?? ""}`});
                    return;
                }
    
                const chatResult = resp.response?.choices[0]?.message?.content;
                if(!chatResult) {
                    f({reply: "I got no response from the server, I think something went wrong."});
                    return;
                }
    
                f({reply: chatResult});
            };
    
            GM_xmlhttpRequest(chatReq);
        });
    }

    function sendAuthorReviewRequest(snippets, f) {

        let pathElems = window.location.pathname.split('/');
        let kataId    = pathElems[2];
        let userId    = App.instance.currentUser.id;
        let language  = 'unknown';

         if(jQuery('#language_dd').length) {
             language = jQuery('#language_dd > dl > dd.is-active').data('language');
         } else if(jQuery('#languages').length) {
             language = jQuery('#languages > dl > dd.is-active').data('language');
         }

        const req = getCodotServiceRequestBase('/author_review');
        req.onerror = function(resp) {
            let msg = "I am sorry, something bad happened, I am unable to help you.";
            if(resp?.error)
                msg += '\n\n' + resp.error;
            f({reply: msg});
        };
        req.data = JSON.stringify({ snippets, kataId, language, userId });
        req.onreadystatechange = function(resp){
            if (resp.readyState !== 4) return;

            if (resp.status == 429) {
                f({reply: `You have to wait.\n${resp.response?.message ?? ""}`});
                return;
            } else if (resp.status == 413) {
                f({reply: `Ooohhh that's way too much for me!\n${resp.response?.message ?? ""}` });
                return;
            } else if (resp.status >= 400) {
                f({reply: `Something went wrong!\n${resp.response?.message ?? ""}`});
                return;
            }

            const reviewMessage = resp.response?.review;
            if(!reviewMessage) {
                f({reply: "I got no response from the server, I think something went wrong."});
                return;
            }
            f({reply: reviewMessage });
        };
        GM_xmlhttpRequest(req);
    }

    function showReviewDialog(fGetSnippets) {

        const dlgId = 'dlgKatauthor';
        jQuery(`#${dlgId}`).remove();
        jQuery('body').append(`
    <div id='${dlgId}' title='Katauthor Review'>
      <div id="pnlKatauthor" class='codot_panel'>
        <p>
          Before you publish your code, I can review your snippets for conformance with Codewars authoring guidelines.
          I am just a bot, but my review can help you find the most common mistakes done by unexperienced authors and translators,
          and save you negative feedback during actual review.
        </p>
        <p>Do you want me to try?</p>
        <p style='color: orange'>NOTE: kata reviews are experimental and reported remarks can be inaccurate. It is strongly recommended to consult them with documentation or Codewars community.</p>
        <button id='btnKatauthorReview'>Yeah, go ahead</button>
        <div id='katauthorReply' class='markdown prose w-full'></div>
      </div>
    </div>`);

        jQuery('#btnKatauthorReview').button().on("click", function() {
            let helpOutput = jQuery('#katauthorReply');
            helpOutput.text('');
            jQuery('#katauthor-copy-markdown').remove();
            const snippets = fGetSnippets();

            if(snippets.problem) {
                helpOutput.text(snippets.problem);
            } else {
                helpOutput.text('Please give me some time while I review your code...');
                sendAuthorReviewRequest(snippets, function(e){
                    const { reply } = e;
                    helpOutput.html(marked.parse(reply));
                    helpOutput.after('<button id="katauthor-copy-markdown">Copy as markdown to clipboard</button>');
                    jQuery('#katauthor-copy-markdown').button().on("click", function() {
                        GM_setClipboard(reply, "text");
                    });
                });
                //setTimeout(() => { clearInterval(noisesTimer); f({reply: "This is a faked answer"}); }, 10000);
            }
        });
        const dlg = jQuery('#' + dlgId).dialog({
            autoOpen: true,
            height: 600,
            width: '80%',
            modal: true,
            buttons: [
                {
                    text: "Close",
                    click: function() {
                        jQuery(this).dialog("close");
                    }
                }
            ]
        })
    }


    function showEditorReviewDialog() {

        function fGetSnippets() {
            const cmDescription      = jQuery('#write_descriptionTab .CodeMirror')[0].CodeMirror.getValue();
            const cmCompleteSolution = jQuery('#code_answer .CodeMirror')[0].CodeMirror.getValue();
            const cmSolutionStub     = jQuery('#code_setup .CodeMirror')[0].CodeMirror.getValue();
            const cmSubmissionTests  = jQuery('#code_fixture .CodeMirror')[0].CodeMirror.getValue();
            const cmExampleTests     = jQuery('#code_example_fixture .CodeMirror')[0].CodeMirror.getValue();
            const cmPreloaded        = jQuery('#code_package .CodeMirror')[0].CodeMirror.getValue();

            const snippets = {
                description:      cmDescription,
                completeSolution: cmCompleteSolution,
                solutionStub:     cmSolutionStub,
                submissionTests:  cmSubmissionTests,
                exampleTests:     cmExampleTests,
                preloaded:        cmPreloaded
            };
            return snippets;
        }

        showReviewDialog(fGetSnippets);
    }

    function showForkReviewDialog() {

        function fGetSnippets() {

            const descriptionEditor = jQuery('#code_snippet_description').parent().find('.CodeMirror')[0];
            if(!descriptionEditor) {
                return {problem: 'I cannot read the description. I need to see the description panel to be able to read it. Please make the description panel visible and try again.'};
            }
            const cmDescription      = descriptionEditor.CodeMirror.getValue();
            const cmCompleteSolution = jQuery('#code_snippet_code_field .CodeMirror')[0].CodeMirror.getValue();
            const cmSolutionStub     = jQuery('#code_snippet_setup_code_field .CodeMirror')[0].CodeMirror.getValue();
            const cmSubmissionTests  = jQuery('#code_snippet_fixture_field .CodeMirror')[0].CodeMirror.getValue();
            const cmExampleTests     = jQuery('#code_snippet_example_fixture_field .CodeMirror')[0].CodeMirror.getValue();
            const cmPreloaded        = jQuery('#code_snippet_package_field .CodeMirror')[0].CodeMirror.getValue();

            const snippets = {
                description:      cmDescription,
                completeSolution: cmCompleteSolution,
                solutionStub:     cmSolutionStub,
                submissionTests:  cmSubmissionTests,
                exampleTests:     cmExampleTests,
                preloaded:        cmPreloaded
            };
            return snippets;
        }
        showReviewDialog(fGetSnippets);
    }

    function setupEditorReview() {

        if (jQuery('#review_author_a').length)
            return;

        jQuery('#actions').children('ul').first().after("<li id='review_author_li'><a id='review_author_a'>🤖 Review</a></li>");
        jQuery('#review_author_a').on("click", function() {
            showEditorReviewDialog();
        });
    }

    function setupForkReview() {

        if (jQuery('#review_fork_a').length)
            return;

        let pathElems = window.location.pathname.split('/');
        let kataId    = pathElems[2];
        let language  = pathElems[4] ?? 'unknown';
        let userId    = App.instance.currentUser.id;
        let what1     = pathElems[1];
        let what2     = pathElems[3];

        let forkedKata = what1 == 'kata' && what2 == 'fork';
        let forkedTranslation = what1 == 'kumite' && kataId == 'new';
        if(!forkedKata && !forkedTranslation)
            return;

        jQuery('#validate_btn').parent().before("<li class='mr-15px'><a id='review_fork_a' class='btn'>🤖 Review</a></li>");
        jQuery('#review_fork_a').on("click", function() {
            showForkReviewDialog();
        });
    }

    let marker = null;
    $(document).arrive('#description_area', {existing: true, onceOnly: false}, function(elem) {

        let descriptionArea = jQuery(elem);
        let wrapper = jQuery(descriptionArea.children()[0]);
        let wrapped = wrapper.children();
        let tabBar = jQuery(wrapped[0]);
        let tabContainer = jQuery(wrapped[1]);

        let cwButtonDivs = tabBar.children();
        let cwContentDivs = tabContainer.children();
        let cwButtonsCount = cwContentDivs.length;
        let btnRestore = cwButtonDivs.last();

        btnRestore.before('<div id="codot-btn-help"  ><a class="inline-block px-4 py-2 rounded-lg">❓ Help</a><div>');
        btnRestore.before('<div id="codot-btn-lint"  ><a class="inline-block px-4 py-2 rounded-lg">🧹 Lint</a><div>');
        btnRestore.before('<div id="codot-btn-review"><a class="inline-block px-4 py-2 rounded-lg">📝 Review</a><div>');
        btnRestore.before('<div id="codot-btn-chat"><a class="inline-block px-4 py-2 rounded-lg">💬 Chat</a></div>');

        tabContainer.append('<div id="codot-pnl-help"   class="codot_panel prose md:h-full" style="display: none;"></div>');
        tabContainer.append('<div id="codot-pnl-lint"   class="codot_panel       md:h-full" style="display: none;"></div>');
        tabContainer.append('<div id="codot-pnl-review" class="codot_panel prose md:h-full" style="display: none;"></div>');
        tabContainer.append('<div id="codot-pnl-chat" class="codot_panel prose md:h-full" style="display: none;"></div>');

        let allButtonDivs  = tabBar.children();
        let allContentDivs = tabContainer.children();
        let codotElems = [
            ["#codot-btn-help",   "#codot-pnl-help"  ],
            ["#codot-btn-lint",   "#codot-pnl-lint"  ],
            ["#codot-btn-review", "#codot-pnl-review"],
            ["#codot-btn-chat",   "#codot-pnl-chat"  ]
        ];

        codotElems.forEach(([btnid, pnlid]) => {
            jQuery(btnid).children('a').on("click", function() {
                allButtonDivs.children('a').removeClass("text-ui-active-tab-text bg-ui-active-tab-bg");
                allContentDivs.hide();
                jQuery(btnid).children('a').addClass("bg-ui-active-tab-bg text-ui-active-tab-text");
                jQuery(pnlid).show();
            });
        });

        cwButtonDivs.children('a').each((idx, btn) => {
            jQuery(btn).on("click", function() {
                codotElems.forEach(([btnid, pnlid]) => {
                    jQuery(btnid).children('a').removeClass("text-ui-active-tab-text bg-ui-active-tab-bg");
                    jQuery(pnlid).hide();
                });
            });
        });

        setupHelpPanel(function(helpResult) {
            let helpOutput = jQuery('#codot-help-reply');
            let reply = helpResult.reply;
            helpOutput.html(marked.parse("Here's what I found:\n\n" + reply));
            helpOutput.after('<button id="help-copy-markdown">Copy as markdown to clipboard</button>');
            jQuery('#help-copy-markdown').button().on("click", function() {
                GM_setClipboard(reply, "text");
            });
        });

        setupLinterPanel(function(lintResult) {
            let { reply, lintItems } = lintResult;
            if(reply) {
                jQuery('#codot-lint-reply').text(reply);
            }
            if(lintItems) {
                let replyDiv = jQuery('#codot-lint-reply');
                replyDiv.append('<ol id="lintsList" style="list-style-type: decimal; list-style-position: inside"></ol>');
                let itemsList = jQuery('#lintsList');
                let cm = jQuery('#code .CodeMirror')[0].CodeMirror;
                let getMarkerPos = function(msg) {
                    let { line, col, endLine, endColumn } = msg;
                    if(!line) return null;
                    line = Math.max(0, (line ?? 0) - 1);
                    col = Math.max(0, (col ?? 0) - 1);
                    endLine = endLine ? endLine - 1 : line;
                    endColumn = endColumn ? endColumn - 1 : null;
                    return { from: { line, ch: col}, to: { line: endLine, ch: endColumn} };
                }
                lintItems.forEach((msg, idx) => {
                    itemsList.append(`<li>${msg.message} (<a target='_blank' href='${msg.ruleLink}'>${msg.ruleId}</a>) <a id='lint-msg-${idx}'>🔦</a></li>`);
                    jQuery('#lint-msg-' + idx).on("click", msg, function(e) {
                        let msg = e.data;
                        let markPos = getMarkerPos(msg);
                        if(markPos) {
                            cm.scrollIntoView(markPos.from);
                        }
                    });
                    jQuery('#lint-msg-' + idx).on("mouseenter", msg, function(e) {
                        marker?.clear();
                        let msg = e.data;
                        let markPos = getMarkerPos(msg);
                        if(markPos) {
                            marker = cm.getDoc().markText(markPos.from, markPos.to, {css: "text-decoration: spelling-error wavy red"});
                        }
                    });
                    jQuery('#lint-msg-' + idx).on("mouseleave", msg, function(e) {
                        marker?.clear();
                    });
                });
            }
        });

        setupReviewPanel(function(reviewResult) {
            jQuery('#codot-review-reply').html(marked.parse(reviewResult.reply));
        });

        setupChatPanel(function(chatResult) {
            jQuery('#codot-chat-reply').html(marked.parse(chatResult.reply));
        });
    });


    $(document).arrive('h1.page-title', {existing: true, onceOnly: false}, function(elem) {
        if(elem.textContent != "Kata Editor")
            return;

        setupEditorReview();
    });

    $(document).arrive('#validate_btn', {existing: true, onceOnly: false}, function(elem) {
        setupForkReview();
    });

})();
