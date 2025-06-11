const outputP = document.getElementById("current");

const symbols = {
    space: "&#x2002;",
    c: "&#x253F;",
    d: "&#x2501;",
    e: "&#x2578;",
    h: "&#x2500;",
    i: "&#x2502;",
    l: "&#x2518;",
    s: "&#x257A;",
    t: "&#x252F;",
    y: "&#x251C;"
};

let currentExpression = [];
let replace = [
    ["succ", ["\\", "\\", "\\", "(", 2n, "(", "(", 3n, 2n, 1n]],
    ["add", ["\\", "\\", "(", "(", 2n, "succ", 1n]],
    ["mult", ["\\", "\\", "\\", "(", 3n, "(", 2n, 1n]],
    ["pow", ["\\", "\\", "(", 1n, 2n]],
    ["true", ["\\", "\\", 2n]],
    ["not", ["\\", "(", "(", 1n, "N0", "true"]]
];
let expandDiagram = false;

let display = [];
let displayWidth = 0n
let displayHeight = 0n;

function enrichExpression() {
    function nextSubExpression(i) {
        let depth = 1n;
        while (depth > 0n) {
            switch (currentExpression[i]) {
                case "\\":
                    depth++;
                    break;
                case "(":
                    depth += 2n;
                    break;
                default:
                    break;
            }
            depth--;
            i++;
        }
        return i;
    }
    currentExpression = structuredClone(parsedExpression);
    for (let i = currentExpression.length - 1; i >= 0; i--) {
        if (currentExpression[i] == ")") {
            currentExpression.splice(i, 1);
        }
    }
    let patternNames = replace.map((e) => e[0]);
    if (expandDiagram) {
        for (let i = 0; i < currentExpression.length; i++) {
            let current = currentExpression[i];
            if (current == "\\" || current == "(" || typeof current == "bigint") {
                continue;
            }
            if (/^N(0|[1-9]\d*)$/.test(current)) {
                let n = BigInt(current.substring(1));
                let cn = ["\\", "\\"];
                for (let j = 0n; j < n; j++) {
                    cn.push("(", 2n);
                }
                cn.push(1n);
                currentExpression.splice(i, 1, cn);
                currentExpression = currentExpression.flat();
                i += Number(2n * n + 2n);
            } else {
                let patternIndex = patternNames.indexOf(current);
                if (patternIndex != -1) {
                    currentExpression.splice(i, 1, replace[patternIndex][1]);
                    currentExpression = currentExpression.flat();
                    i--;
                }
            }
        }
    }
    let first = true;
    let enrichedTypes = [];
    for (let i = 0; i < currentExpression.length; i++) {
        if (currentExpression[i] == "\\") {
            lambdaClass = "";
            if (first) {
                if (enrichedTypes.indexOf("symbol") == -1 && enrichedTypes.indexOf("variable") == -1) {
                    lambdaClass = "adjacent";
                }
                first = false;
            }
            if (lambdaClass != "adjacent") {
                if (enrichedTypes[i - 1] == "lambda") {
                    lambdaClass = "under";
                } else {
                    for (let j = i - 1; j >= 0; j--) {
                        if (currentExpression[j].type == "apply") {
                            if (currentExpression[j].function == i) {
                                let previousLambda = enrichedTypes.lastIndexOf("lambda");
                                let k = previousLambda + 1;
                                for (; k < enrichedTypes.length; k++) {
                                    if (enrichedTypes[k] != "apply") {
                                        lambdaClass = "adjacent";
                                        break;
                                    }
                                }
                                lambdaClass ||= "under";
                                break;
                            } else if (currentExpression[j].argument == i) {
                                if (currentExpression[currentExpression[j].function].type == "lambda") {
                                    lambdaClass = "aside";
                                } else {
                                    lambdaClass = "adjacent";
                                }
                                break;
                            }
                        }
                    }
                }
            }
            currentExpression[i] = {
                type: "lambda",
                position: i,
                next: nextSubExpression(i),
                px: -1,
                lambdaClass: lambdaClass
            };
            enrichedTypes.push("lambda");
        } else if (currentExpression[i] == "(") {
            let a = nextSubExpression(i + 1);
            currentExpression[i] = {
                type: "apply",
                position: i,
                function: i + 1,
                argument: a,
                next: nextSubExpression(a),
                px: -1n
            };
            enrichedTypes.push("apply");
        } else if (typeof currentExpression[i] == "bigint") {
            currentExpression[i] = {
                type: "variable",
                value: currentExpression[i],
                position: i,
                next: i + 1,
                px: -1
            };
            enrichedTypes.push("variable");
        } else {
            first = false;
            let replacableIndex = -1;
            if (/^N(0|[1-9]\d*)$/.test(currentExpression[i])) {
                replacableIndex = -2;
            } else {
                ``
                for (let j = 0; j < replace.length; j++) {
                    if (replace[j][0] == currentExpression[i]) {
                        replacableIndex = j;
                        break;
                    }
                }
            }
            currentExpression[i] = {
                type: "symbol",
                value: currentExpression[i],
                position: i,
                next: i + 1,
                px: -1,
                rI: replacableIndex
            };
            enrichedTypes.push("symbol");
        }
    }
}

