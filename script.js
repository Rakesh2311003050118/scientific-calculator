const result = document.getElementById("res");

/* ---------- UI helpers ---------- */
function Solve(val) {
  result.value += val;
}
function Clear() {
  result.value = "";
}
function Back() {
  result.value = result.value.slice(0, -1);
}

/* ---------- Math helpers (degrees) ---------- */
function dsin(x) { return Math.sin(x * Math.PI / 180); }
function dcos(x) { return Math.cos(x * Math.PI / 180); }
function dtan(x) { return Math.tan(x * Math.PI / 180); }
// log base 10
function log10(x) { return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10; }

/* ---------- Core: build a safe JS expression ---------- */
function normalizeExpression(s) {
  // 1) Remove spaces for easier parsing
  let str = (s || "").replace(/\s+/g, "");

  // 2) Allow "sin54.2" or "sin 54.2"  â†’ "sin(54.2)"
  str = str.replace(/(sin|cos|tan|log)([-+]?\d+(\.\d+)?)/g, "$1($2)");

  // 3) Allow "âˆš9" â†’ "sqrt(9)"
  str = str.replace(/âˆš([-+]?\d+(\.\d+)?)/g, "sqrt($1)");

  // 4) Implicit multiplication BEFORE converting tokens
  //    2(3), 2sin30, (2)Ï€, Ï€2, etc.
  // number or ')' followed by '(' or function or Ï€
  str = str.replace(/(\d|\))(?=(\(|sin|cos|tan|log|sqrt|Ï€))/g, "$&*");
  // Ï€ followed by number, '(' or function
  str = str.replace(/Ï€(?=(\d|\(|sin|cos|tan|log|sqrt|Ï€))/g, "Ï€*");

  // 5) Friendly tokens â†’ JS tokens
  str = str
    .replace(/[xÃ—]/g, "*")
    .replace(/Ã·/g, "/")
    .replace(/\^/g, "")
    .replace(/Ï€/g, "Math.PI")
    .replace(/sqrt\(/g, "Math.sqrt(");

  // 6) Map funcs without breaking parentheses count
  //    (we use our degree versions so opens == closes)
  str = str
    .replace(/sin\(/g, "dsin(")
    .replace(/cos\(/g, "dcos(")
    .replace(/tan\(/g, "dtan(")
    .replace(/log\(/g, "log10(");

  // 7) More implicit multiplication after mapping (e.g., 2Math.PI, )(, )Math.sqrt)
  str = str.replace(/(\d|\))(?=(Math\.PI|Math\.sqrt|dsin|dcos|dtan|\())/g, "$&*");
  str = str.replace(/(Math\.PI|\))(?=(\d|\(|Math\.PI|Math\.sqrt|dsin|dcos|dtan))/g, "$&*");

  // 8) Auto-close missing parentheses (only adds trailing ones)
  const opens = (str.match(/\(/g) || []).length;
  const closes = (str.match(/\)/g) || []).length;
  if (opens > closes) {
    str += ")".repeat(opens - closes);
  }

  return str;
}

/* ---------- Evaluate ---------- */
function Result() {
  try {
    const exp = normalizeExpression(result.value);
    const out = eval(exp); // using only Math + our helpers
    result.value = (out === undefined || out === null) ? "Error" : out;
  } catch (e) {
    result.value = "Error";
  }
}
