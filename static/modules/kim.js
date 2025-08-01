import { Hex } from "./hex.js";
import Conversation from "./nodes.js";
import GlobalFlags from "./flags.js";

//################//
let chatTarget;
//################//

function pause(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateStatus(text) {
    $messageStatus.textContent = text;
}

async function sendKIM(sender, message, wordcount, gold /*(unused)*/) {
    if (!message) return;
    console.log(sender);
    const senderEl = document.createElement('span');
    if (!sender) {
        sender = chatTarget.toString();
        if (wordcount && $delay.checked) {
            updateStatus(`${sender} is typing...`);
            await pause($messageWindow.children.length ? chatTarget.getTypingDelay(wordcount) : 300);
        }
    }
    else
    senderEl.classList.add(sender.name.toLowerCase());
    senderEl.textContent = sender;
    const messageDiv = document.createElement("div");
    messageDiv.className = "messageDiv";
    const contentEl = document.createElement('p');
    if (gold) contentEl.classList.add("gold");
    contentEl.textContent = message;
    const img = document.createElement('img');
    img.className = "chatpfp";
    if(typeof(sender) != "object") {
        img.src = "./static/images/pfp/"+ sender.toLowerCase() + ".jpg";
    }
    else {
        img.src = "./static/images/pfp/drifter.jpg";
    }
    const div = document.createElement('div');
    div.className = "chatMessage";
    if(typeof(sender) != "object" || sender.name != "System"){
    div.append(img);
    }
    messageDiv.append(senderEl, contentEl);
    div.append(messageDiv);

    $messageWindow.appendChild(div);
    div.scrollIntoView({ block: "nearest", inline: "nearest" });
    var messageReceive = document.getElementById('messagereceive');
    var messageSend = document.getElementById('messagesend');
    if(typeof(sender) != "object") {
        messageSend.load();
        messageReceive.volume = 0.3;
        messageReceive.load();
        messageReceive.play().catch(error => {
      console.error('Playback failed: amogus', error);
           });}
    else {
    if(typeof(sender) != "object" || sender.name != "System"){
        messageSend.volume = 0.3;
        messageSend.load();
        messageSend.play().catch(error => {
      console.error('Playback failed: amogus', error);
    });}}
    updateStatus('');
    if (wordcount && $delay.checked)
        await pause(300);
}

let optionNodes = [];
export async function chooseOption(idx) {
    let message = optionNodes[idx];
    $optionButtons.forEach((button) => {
        button.updateTextContent('');
        button.disabled = true;
    });
    await sendKIM(Drifter, message.text);
    await runNode(message.nextMajorNode || (() => { throw new Error("Choosing an option has to go somewhere!") })());
}

export function startConversation() {
    if ( localStorage.getItem("chatwith") == null || $chattopic.selectedIndex === -1) return;
    chatTarget = Hex.get($chatwith);

    $chattitle.textContent = chatTarget.toString();
    $messageWindow.replaceChildren();

    const opt = $chattopic.options[$chattopic.selectedIndex];
    getSrc(opt.dataset.whose, opt.textContent);
}

async function getSrc(target, topic) {
    const response = await fetch(`static/chats/${target}/${topic}.txt`, { cache: "no-store" });
    const data = await response.text();
    if (!data) throw new Error(`Failed to load ${target}/${topic}.txt!`);
    lockConfig();
    focusChat();
    chatTarget = Hex.get(target);
    Conversation.load(data);
    updateStatus('');
    await runNode(1);
}

async function runNode(currentNode) {
    if (!currentNode)
        throw new Error(`Can't run nothing!`);
    if (currentNode === "END") {
        await sendKIM(System, "Chat has ended.");
        updateStatus(`${chatTarget} is offline.`);
        unlockConfig();
        return Promise.resolve();
    }

    const runningNode = Conversation.nodes[currentNode];
    if (!runningNode)
        throw new Error(`Failed to find Conversation node at index ${currentNode}`);
    if (runningNode.assigns.size) {
        for (let kv of runningNode.assigns) {
            if (!$nosave.checked)
                GlobalFlags.set(kv[0], kv[1]);
            await sendKIM(System, `${kv[0]} is now ${kv[1]}.`);
        }
    }

    for (const message of runningNode.messages) {
        if (message.enabled) {
            await sendKIM(null, message.text, message.wordcount);
            let next = message.nextMajorNode;
            if (next) {
                await runNode(next);
                return Promise.resolve();
            }
        }
    }

    optionNodes = [];
    runningNode.options.forEach((option) => {
        if (!option.enabled) return;
        optionNodes.push(option);
    });
    optionNodes.forEach((option, idx) => {
        $optionButtons[idx].disabled = false;
        $optionButtons[idx].updateTextContent(option.text + (option.ends ? ' [End.]' : ''));
    });

    if (!optionNodes.length)
        throw new Error(`No endpoint following node ${currentNode}`);
}