function draw() {
    let stack = [];
    let applyDepth = [];
    let x = -1n;
    let y = -1n;

    display = [];
    displayWidth = 0n;
    displayHeight = 0n;

    function crosslink(i) {
        while (true) {
            let again = false;
            if (stack.length >= 1) {
                let top = currentExpression[stack.at(-1)];
                if (i == currentExpression[top.argument].next) {
                    let argX = currentExpression[top.argument].px;
                    let argY = applyDepth.pop();
                    let funX = currentExpression[top.function].px;
                    let funY = applyDepth.pop();
                    if (funY >= argY) {
                        setChar(funX, funY, symbols.y);
                        setChar(funX, funY + 1n, symbols.i);
                        for (let j = funX + 1n; j < argX; j++) {
                            setChar(j, funY, symbols.h);
                        }
                        setChar(argX, funY, symbols.l);
                        for (let j = funY - 1n; j > argY; j--) {
                            setChar(argX, j, symbols.i);
                        }
                        applyDepth.push(funY + 1n);
                    } else {
                        for (let j = funY + 1n; j < argY; j++) {
                            setChar(funX, j, symbols.i);
                        }
                        setChar(funX, argY, symbols.y);
                        setChar(funX, argY + 1n, symbols.i);
                        for (let j = funX + 1n; j < argX; j++) {
                            setChar(j, argY, symbols.h);
                        }
                        setChar(argX, argY, symbols.l);
                        applyDepth.push(argY + 1n);
                    }
                    currentExpression[stack.at(-1)].px = funX;
                    stack.pop();
                    again = true;
                }
            }
            if (again) {
                continue;
            }
            break;
        }
        let finishedLambda = false;
        for (let j = i - 1; j >= 0; j--) {
            if (currentExpression[j].type == "lambda" && i == currentExpression[j].next) {
                currentExpression[j].type = "completedLambda";
                currentExpression[j].px = currentExpression[j + 1].px;
                y--;
                finishedLambda = true;
            }
        }
        return finishedLambda;
    }

    function propagate(i) {
        for (let j = i - 1; j >= 0; j--) {
            // !A && !B <=> !(A || B)
            if (currentExpression[j].type != "lambda" && currentExpression[j].type != "apply") {
                return;
            }
            currentExpression[j].px = currentExpression[i].px;
        }
    }

    let justFinishedLambda = false;

    for (let i = 0; i < currentExpression.length; i++) {
        justFinishedLambda ||= crosslink(i);
        propagate(i);
        const current = currentExpression[i];
        switch (current.type) {
            case "lambda":
                justFinishedLambda = false;
                if (current.lambdaClass == "adjacent") {
                    x++;
                    for (let j = 0n; j <= y; j++) {
                        setChar(x, j, symbols.d);
                        setChar(x + 1n, j, symbols.d);
                        setChar(x + 2n, j, symbols.e);
                    }
                } else if (current.lambdaClass == "aside") {
                    x += 2n;
                    for (let j = 0n; j <= y; j++) {
                        setChar(x - 1n, j, symbols.d);
                        setChar(x, j, symbols.d);
                        setChar(x + 1n, j, symbols.d);
                        setChar(x + 2n, j, symbols.e);
                    }
                }
                y++;
                setChar(x, y, symbols.s);
                setChar(x + 1n, y, symbols.d);
                setChar(x + 2n, y, symbols.e);
                break;
            case "apply":
                currentExpression[i].px = x;
                stack.push(i);
                break;
            case "variable":
                if (justFinishedLambda) {
                    x++;
                }
                x++;
                justFinishedLambda = false;
                for (let j = 0n; j <= y; j++) {
                    if (getChar(x - 1n, j) == symbols.e) {
                        setChar(x - 1n, j, symbols.d);
                    }
                    if (y - j < current.value - 1n) {
                        setChar(x, j, symbols.c);
                    } else if (y - j == current.value - 1n) {
                        setChar(x, j, symbols.t);
                    } else {
                        setChar(x, j, symbols.d);
                    }
                    setChar(x + 1n, j, symbols.e);
                }
                setChar(x, y + 1n, symbols.i);
                currentExpression[i].px = x;
                propagate(i);
                applyDepth.push(y + 1n);
                break;
            case "symbol":
                if (justFinishedLambda) {
                    x++;
                }
                x++;
                justFinishedLambda = false;
                for (let j = 0; j < current.value.length; j++) {
                    for (let k = 0n; k <= y; k++) {
                        setChar(x + BigInt(j), k, symbols.d);
                    }
                    setChar(x + BigInt(j), y + 1n, current.value[j] == "<" ? "&lt;" : current.value[j], j == 0 ? (current.rI != -1 ? "<span class=\"replacable\">" : "") : "", j == current.value.length - 1 ? (current.rI != -1 ? "</span>" : "") : "");
                }
                setChar(x, y + 2n, symbols.i);
                currentExpression[i].px = x;
                propagate(i);
                x += BigInt(current.value.length);
                for (let j = 0; j <= y; j++) {
                    setChar(x, j, symbols.d);
                    setChar(x + 1n, j, symbols.e);
                }
                applyDepth.push(y + 2n);
                break;
        }
    }
    crosslink(currentExpression.length);
    outputP.innerHTML = display.map((r) => r.join("")).join("<br>");
}

function setChar(x, y, c, prefix = "", postfix = "") {
    if (x < 0n || y < 0n) {
        return;
    }
    let s = [];
    for (let i = 0n; i < displayWidth; i++) {
        s.push(symbols.space);
    }
    for (; displayHeight <= y; displayHeight++) {
        display.push(structuredClone(s));
    }
    for (; displayWidth <= x; displayWidth++) {
        for (let j = 0; j < displayHeight; j++) {
            display[j].push(symbols.space);
        }
    }
    display[y][x] = prefix + c + postfix;
}

function getChar(x, y) {
    if (x < 0n || x >= displayWidth || y < 0n || y >= displayHeight) {
        return c.space;
    }
    return display[y][x];
}

function findDeBruijnIndexLambda(i) {
    let s = currentExpression[i];
    while (s > 0) {
        i--;
        switch (currentExpression[i]) {
            case "\\":
                s--;
                break;
            case ")":
                s++;
                break;
            default:
                break;
        }
    }
    return i;
}
