export class Typist {
    #name;

    constructor(name) {
        this.#name = name;
    }

    get name() {
        return this.#name;
    }

    getTypingDelay() {
        return 0;
    }

    toString() {
        return this.#name;
    }
}

export class Drifter extends Typist {
    static #instance;
    #usernameInput;

    constructor(usernameInput) {
        if (Drifter.#instance) return Drifter.#instance;

        if (!(usernameInput instanceof HTMLInputElement))
            throw new Error("Can't create object for Drifter; bad username element");

        super("Drifter");

        this.#usernameInput = usernameInput;
        Drifter.#instance = this;
    }

    toString() {
        return this.#usernameInput.value;
    }
}

export class Hex extends Typist {
    static #all = new Map();
    static typingSpeedMultiplier = 5;
    #username;
    #wpm;
    #dpw;

    constructor(name, username, wpm) {
        super(name);
        this.#username = username;

        Hex.#all.set(name, this);
        Hex.#all.set(username, this);

        if (isNaN(wpm) || wpm < 1)
            throw new Error(`Can't create object for ${name}; bad WPM`);
        this.wpm = wpm;
    }

    static get(name) {
        return Hex.#all.get(name);
    }

    get username() {
        return this.#username;
    }

    get wpm() {
        return this.#wpm;
    }

    set wpm(wpm) {
        this.#wpm = wpm;
        this.#dpw = wpm ? 60000 / (Hex.typingSpeedMultiplier * (parseInt(wpm) || 0)) : 0;
    }

    toString() {
        return this.#username;
    }

    getTypingDelay(wordcount) {
        return this.#dpw * wordcount;
    }
}