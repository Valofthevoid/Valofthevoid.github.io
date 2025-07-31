const GlobalFlags = new Map();

export default {
    toString: () => {
        return Array.from(GlobalFlags).map((kv) => `${kv[0]} => ${kv[1]}`).join("\n");
    },
    get: (flag) => GlobalFlags.get(flag),
    set: (flag, value) => GlobalFlags.set(flag, value),
    has: (flag) => GlobalFlags.has(flag),
    _map: GlobalFlags
};