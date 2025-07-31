import GlobalFlags from "./flags.js";

const DestinationRE = new RegExp(/ *(?:&(!)?([a-zA-Z]+))?>([\d|E]+)(?::([\d|E]+))?$/);
const ConditionalRE = new RegExp(/(?:&(!)?([a-zA-Z]+) )/);

//const MessageRE = new RegExp(/^((?:&\w+\s?)+)?(?:(\w+):\s+)?(.*?)(?:\s+(?:>(E|\d+)|(?:(&\w+)\s?>([\d|E]+):([\d|E]+))))?$/);

export default class Conversation {
    static #loaded = null;

    constructor() {
        this.nodes = [];
    }

    static load(chatScript) {
        const chat = new Conversation();

        let currentNode = 0;
        chatScript.split(/\n\n/gm).forEach((chunk) => {
            chunk = chunk.trim();

            let head = chunk.match(/(?<=#)\d+/);
            if (head) {
                currentNode = head[0];
                if (chat.nodes[currentNode] !== undefined)
                    throw new Error("Attempt to redefine node " + currentNode);
                chat.nodes[currentNode] = new KNode(currentNode);
            }
            else {
                let parts = chunk.match(/^Drifter: (\[)?/);
                if (parts !== null)
                    chat.nodes[currentNode].addOptions(chunk);
                else {
                    parts = chunk.match(/^(&\w+)=(TRUE|FALSE)$/);
                    if (parts !== null)
                        chat.nodes[currentNode].addAssign(parts[1], parts[2]);
                    else
                        chat.nodes[currentNode].addMessage(chunk);
                }
            }
        });

        chat.nodes.forEach((node, idx) => {
            if (!node) console.warn("Missing in sequence: " + idx);
            else console.log(node.toString());
        });
        //console.log(`Word Count: ${chat.getWordCount()}`);

        Conversation.#loaded = chat;
    }

    static get nodes() {
        return Conversation.#loaded.nodes;
    }

    toString() {
        return this.nodes.join("\n---");
    }

    getWordCount() {
        let wordcount = 0;
        this.nodes.forEach((node) => {
            node.messages.forEach((message) => {
                wordcount += (message.text.match(/\b[a-zA-Z']{1,}\b/g) || "").length
            });
            node.options.forEach((option) => {
                wordcount += (option.text.match(/\b[a-zA-Z']{1,}\b/g) || "").length
            });
        });
        return wordcount;
    }
}

class KNode {
    constructor(id) {
        this.id = id;
        this.messages = [];
        this.options = [];
        this.assigns = new Map();
    }

    static parseDestination(invert, flag, dest1, dest2) {
        // e.g. [ "!", "DummyFlag", "22", "E" ]

        if (dest1 === 'E') dest1 = 'END';
        if (dest2 === 'E') dest2 = 'END';

        // >E or >12 etc.
        if (flag === undefined)
            return dest1;

        return new KTest(new KFlag(invert, flag), dest1, dest2);
    }

    static parseLine(line) {
        let parts = line.split(DestinationRE);
        line = parts.shift();

        let next = null;
        if (parts.length)
            next = KNode.parseDestination(...parts);

        //["&DummyFlag", undefined, "DummyFlag", "&!OtherFlag", "!", "OtherFlag", "Broadsword: This is a test message."]
        parts = line.split(ConditionalRE);
        line = parts.pop();

        const flags = [];
        for (let i = 0; i < parts.length; i += 3)
            flags.push(new KFlag(parts[i + 1], parts[i + 2]));

        return [flags, line, next];
    }

    static trimSpeaker(line) {
        return line.replace(/^.*?:\s+/, "");
    }

    addAssign(flag, value) {
        this.assigns.set(flag, value === "TRUE");
    }

    addMessage(message) {
        message.split("\n").forEach((line) => {
            const args = KNode.parseLine(line);
            //args[1] = KNode.trimSpeaker(args[1]);
            this.messages.push(new KMessage(...args));
        });
    }

    addOptions(options) {
        if (this.options.length)
            throw new Error("Node " + this.id + " already has options!");

        let list = options.split(/\n\s*/);
        if (list.length === 1) {
            const args = KNode.parseLine(list[0]);
            args[1] = KNode.trimSpeaker(args[1]);
            this.options.push(new KOption(...args));
        }
        else {
            if (list[0] !== "Drifter: [")
                throw new Error(`Malformed opts head: "${list[0]}"`);
            if (list[list.length - 1] !== "]")
                throw new Error(`Malformed opts tail: "${list[list.length - 1]}"`);

            list.slice(1, -1).forEach((line) => {
                this.options.push(new KOption(...KNode.parseLine(line)));
            });
        }
    }

    toString() {
        let str = `ID: ${this.id}\nMESSAGES:\n`;
        this.messages.forEach((message) => str += message.toString().replaceAll(/^/gm, "\t") + "\n");
        str += `OPTIONS:\n`;
        this.options.forEach((option) => str += option.toString().replaceAll(/^/gm, "\t") + "\n");
        if (this.assigns.size)
            str += "ASSIGNS: " + Array.from(this.assigns).map((kv) => kv[0] + ' —> ' + kv[1]).join('; ');
        return str;
    }
}

class KMessage {
    constructor(flags, text, next) {
        this.text = text || "";
        this.next = next || null;
        this.wordcount = (this.text.match(/\b\w{2,}\b/g) || "").length

        if (flags && flags.length) {
            this.flags = flags;
            flags.forEach((flag) => {
                if (!GlobalFlags.has(flag.name))
                    GlobalFlags.set(flag.name, false);
            });
        }
    }
    get enabled() {
        return !this.flags || this.flags.every((flag) => flag.eval());
    }
    get nextMajorNode() {
        let nextMessageNode = this.next;
        while (nextMessageNode && typeof nextMessageNode === "object")
            nextMessageNode = nextMessageNode.next;
        return nextMessageNode;
    }
    toString() {
        let str = '';
        if (this.flags)
            str += "[CONDITIONAL: " + this.flags.join(" && ") + "] ";
        str += this.text;
        if (this.next) {
            str += " —> NEXT: " + this.next.toString();
        }
        return str;
    }
}

class KOption extends KMessage {
    get ends() {
        let next = this.next;
        while (next instanceof KTest)
            next = next.next;
        return next === 'END';
    }
}

class KTest {
    constructor(flag, trueNode, falseNode) {
        this.flag = flag;
        this.trueNode = trueNode || null;
        this.falseNode = falseNode || null;

        if (!GlobalFlags.has(flag.name))
            GlobalFlags.set(flag.name, false);
    }
    get enabled() {
        return true;
    }
    get next() {
        return this.flag.eval() ? this.trueNode : this.falseNode;
    }
    toString() {
        let str = this.flag + " —> TRUE: " + this.trueNode.toString();
        if (this.falseNode)
            str += "; —> FALSE: " + this.falseNode.toString();
        return str;
    }
}

class KFlag {
    constructor(invert, name) {
        this.invert = !!invert;
        this.name = name;
    }
    eval() {
        return this.invert ^ GlobalFlags.get(this.name);
    }
    toString() {
        return (this.invert ? '!' : '') + this.name;
    }
}