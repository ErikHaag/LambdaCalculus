const inputArea = document.getElementById("input");
const expandCheck = document.getElementById("expand");

inputArea.addEventListener("input", () => {
    if (validate(inputArea.value)) {
        enrichExpression();
        draw();
    }
});
inputArea.addEventListener("change", () => {
    inputArea.value = inputArea.value.replaceAll("\\", "λ");
});

expandCheck.addEventListener("change", () => {
    expandDiagram = expandCheck.checked;
    enrichExpression();
    draw();
});


let parsedExpression = [];

function validate(string) {
    string = string.replaceAll("λ", "\\").replaceAll("\n", "").replaceAll(" ", "")
    {
        function increment() {
            switch (progressStack.at(-1)) {
                case 0:
                    progressStack.pop()
                    progressStack.push(1)
                    break;
                case 2:
                    progressStack.pop();
                    progressStack.push(3);
                    break;
                case 1:
                case 3:
                    break;
                default:
                    return false;
            }
        }

        let progressStack = [];
        let i = 0;
        do {
            switch (string[i]) {
                case "\\":
                    if (progressStack.at(-1) == -1) {
                        progressStack.pop();
                    } else if (progressStack.at(-1) != 0 && progressStack.at(-1) != 2 && progressStack.length > 0) {
                        return false;
                    }
                    progressStack.push(-1);
                    break;
                case "(":
                    if (progressStack.at(-1) == -1) {
                        progressStack.pop();
                    }
                    progressStack.push(0);
                    break;
                case ",":
                    if (progressStack.at(-1) !== 1) {
                        return false;
                    }
                    progressStack.pop();
                    progressStack.push(2);
                    break;
                case ")":
                    if (progressStack.at(-1) != 3) {
                        return false;
                    }
                    progressStack.pop();
                    if (progressStack.length > 0) {
                        increment();
                    }
                    break;
                case undefined:
                    return false;
                default:
                    let t = true;
                    if (progressStack.at(-1) == -1) {
                        progressStack.pop();
                        t = progressStack.length > 0;
                    }
                    if (t) {
                        increment();
                    }
                    break;
            }
            i++;
        } while (progressStack.length > 0)
        if (string[i - 1] != ")") {
            while (string[i] != "\\" && string[i] != "(" && string[i] != ")" && string[i] != "," && i < string.length) {
                i++;
            }
        }
        string = string.substring(0, i);
    }
    parsedExpression = [];
    while (string.length > 0) {
        if (string[0] == "\\" || string[0] == "(" || string[0] == ")") {
            parsedExpression.push(string[0]);
            string = string.substring(1);
            continue;
        }
        if (string[0] == ",") {
            string = string.substring(1);
            continue;

        }
        let ic = string.indexOf(",");
        let ip = string.indexOf(")");
        let i = -1;
        if (ic == -1 && ip == -1) {
            i = string.length;
        } else if (ic != -1 && ic < ip) {
            i = ic;
        } else {
            i = ip;
        }
        let f = string.substring(0, i);
        if (/^\d+$/.test(f)) {
            f = BigInt(f);
        }
        parsedExpression.push(f);
        string = string.substring(i);
    }
    return true;
}