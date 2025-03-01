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
// @connect      api.night-api.com
// @connect      us-central1-dreampen-2273f.cloudfunctions.net
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require      https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js?version=198809
// @require      https://cdn.jsdelivr.net/npm/marked/marked.min.js
// ==/UserScript==

(function() {
    'use strict';
    let api_key = "Bearer YOUR_OPENAI_API_KEY_HERE";
    let night_api_key = "YOUR_NIGHT_API_KEY_HERE";

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

        #codot-help-level-selection button {
            display: inline-block;
            width: auto;
            padding: 8px 12px;
            margin: 5px;
            border: none;
            border-radius: 4px;
            background-color: #4CAF50;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
    
        #codot-help-level-selection button:hover {
            background-color: #45a049;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
    
        #codot-help-level-selection button:active {
            transform: translateY(1px);
        }
    
        #codot-help-level-1 { background-color: #2196F3; }
        #codot-help-level-1:hover { background-color: #1e87db; }
    
        #codot-help-level-2 { background-color: #FFC107; }
        #codot-help-level-2:hover { background-color: #e6ae06; }
    
        #codot-help-level-3 { background-color: #FF5722; }
        #codot-help-level-3:hover { background-color: #e64a19; }
    
        #codot-help-level-selection {
            text-align: center;
        }

        #partner-display > div > a:nth-child(1) > img {
            transition: transform 0.3s ease-in-out;
        }
    
        #partner-display > div > a:nth-child(1) > img:hover {
            transform: scale(0.9);
        }

        #toggle-image-helper-btn {
            'background-color': '#4CAF50',
            'color': 'white',
            'border': 'none',
            'padding': '10px 20px',
            'text-align': 'center',
            'text-decoration': 'none',
            'display': 'inline-block',
            'font-size': '16px',
            'margin': '4px 2px',
            'cursor': 'pointer',
            'border-radius': '8px',
            'transition': 'background-color 0.3s ease'
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

    // Attach a click event listener to the #validate_btn
    jQuery('#validate_btn').on('click', function() {
        const targetNode = document.querySelector('#fixture > div.text-editor.js-editor.has-shadow > div.CodeMirror.cm-s-codewars');

        if (!targetNode) {
            console.error('Target node not found');
            return;
        }

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && targetNode.classList.contains('has-green-border')) {
                    createFirework(); // Trigger the firework effect
                    observer.disconnect(); // Stop observing after the firework is triggered
                }
            }
        });

        observer.observe(targetNode, { attributes: true, attributeFilter: ['class'] });
    });

    function getRandomNoise() {
        return noises[Math.floor(Math.random() * noises.length)];
    }

    function createFirework() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 10; i++) {
            const firework = document.createElement('div');
            firework.classList.add('firework');
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(firework);
            setTimeout(() => {
                firework.remove();
            }, 2000);
        }
    }

    function getNightImage(type, callback) {
        // Check if callback is a function
        if (typeof callback !== 'function') {
            console.error('Callback must be a function');
            return;
        }
    
        const types = ['ass', 'boobs', 'pussy'];
        const selectedType = type ? type : types[Math.floor(Math.random() * types.length)];
    
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.night-api.com/images/nsfw/${selectedType}`,
            headers: {
                'authorization': night_api_key
            },
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    if (data.content && data.content.url) {
                        callback(null, data.content.url);
                    } else {
                        callback('No image URL found in the response', null);
                    }
                } else {
                    callback(`Error: ${response.status}`, null);
                }
            },
            onerror: function(error) {
                callback(`Request failed: ${error}`, null);
            }
        });
    }

    function setupHelpPanel(f) {
        let isApiCallInProgress = false;
    
        jQuery('#codot-pnl-help').append(`
            <p>When your tests fail, I can take a look at your solution and help you with failed tests. Do you want me to try?</p>
            <button id='codot-help'>Yeah, go ahead</button>
            <button id='codot-analyze-line'>Analyze Line</button>
            <button id='toggle-image-helper-btn' class='ui-button ui-corner-all ui-widget'>Show Image</button>
            <div id='codot-help-level-selection' style='display:none;'>
                <p>Please select the level of help you need:</p>
                <button id='codot-help-level-1'>Level 1: Hints</button>
                <button id='codot-help-level-2'>Level 2: Partial Code</button>
                <button id='codot-help-level-3'>Level 3: Detailed Explanation</button>
            </div>
            <div id='codot-help-reply'></div>
            <div id='codot-current-result' style='margin-top: 10px;'></div>
            <div id='codot-image-helper'>
                <div id='loading-indicator' style='display: none; text-align: center; margin-top: 10px;'>Loading...</div>
                <img src="https://www.google.com/s2/favicons?sz=64&domain=codewars.com" alt="Description of image" style="display: none; max-width: 100%; height: auto;">
            </div>
        `);
    
        jQuery('#codot-help').button().on("click", function() {
            jQuery('#codot-help-level-selection').show();
            jQuery(this).hide();
        });

        jQuery('#codot-analyze-line').button().on("click", function() {
            let cm = jQuery('#code .CodeMirror')[0].CodeMirror;
            let cursor = cm.getCursor();
            let lineContent = cm.getLine(cursor.line);
        
            let openAIRequestData = {
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "You are a helpful coding assistant. Analyze the following line of code and explain its purpose or value. and give me result or example output and result. If the line of code is not valid, explain why it is not valid."},
                    {role: "user", content: `Here's the line of code I want to analyze:
        
        ${lineContent}
        
        Please explain its purpose or value.`}
                ]
            };
        
            let analyzeLineReq = {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": api_key
                },
                responseType: 'json',
                onerror: function(resp) {
                    let msg = "I am sorry, something bad happened, I am unable to help you.";
                    if (resp?.error)
                        msg += '\n\n' + resp.error;
                    jQuery('#codot-current-result').text(msg);
                }
            };
        
            analyzeLineReq.data = JSON.stringify(openAIRequestData);
            analyzeLineReq.onreadystatechange = function(resp) {
                if (resp.readyState !== 4) return;
        
                if (resp.status >= 400) {
                    jQuery('#codot-current-result').text(`Something went wrong!\n${resp.response?.error?.message ?? ""}`);
                    return;
                }
        
                const msgResp = resp.response?.choices[0]?.message?.content;
                if (!msgResp) {
                    jQuery('#codot-current-result').text("I got no response from the server, I think something went wrong.");
                    return;
                }
                jQuery('#codot-current-result').html(marked.parse(msgResp));
            };
        
            GM_xmlhttpRequest(analyzeLineReq);
        });
    
        function makeApiCall(level) {
            if (isApiCallInProgress) return;
    
            isApiCallInProgress = true;
            jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', true);
    
            let helpOutput = jQuery('#codot-help-reply');
            let randomNoise = getRandomNoise();
            jQuery('#help-copy-markdown').remove();
            helpOutput.text(`${randomNoise}`);
            
            let runner = App.instance.controller?.outputPanel?.runner;
            if(!runner || !runner.request || !runner.response) {
                f({ reply: "You need to run tests first!" });
                isApiCallInProgress = false;
                jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', false);
                return;
            }
            let { request, response } = runner;
            let pathElems = window.location.pathname.split('/');
            let kataId    = pathElems[2];
            let userCode  = request.code;
            let language  = request.language;
            let runnerResponse = response;
    
            if(response.result?.completed){
                getNightImage(null, function(error, imageUrl) {
                    if (error) {
                        console.error("Error fetching image:", error);
                        f({ reply: "All your tests passed! Good job!" });
                    } else if (imageUrl) {
                        const message = "Congratulations! All your tests passed. Here's a celebratory image:";
                        const imageHtml = `
                            <div id="celebratory-image-container">
                                <button id="toggle-image-btn">Show Image</button>
                                <img src="${imageUrl}" alt="Celebratory image" style="max-width: 100%; height: auto; display: none;">
                            </div>
                        `;
                        jQuery('#codot-help-reply').html(`${message}<br><br>${imageHtml}`);
                        
                        // Add event listener to the toggle button
                        setTimeout(() => {
                            const toggleBtn = document.getElementById('toggle-image-btn');
                            const img = toggleBtn.nextElementSibling;
                            toggleBtn.addEventListener('click', () => {
                                if (img.style.display === 'none') {
                                    img.style.display = 'block';
                                    toggleBtn.textContent = 'Hide Image';
                                } else {
                                    img.style.display = 'none';
                                    toggleBtn.textContent = 'Show Image';
                                }
                            });
                        }, 0);
                    } else {
                        f({ reply: "All your tests passed! Good job!" });
                    }
                    createFirework();
                });
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
                    isApiCallInProgress = false;
                    jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', false);
                }
            };
    
            getHelpReq.data = JSON.stringify(openAIRequestData);
            getHelpReq.onreadystatechange = function(resp){
                if (resp.readyState !== 4) return;
    
                if (resp.status >= 400) {
                    f({reply: `Something went wrong!\n${resp.response?.error?.message ?? ""}`});
                    isApiCallInProgress = false;
                    jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', false);
                    return;
                }
    
                const msgResp = resp.response?.choices[0]?.message?.content;
                if(!msgResp) {
                    f({reply: "I got no response from the server, I think something went wrong."});
                    isApiCallInProgress = false;
                    jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', false);
                    return;
                }
                f({reply: msgResp });
                isApiCallInProgress = false;
                jQuery('#codot-help-level-1, #codot-help-level-2, #codot-help-level-3').prop('disabled', false);
            };
    
            GM_xmlhttpRequest(getHelpReq);
        }
    
        ['1', '2', '3'].forEach(level => {
            jQuery(document).on('click', `#codot-help-level-${level}`, function() {
                makeApiCall(level);
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
                
                // Prepare the OpenAI API request
                let openAIRequestData = {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {role: "system", content: "You are a helpful code reviewer for Codewars kata solutions. Review the provided code snippets for conformance with Codewars authoring guidelines."},
                        {role: "user", content: `Please review these code snippets for a Codewars kata:
    
    Description:
    ${snippets.description}
    
    Complete Solution:
    ${snippets.completeSolution}
    
    Solution Stub:
    ${snippets.solutionStub}
    
    Submission Tests:
    ${snippets.submissionTests}
    
    Example Tests:
    ${snippets.exampleTests}
    
    Preloaded:
    ${snippets.preloaded}
    
    Provide a detailed review focusing on common mistakes, best practices, and conformance with Codewars authoring guidelines.`}
                    ]
                };
    
                let reviewReq = {
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
                        helpOutput.text(msg);
                    }
                };
    
                reviewReq.data = JSON.stringify(openAIRequestData);
                reviewReq.onreadystatechange = function(resp){
                    if (resp.readyState !== 4) return;
    
                    if (resp.status >= 400) {
                        helpOutput.text(`Something went wrong!\n${resp.response?.error?.message ?? ""}`);
                        return;
                    }
    
                    const reviewMessage = resp.response?.choices[0]?.message?.content;
                    if(!reviewMessage) {
                        helpOutput.text("I got no response from the server, I think something went wrong.");
                        return;
                    }
                    
                    helpOutput.html(marked.parse(reviewMessage));
                    helpOutput.after('<button id="katauthor-copy-markdown">Copy as markdown to clipboard</button>');
                    jQuery('#katauthor-copy-markdown').button().on("click", function() {
                        GM_setClipboard(reviewMessage, "text");
                    });
                };
    
                GM_xmlhttpRequest(reviewReq);
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
        });
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
            function getCodeMirrorValue(selector) {
                const element = jQuery(selector).find('.CodeMirror')[0];
                return element && element.CodeMirror ? element.CodeMirror.getValue() : '';
            }
        
            const snippets = {
                description:      getCodeMirrorValue('#code_snippet_description') || getCodeMirrorValue('#write_descriptionTab'),
                completeSolution: getCodeMirrorValue('#code_snippet_code_field') || getCodeMirrorValue('#code_answer'),
                solutionStub:     getCodeMirrorValue('#code_snippet_setup_code_field') || getCodeMirrorValue('#code_setup'),
                submissionTests:  getCodeMirrorValue('#code_snippet_fixture_field') || getCodeMirrorValue('#code_fixture'),
                exampleTests:     getCodeMirrorValue('#code_snippet_example_fixture_field') || getCodeMirrorValue('#code_example_fixture'),
                preloaded:        getCodeMirrorValue('#code_snippet_package_field') || getCodeMirrorValue('#code_package')
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
            
            // Remove existing copy button before adding a new one
            jQuery('#help-copy-markdown').remove();
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
    function setupPornPenAIPanel() {
        console.log("Setting up PornPen AI panel");
    
        const imageCache = []; // Initialize an array to store fetched images
    
        function fetchAndDisplayImages() {
            console.log("Fetching PornPen AI images");
    
            if (imageCache.length > 0) {
                // Use an image from the cache
                const imageUrl = imageCache.shift(); // Get and remove the first image from the cache
                displayImage(imageUrl);
            } else {
                // Cache is empty, fetch new images
                fetchImages();
            }
        }
    
        function fetchImages() {
            const tags = [
                'age_30s', 'age_20s' ,'tags_busty', 'base_celebrity', 'tags_blonde', 'tags_asian', 
                'tags_beautiful', 'tags_glasses', 'tags_perfect_boobs', 'tags_perfect_body', 
                'tags_japanese', 'tags_korean', 'tags_vietnamese', 'tags_black_hair', 
                'base_celebrity', 'base_model', 'clothes_topless', 'clothes_partially_nude'
            ];
    
            const generators = [
                'women_real', 'women_accurate', 'women_crisp', 'women_photography'
            ];
    
            // Randomly select 1-3 tags
            const selectedTags = [];
            const numTags = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numTags; i++) {
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                if (!selectedTags.includes(randomTag)) {
                    selectedTags.push(randomTag);
                }
            }
    
            // Randomly select a generator
            const selectedGenerator = generators[Math.floor(Math.random() * generators.length)];
    
            function makeRequest(url) {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                        "accept": "*/*",
                        "accept-language": "en,en-GB-oxendict;q=0.9,vi;q=0.8",
                        "cache-control": "no-cache",
                        "origin": "https://pornpen.ai",
                        "pragma": "no-cache",
                        "referer": "https://pornpen.ai/",
                        "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"macOS"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site",
                        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
                    },
                    data: JSON.stringify({
                        "data": {
                            "tags": selectedTags,
                            "generator": selectedGenerator,
                            "source": "search"
                        }
                    }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            console.log("Response:", data);
                            if (data.result && data.result.length > 0) {
                                // Store all images in the cache
                                data.result.forEach(item => imageCache.push(item.imageUrl));
                                // Display the first image from the newly fetched images
                                const imageUrl = imageCache.shift();
                                displayImage(imageUrl);
                            } else {
                                console.log('No images found.');
                            }
                        } else {
                            console.log('Error fetching images.');
                        }
                    },
                    onerror: function(error) {
                        console.log('Request failed: ' + error);
                        if (url === 'https://us-central1-dreampen-2273f.cloudfunctions.net/search') {
                            console.log('Retrying with staging URL...');
                            makeRequest('https://us-central1-dreampen-2273f.cloudfunctions.net/stagingSearch');
                        }
                    }
                });
            }
    
            // Initial request
            makeRequest('https://us-central1-dreampen-2273f.cloudfunctions.net/search');
        }
    
        function displayImage(imageUrl) {
            jQuery('#partner-display > div > a:nth-child(1) > img').attr('src', imageUrl);          
            jQuery('#toggle-image-helper-btn').hover(
                function() {
                    jQuery(this).css('background-color', '#45a049'); // Darker green on hover
                },
                function() {
                    if(imageUrl!== '') {
                        jQuery(this).css('background-color', '#4CAF50'); // Original green when not hovered
                    }
                }
            );
            jQuery('#code_challenges.play_view .description-footer .cw-ad__img, #code_challenges.play_view .description-footer .ea-content img').css({
                'min-width': '120px',
                'min-height': '100px',
                'margin-top': '-30px'
            });

            setTimeout(() => {
                const toggleBtn = document.getElementById('toggle-image-helper-btn');
                const img = jQuery('#codot-image-helper img');
                const loadingIndicator = jQuery('#loading-indicator');
            
                function preloadImage(url, callback) {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.attr('src', url);
                        callback();
                    };
                    tempImg.onerror = () => {
                        console.error('Failed to load image:', url);
                    };
                    tempImg.src = url;
                }
            
                // Start fetching the image immediately
                loadingIndicator.show();
                preloadImage(imageUrl, () => {
                    loadingIndicator.hide();
                    img.css('opacity', '1'); // Ensure the image is visible after loading
                });
            
                // Allow user to toggle image display
                toggleBtn.addEventListener('click', () => {
                    const isHidden = img.css('display') === 'none';
                    img.css('display', isHidden ? 'block' : 'none');
                    toggleBtn.textContent = isHidden ? 'Hide Image' : 'Show Image';
                });
            }, 0);

            // CSS for smooth transitions and dark effect
            jQuery('#partner-display > div > a:nth-child(1) > img').css({
                'transition': 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
                'opacity': '1', // Ensure the image starts visible
                'filter': 'brightness(0%)' // Apply dark effect
            });
            
            // Remove dark effect on hover
            jQuery('#partner-display > div > a:nth-child(1) > img').hover(
                function() {
                    jQuery(this).css('filter', 'brightness(100%)');
                },
                function() {
                    jQuery(this).css('filter', 'brightness(0%)');
                }
            );
            
            // CSS for smooth transitions and dark effect
            jQuery('#codot-image-helper img').css({
                'transition': 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
                'opacity': '1', // Ensure the image starts visible
                'filter': 'brightness(0%)' // Apply dark effect
            });
            
            // Remove dark effect on hover
            jQuery('#codot-image-helper img').hover(
                function() {
                    jQuery(this).css('filter', 'brightness(100%)');
                },
                function() {
                    jQuery(this).css('filter', 'brightness(0%)');
                }
            );
                                    

            console.log("Image displayed successfully:", imageUrl);
        }
    
        // Fetch and display images immediately
        fetchAndDisplayImages();
    
        // Set up an interval to fetch and display images every 10 seconds
        setInterval(fetchAndDisplayImages, 8000);
    }
    

    // Call setupPornPenAIPanel when the document is ready
    $(document).ready(function() {
        console.log("Loaded codot.user.js");
        setupPornPenAIPanel();
    });

})();
